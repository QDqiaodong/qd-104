import { get } from './base'
import type { UserProfile } from '@/types'

// 获取用户档案
export async function getUserProfile(): Promise<UserProfile> {
  return get<UserProfile>('/user/profile')
}
