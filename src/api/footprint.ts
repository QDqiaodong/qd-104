import { get } from './base'
import type { FootprintHeatmapData } from '@/types'

export interface HeatmapParams {
  year?: number
  month?: number
}

export async function getFootprintHeatmap(params?: HeatmapParams): Promise<FootprintHeatmapData[]> {
  return get<FootprintHeatmapData[]>('/footprint/heatmap', params)
}

export async function getFootprintByDate(date: string): Promise<FootprintHeatmapData> {
  return get<FootprintHeatmapData>(`/footprint/date/${date}`)
}
