import type { Checkin, Journal, TravelMethod } from '@/types'

export interface MilestoneItem {
  id: string
  type: 'first_journal' | 'first_city' | 'top_transport' | 'peak_month'
  title: string
  subtitle: string
  description: string
  icon: string
  date?: string
  value?: string
  accentColor: string
  gradientFrom: string
  gradientTo: string
}

const TRAVEL_METHOD_NAMES: Record<TravelMethod, string> = {
  plane: '飞机',
  train: '火车',
  car: '自驾',
  walk: '步行',
  other: '其他'
}

const TRAVEL_METHOD_ICONS: Record<TravelMethod, string> = {
  plane: '✈️',
  train: '🚄',
  car: '🚗',
  walk: '🚶',
  other: '🎒'
}

const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function getFirstJournal(journals: Journal[]): MilestoneItem | null {
  if (!journals || journals.length === 0) return null

  const sorted = [...journals].sort(
    (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
  )
  const first = sorted[0]

  return {
    id: 'first_journal',
    type: 'first_journal',
    title: '第一篇游记',
    subtitle: first.title,
    description: `在${first.cityName}写下了旅行故事的开篇`,
    icon: '📝',
    date: formatDate(first.createTime),
    value: first.title,
    accentColor: 'text-rose-600',
    gradientFrom: 'from-rose-400',
    gradientTo: 'to-pink-500'
  }
}

function getFirstCity(checkins: Checkin[]): MilestoneItem | null {
  if (!checkins || checkins.length === 0) return null

  const sorted = [...checkins].sort(
    (a, b) => new Date(a.travelTime).getTime() - new Date(b.travelTime).getTime()
  )
  const first = sorted[0]

  return {
    id: 'first_city',
    type: 'first_city',
    title: '第一座打卡城市',
    subtitle: first.cityName,
    description: `旅行的足迹从${first.cityName}开始延伸`,
    icon: '📍',
    date: formatDate(first.travelTime),
    value: first.cityName,
    accentColor: 'text-sky-600',
    gradientFrom: 'from-sky-400',
    gradientTo: 'to-blue-500'
  }
}

function getTopTransport(checkins: Checkin[]): MilestoneItem | null {
  if (!checkins || checkins.length === 0) return null

  const countMap: Record<string, number> = {}
  checkins.forEach(c => {
    countMap[c.travelMethod] = (countMap[c.travelMethod] || 0) + 1
  })

  let topMethod: TravelMethod = 'other'
  let maxCount = 0
  Object.entries(countMap).forEach(([method, count]) => {
    if (count > maxCount) {
      maxCount = count
      topMethod = method as TravelMethod
    }
  })

  const percentage = Math.round((maxCount / checkins.length) * 100)

  return {
    id: 'top_transport',
    type: 'top_transport',
    title: '最高频出行方式',
    subtitle: TRAVEL_METHOD_NAMES[topMethod],
    description: `${percentage}% 的旅程都以${TRAVEL_METHOD_NAMES[topMethod]}为伴`,
    icon: TRAVEL_METHOD_ICONS[topMethod],
    value: `${maxCount}次 · ${percentage}%`,
    accentColor: 'text-emerald-600',
    gradientFrom: 'from-emerald-400',
    gradientTo: 'to-teal-500'
  }
}

function getPeakMonth(checkins: Checkin[]): MilestoneItem | null {
  if (!checkins || checkins.length === 0) return null

  const monthlyCount: number[] = Array(12).fill(0)
  checkins.forEach(c => {
    const month = new Date(c.travelTime).getMonth()
    monthlyCount[month]++
  })

  let peakMonth = 0
  let maxCount = 0
  monthlyCount.forEach((count, month) => {
    if (count > maxCount) {
      maxCount = count
      peakMonth = month
    }
  })

  return {
    id: 'peak_month',
    type: 'peak_month',
    title: '最密集出行月份',
    subtitle: MONTH_NAMES[peakMonth],
    description: `${MONTH_NAMES[peakMonth]}是你最忙碌的旅行季节`,
    icon: '📅',
    value: `${maxCount}次出行`,
    accentColor: 'text-amber-600',
    gradientFrom: 'from-amber-400',
    gradientTo: 'to-orange-500'
  }
}

export function generateMilestones(checkins: Checkin[], journals: Journal[]): MilestoneItem[] {
  const milestones: MilestoneItem[] = []

  const firstCity = getFirstCity(checkins)
  if (firstCity) milestones.push(firstCity)

  const firstJournal = getFirstJournal(journals)
  if (firstJournal) milestones.push(firstJournal)

  const topTransport = getTopTransport(checkins)
  if (topTransport) milestones.push(topTransport)

  const peakMonth = getPeakMonth(checkins)
  if (peakMonth) milestones.push(peakMonth)

  return milestones
}

export function getMilestoneTheaterTitle(milestoneCount: number): string {
  if (milestoneCount === 0) return '旅行剧场待开启'
  if (milestoneCount <= 2) return '旅行序章'
  if (milestoneCount <= 3) return '旅途进行时'
  return '人生旅途剧场'
}
