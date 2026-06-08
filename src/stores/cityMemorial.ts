import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useCheckinStore } from './checkin'
import { useJournalStore } from './journal'
import { useAuthStore } from './auth'
import type { CityMemorialPage, TravelMethodStat, TravelMethod, Checkin, Journal, City } from '@/types'

const TRAVEL_METHOD_CONFIG: { value: TravelMethod; label: string; icon: string }[] = [
  { value: 'plane', label: '飞机', icon: '✈️' },
  { value: 'train', label: '火车', icon: '🚂' },
  { value: 'car', label: '自驾', icon: '🚗' },
  { value: 'walk', label: '步行', icon: '🚶' },
  { value: 'other', label: '其他', icon: '🚌' }
]

export const useCityMemorialStore = defineStore('cityMemorial', () => {
  const memorialPages = ref<CityMemorialPage[]>([])
  const newlyUnlockedCityId = ref<number | null>(null)
  const currentUserId = ref<number | null>(null)

  const checkinStore = useCheckinStore()
  const journalStore = useJournalStore()
  const authStore = useAuthStore()

  function getMethodConfig(method: TravelMethod) {
    return TRAVEL_METHOD_CONFIG.find(m => m.value === method) || TRAVEL_METHOD_CONFIG[TRAVEL_METHOD_CONFIG.length - 1]
  }

  function calculateTotalDays(checkins: Checkin[]): number {
    if (checkins.length === 0) return 0
    const dates = new Set(checkins.map(c => {
      const d = new Date(c.travelTime)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }))
    return dates.size
  }

  function getTravelMethodStats(checkins: Checkin[]): TravelMethodStat[] {
    const methodMap = new Map<TravelMethod, number>()
    for (const checkin of checkins) {
      const count = methodMap.get(checkin.travelMethod) || 0
      methodMap.set(checkin.travelMethod, count + 1)
    }

    const stats: TravelMethodStat[] = []
    for (const [method, count] of methodMap) {
      const config = getMethodConfig(method)
      stats.push({
        method,
        count,
        label: config.label,
        icon: config.icon
      })
    }

    stats.sort((a, b) => b.count - a.count)
    return stats
  }

  function getRepresentativePhotos(journals: Journal[]): string[] {
    const photos: string[] = []

    for (const journal of journals) {
      if (journal.images && journal.images.length > 0) {
        photos.push(...journal.images)
      }
    }

    return photos.slice(0, 9)
  }

  function getCityById(cityId: number): City | undefined {
    return checkinStore.cities.find(c => c.id === cityId)
  }

  function getCurrentUserId(): number | null {
    return authStore.user?.id || null
  }

  function isCurrentUserLoaded(): boolean {
    return authStore.user !== null && authStore.user.id !== undefined
  }

  function generateMemorialPage(cityId: number, isNew: boolean = false): CityMemorialPage | null {
    const cityCheckins = checkinStore.checkins.filter(c => c.cityId === cityId)
    if (cityCheckins.length === 0) return null

    const city = getCityById(cityId)
    const sortedCheckins = [...cityCheckins].sort(
      (a, b) => new Date(a.travelTime).getTime() - new Date(b.travelTime).getTime()
    )

    const userId = getCurrentUserId()
    const myJournals = userId
      ? journalStore.journals.filter(j => j.authorId === userId && j.cityId === cityId)
      : []

    const firstVisit = sortedCheckins[0].travelTime
    const lastVisit = sortedCheckins[sortedCheckins.length - 1].travelTime
    const locations = [...new Set(sortedCheckins.map(c => c.location).filter(Boolean))]
    const travelMethods = getTravelMethodStats(sortedCheckins)
    const primaryTravelMethod = travelMethods.length > 0 ? travelMethods[0].method : undefined
    const representativePhotos = getRepresentativePhotos(myJournals)

    return {
      cityId,
      cityName: sortedCheckins[0].cityName,
      cityProvince: city?.province || '',
      cityDescription: city?.description,
      firstVisit,
      lastVisit,
      visitCount: sortedCheckins.length,
      totalDays: calculateTotalDays(sortedCheckins),
      journals: myJournals,
      journalCount: myJournals.length,
      representativePhotos,
      travelMethods,
      primaryTravelMethod,
      locations,
      checkins: sortedCheckins,
      createTime: firstVisit,
      isNewlyUnlocked: isNew
    }
  }

  function generateAllMemorialPages() {
    const cityIds = [...new Set(checkinStore.checkins.map(c => c.cityId))]
    const pages: CityMemorialPage[] = []

    for (const cityId of cityIds) {
      const page = generateMemorialPage(cityId, false)
      if (page) {
        pages.push(page)
      }
    }

    pages.sort((a, b) => new Date(b.firstVisit).getTime() - new Date(a.firstVisit).getTime())
    memorialPages.value = pages
  }

  function checkForNewCity(previousCheckinCount: number, currentCheckinCount: number) {
    if (currentCheckinCount <= previousCheckinCount) return

    const previousCityIds = new Set(
      checkinStore.checkins.slice(0, previousCheckinCount).map(c => c.cityId)
    )
    const currentCityIds = new Set(checkinStore.checkins.map(c => c.cityId))

    for (const cityId of currentCityIds) {
      if (!previousCityIds.has(cityId)) {
        newlyUnlockedCityId.value = cityId
        const newPage = generateMemorialPage(cityId, true)
        if (newPage) {
          memorialPages.value.unshift(newPage)
        }
        break
      }
    }
  }

  function getMemorialPage(cityId: number): CityMemorialPage | undefined {
    return memorialPages.value.find(p => p.cityId === cityId)
  }

  function clearNewlyUnlocked() {
    newlyUnlockedCityId.value = null
    for (const page of memorialPages.value) {
      page.isNewlyUnlocked = false
    }
  }

  function ensureMemorialPage(cityId: number): CityMemorialPage | null {
    let page = getMemorialPage(cityId)
    if (!page) {
      page = generateMemorialPage(cityId, false)
      if (page) {
        memorialPages.value.push(page)
      }
    }
    return page || null
  }

  function resetMemorialPages() {
    memorialPages.value = []
    newlyUnlockedCityId.value = null
    previousCheckinCount = 0
    currentUserId.value = getCurrentUserId()
  }

  const sortedPages = computed(() => {
    return [...memorialPages.value].sort(
      (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
    )
  })

  let previousCheckinCount = 0

  watch(
    () => authStore.user?.id,
    (newUserId, oldUserId) => {
      if (newUserId !== oldUserId) {
        resetMemorialPages()
        if (newUserId != null && checkinStore.checkins.length > 0) {
          generateAllMemorialPages()
        }
      }
    },
    { immediate: true }
  )

  watch(
    () => checkinStore.checkins.length,
    (newCount) => {
      const userId = getCurrentUserId()
      if (userId == null) return

      if (memorialPages.value.length === 0) {
        generateAllMemorialPages()
      } else {
        checkForNewCity(previousCheckinCount, newCount)
      }
      previousCheckinCount = newCount
    }
  )

  watch(
    () => journalStore.journals.length,
    (newCount, oldCount) => {
      const userId = getCurrentUserId()
      if (userId == null) return

      if (newCount !== oldCount && memorialPages.value.length > 0) {
        generateAllMemorialPages()
      }
    }
  )

  return {
    memorialPages,
    newlyUnlockedCityId,
    sortedPages,
    generateAllMemorialPages,
    getMemorialPage,
    ensureMemorialPage,
    clearNewlyUnlocked,
    getMethodConfig,
    resetMemorialPages
  }
})
