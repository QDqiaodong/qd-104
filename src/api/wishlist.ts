import { get, post, put, del } from './base'
import type { WishlistItem, WishlistRequest } from '@/types'

export async function getWishlist(): Promise<WishlistItem[]> {
  return get<WishlistItem[]>('/wishlist')
}

export async function addWishlist(data: WishlistRequest): Promise<WishlistItem> {
  return post<WishlistItem>('/wishlist', data)
}

export async function updateWishlist(id: number, data: WishlistRequest): Promise<WishlistItem> {
  return put<WishlistItem>(`/wishlist/${id}`, data)
}

export async function deleteWishlist(id: number): Promise<void> {
  return del<void>(`/wishlist/${id}`)
}
