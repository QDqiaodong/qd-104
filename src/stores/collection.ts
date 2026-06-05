import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCollections } from '@/api/journal'
import type { Journal } from '@/types'

export const useCollectionStore = defineStore('collection', () => {
  const journals = ref<Journal[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchCollections() {
    loading.value = true
    try {
      const response = await getCollections(1, 100)
      journals.value = response.list
      total.value = response.total
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    await fetchCollections()
  }

  return {
    journals,
    total,
    loading,
    fetchCollections,
    refresh
  }
})
