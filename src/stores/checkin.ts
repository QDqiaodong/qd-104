import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCheckinList, createCheckin as apiCreateCheckin, getCities } from '@/api/checkin'
import type { Checkin, CheckinRequest, City } from '@/types'
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

  return {
    checkins,
    cities,
    total,
    loading,
    fetchCheckins,
    fetchCities,
    createCheckin
  }
})
