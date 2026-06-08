import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, register as apiRegister, getCurrentUser } from '@/api/auth'
import type { LoginRequest, RegisterRequest, User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)
  const currentUserId = computed<number | null>(() => user.value?.id ?? null)

  async function login(data: LoginRequest) {
    loading.value = true
    try {
      const response = await apiLogin(data)
      token.value = response.token
      user.value = {
        id: response.userId,
        email: response.email,
        nickname: response.nickname
      }
      localStorage.setItem('token', response.token)
      return response
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterRequest) {
    loading.value = true
    try {
      const response = await apiRegister(data)
      token.value = response.token
      user.value = {
        id: response.userId,
        email: response.email,
        nickname: response.nickname
      }
      localStorage.setItem('token', response.token)
      return response
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) return null
    try {
      const response = await getCurrentUser()
      user.value = response
      return response
    } catch {
      logout()
      return null
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    user,
    loading,
    isLoggedIn,
    currentUserId,
    login,
    register,
    fetchCurrentUser,
    logout
  }
})
