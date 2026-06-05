import axios, { type AxiosInstance, type AxiosError, type AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default instance

// 封装通用请求方法
export async function get<T>(url: string, params?: object): Promise<T> {
  const response = await instance.get<ApiResponse<T>>(url, { params })
  return response.data as T
}

export async function post<T>(url: string, data?: object): Promise<T> {
  const response = await instance.post<ApiResponse<T>>(url, data)
  return response.data as T
}

export async function put<T>(url: string, data?: object): Promise<T> {
  const response = await instance.put<ApiResponse<T>>(url, data)
  return response.data as T
}

export async function del<T>(url: string): Promise<T> {
  const response = await instance.delete<ApiResponse<T>>(url)
  return response.data as T
}
