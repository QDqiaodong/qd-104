import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCheckinList, createCheckin as apiCreateCheckin, getCities } from '@/api/checkin'
import { analyzeLocationKeywords } from '@/utils/locationKeywords'
import type { Checkin, CheckinRequest, City, CityVisitArchive } from '@/types'
import type { CheckinListParams } from '@/api/checkin'

export const useCheckinStore = defineStore('checkin', () => {
  const checkins = ref<Checkin[]>([])
  const cities = ref<City[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchCheckins(params?: CheckinListParams) {
    loading.value = true
    try {
      const response = await getCheckinList(params)
      checkins.value = response.list
      total.value = response.total
      return response
    } finally {
      loading.value = false
    }
  }

  async function fetchCities() {
    if (cities.value.length > 0) return cities.value
    const response = await getCities()
    cities.value = response
    return response
  }

  async function createCheckin(data: CheckinRequest) {
    loading.value = true
    try {
      const response = await apiCreateCheckin(data)
      checkins.value.unshift(response)
      total.value++
      return response
    } finally {
      loading.value = false
    }
  }

  const cityVisitArchives = computed<CityVisitArchive[]>(() => {
    const cityMap = new Map<number, Checkin[]>()

    for (const checkin of checkins.value) {
      if (!cityMap.has(checkin.cityId)) {
        cityMap.set(checkin.cityId, [])
      }
      cityMap.get(checkin.cityId)!.push(checkin)
    }

    const archives: CityVisitArchive[] = []

    for (const [cityId, cityCheckins] of cityMap) {
      const sortedCheckins = [...cityCheckins].sort(
        (a, b) => new Date(a.travelTime).getTime() - new Date(b.travelTime).getTime()
      )

      const firstVisit = sortedCheckins[0].travelTime
      const lastVisit = sortedCheckins[sortedCheckins.length - 1].travelTime
      const locations = [...new Set(sortedCheckins.map(c => c.location).filter(Boolean))]

      archives.push({
        cityId,
        cityName: sortedCheckins[0].cityName,
        firstVisit,
        lastVisit,
        visitCount: sortedCheckins.length,
        locations,
        checkins: sortedCheckins,
        keywordSummary: analyzeLocationKeywords(sortedCheckins)
      })
    }

    archives.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())

    return archives
  })

  return {
    checkins,
    cities,
    total,
    loading,
    cityVisitArchives,
    fetchCheckins,
    fetchCities,
    createCheckin
  }
})
