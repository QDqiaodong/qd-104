import { get, post } from './base'
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types'

// 用户注册
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/register', data)
}

// 用户登录
export async function login(data: LoginRequest): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/login', data)
}

// 获取当前用户信息
export async function getCurrentUser(): Promise<User> {
  return get<User>('/auth/current')
}
