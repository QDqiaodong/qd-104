import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getWishlist, addWishlist as apiAddWishlist, updateWishlist as apiUpdateWishlist, deleteWishlist as apiDeleteWishlist } from '@/api/wishlist'
import type { WishlistItem, WishlistRequest } from '@/types'

export const useWishlistStore = defineStore('wishlist', () => {
  const wishlist = ref<WishlistItem[]>([])
  const loading = ref(false)

  async function fetchWishlist() {
    loading.value = true
    try {
      const response = await getWishlist()
      wishlist.value = response
      return response
    } finally {
      loading.value = false
    }
  }

  async function addWishlist(data: WishlistRequest) {
    loading.value = true
    try {
      const response = await apiAddWishlist(data)
      wishlist.value.unshift(response)
      return response
    } finally {
      loading.value = false
    }
  }

  async function updateWishlist(id: number, data: WishlistRequest) {
    loading.value = true
    try {
      const response = await apiUpdateWishlist(id, data)
      const index = wishlist.value.findIndex(item => item.id === id)
      if (index !== -1) {
        wishlist.value[index] = response
      }
      return response
    } finally {
      loading.value = false
    }
  }

  async function removeWishlist(id: number) {
    loading.value = true
    try {
      await apiDeleteWishlist(id)
      wishlist.value = wishlist.value.filter(item => item.id !== id)
    } finally {
      loading.value = false
    }
  }

  return {
    wishlist,
    loading,
    fetchWishlist,
    addWishlist,
    updateWishlist,
    removeWishlist
  }
})
