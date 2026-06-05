import { get, post } from './base'
import type { Checkin, CheckinRequest, CheckinListResponse, City } from '@/types'

export interface CheckinListParams {
  sortBy?: 'travel_time' | 'create_time'
  sortOrder?: 'asc' | 'desc'
}

// 获取打卡列表
export async function getCheckinList(params?: CheckinListParams): Promise<CheckinListResponse> {
  return get<CheckinListResponse>('/checkin/list', params)
}

// 创建打卡记录
export async function createCheckin(data: CheckinRequest): Promise<Checkin> {
  return post<Checkin>('/checkin', data)
}

// 获取城市字典
export async function getCities(): Promise<City[]> {
  return get<City[]>('/cities')
}
