import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserProfile } from '@/api/user'
import type { UserProfile } from '@/types'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)

  async function fetchProfile() {
    loading.value = true
    try {
      const response = await getUserProfile()
      profile.value = response
      return response
    } finally {
      loading.value = false
    }
  }

  return {
    profile,
    loading,
    fetchProfile
  }
})
