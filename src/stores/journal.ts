import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getJournalList, getJournalDetail, publishJournal, deleteJournal as apiDeleteJournal } from '@/api/journal'
import type { Journal, JournalListRequest, PublishJournalRequest } from '@/types'

export const useJournalStore = defineStore('journal', () => {
  const journals = ref<Journal[]>([])
  const currentJournal = ref<Journal | null>(null)
  const total = ref(0)
  const loading = ref(false)

  async function fetchJournals(params: JournalListRequest) {
    loading.value = true
    try {
      const response = await getJournalList(params)
      journals.value = response?.list || []
      total.value = response?.total || 0
      return response
    } catch {
      // API不可用时返回空数据，不影响页面显示
      journals.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  async function fetchJournalDetail(id: number) {
    loading.value = true
    try {
      const response = await getJournalDetail(id)
      currentJournal.value = response
      return response
    } catch {
      currentJournal.value = null
    } finally {
      loading.value = false
    }
  }

  async function createJournal(data: PublishJournalRequest) {
    loading.value = true
    try {
      const response = await publishJournal(data)
      journals.value.unshift(response)
      total.value++
      return response
    } finally {
      loading.value = false
    }
  }

  async function removeJournal(id: number) {
    await apiDeleteJournal(id)
    journals.value = journals.value.filter(j => j.id !== id)
    total.value--
  }

  return {
    journals,
    currentJournal,
    total,
    loading,
    fetchJournals,
    fetchJournalDetail,
    createJournal,
    removeJournal
  }
})
