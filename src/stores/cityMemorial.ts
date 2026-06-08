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
  const newlyUnlockedCityId = ref<number | null>(null)
  const newlyUnlockedCityName = ref<string>('')
  const showUnlockAnimation = ref(false)

  const checkinStore = useCheckinStore()
  const journalStore = useJournalStore()
  const authStore = useAuthStore()

  const currentUserId = computed(() => authStore.user?.id ?? null)

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

  const myJournals = computed(() => {
    const userId = currentUserId.value
    if (userId == null) return []
    return journalStore.journals.filter(j => j.authorId === userId)
  })

  const cityIds = computed(() => {
    const ids = new Set(checkinStore.checkins.map(c => c.cityId))
    return Array.from(ids)
  })

  const memorialPages = computed<CityMemorialPage[]>(() => {
    const userId = currentUserId.value
    if (userId == null) return []
    if (checkinStore.checkins.length === 0) return []

    const cityMap = new Map<number, Checkin[]>()
    for (const checkin of checkinStore.checkins) {
      if (!cityMap.has(checkin.cityId)) {
        cityMap.set(checkin.cityId, [])
      }
      cityMap.get(checkin.cityId)!.push(checkin)
    }

    const pages: CityMemorialPage[] = []

    for (const [cityId, cityCheckins] of cityMap) {
      const sortedCheckins = [...cityCheckins].sort(
        (a, b) => new Date(a.travelTime).getTime() - new Date(b.travelTime).getTime()
      )

      const city = getCityById(cityId)
      const cityJournals = myJournals.value.filter(j => j.cityId === cityId)
      const firstVisit = sortedCheckins[0].travelTime
      const lastVisit = sortedCheckins[sortedCheckins.length - 1].travelTime
      const locations = [...new Set(sortedCheckins.map(c => c.location).filter(Boolean))]
      const travelMethods = getTravelMethodStats(sortedCheckins)
      const primaryTravelMethod = travelMethods.length > 0 ? travelMethods[0].method : undefined
      const representativePhotos = getRepresentativePhotos(cityJournals)

      pages.push({
        cityId,
        cityName: sortedCheckins[0].cityName,
        cityProvince: city?.province || '',
        cityDescription: city?.description,
        firstVisit,
        lastVisit,
        visitCount: sortedCheckins.length,
        totalDays: calculateTotalDays(sortedCheckins),
        journals: cityJournals,
        journalCount: cityJournals.length,
        representativePhotos,
        travelMethods,
        primaryTravelMethod,
        locations,
        checkins: sortedCheckins,
        createTime: firstVisit,
        isNewlyUnlocked: newlyUnlockedCityId.value === cityId
      })
    }

    pages.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
    return pages
  })

  const sortedPages = computed(() => memorialPages.value)

  function getMemorialPage(cityId: number): CityMemorialPage | undefined {
    return memorialPages.value.find(p => p.cityId === cityId)
  }

  function ensureMemorialPage(cityId: number): CityMemorialPage | null {
    return getMemorialPage(cityId) || null
  }

  function clearNewlyUnlocked() {
    newlyUnlockedCityId.value = null
    newlyUnlockedCityName.value = ''
    showUnlockAnimation.value = false
  }

  function triggerUnlockAnimation(cityId: number, cityName: string) {
    newlyUnlockedCityId.value = cityId
    newlyUnlockedCityName.value = cityName
    showUnlockAnimation.value = true
  }

  let previousCityCount = 0

  watch(
    () => cityIds.value.length,
    (newCount) => {
      const userId = currentUserId.value
      if (userId == null) {
        previousCityCount = 0
        return
      }

      if (newCount > previousCityCount && previousCityCount > 0) {
        const oldCityIds = new Set(
          checkinStore.checkins
            .slice(0, checkinStore.checkins.length - (newCount - previousCityCount))
            .map(c => c.cityId)
        )
        
        for (const id of cityIds.value) {
          if (!oldCityIds.has(id)) {
            const cityName = getCityById(id)?.name || '新城市'
            triggerUnlockAnimation(id, cityName)
            break
          }
        }
      }
      
      previousCityCount = newCount
    },
    { immediate: true }
  )

  watch(
    currentUserId,
    (newUserId) => {
      clearNewlyUnlocked()
      previousCityCount = 0
      if (newUserId != null) {
        previousCityCount = cityIds.value.length
      }
    }
  )

  return {
    memorialPages,
    newlyUnlockedCityId,
    newlyUnlockedCityName,
    showUnlockAnimation,
    sortedPages,
    currentUserId,
    myJournals,
    getMemorialPage,
    ensureMemorialPage,
    clearNewlyUnlocked,
    triggerUnlockAnimation,
    getMethodConfig
  }
})
