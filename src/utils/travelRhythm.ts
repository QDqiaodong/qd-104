import type {
  TravelRhythmType,
  TravelRhythmLabel,
  TravelRhythmPortrait,
  TravelRhythmScore,
  MonthlyDistribution,
  WeekdayDistribution,
  Checkin
} from '@/types'

export const TRAVEL_RHYTHMS: TravelRhythmLabel[] = [
  {
    id: 'weekend',
    name: '周末短途达人',
    icon: '🏕️',
    tagline: '周末出逃计划',
    description: '善于利用周末时间探索周边，短途旅行的一把好手',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    gradientFrom: 'from-amber-400',
    gradientTo: 'to-orange-500'
  },
  {
    id: 'holiday',
    name: '假日集中派',
    icon: '🎉',
    tagline: '假期就要玩尽兴',
    description: '长假是旅行的主战场，节假日出行密度高',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    gradientFrom: 'from-rose-400',
    gradientTo: 'to-pink-500'
  },
  {
    id: 'offpeak',
    name: '淡季错峰玩家',
    icon: '🌿',
    tagline: '人少景美才是王道',
    description: '避开人流高峰，专挑淡季出行，独享风景',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    gradientFrom: 'from-emerald-400',
    gradientTo: 'to-teal-500'
  },
  {
    id: 'slowtravel',
    name: '长线慢游派',
    icon: '🚞',
    tagline: '慢慢走，细细品',
    description: '一次旅行走多个城市，享受在路上的感觉',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    gradientFrom: 'from-indigo-400',
    gradientTo: 'to-purple-500'
  }
]

const CHINA_HOLIDAYS_2024: Record<string, string> = {
  '01-01': '元旦',
  '02-10': '春节', '02-11': '春节', '02-12': '春节', '02-13': '春节', '02-14': '春节', '02-15': '春节', '02-16': '春节', '02-17': '春节',
  '04-04': '清明', '04-05': '清明', '04-06': '清明',
  '05-01': '五一', '05-02': '五一', '05-03': '五一', '05-04': '五一', '05-05': '五一',
  '06-08': '端午', '06-09': '端午', '06-10': '端午',
  '09-15': '中秋', '09-16': '中秋', '09-17': '中秋',
  '10-01': '国庆', '10-02': '国庆', '10-03': '国庆', '10-04': '国庆', '10-05': '国庆', '10-06': '国庆', '10-07': '国庆'
}

const PEAK_SEASON_MONTHS = [1, 2, 5, 7, 8, 10]
const OFF_SEASON_MONTHS = [3, 4, 6, 9, 11, 12]

export function getRhythmById(id: TravelRhythmType): TravelRhythmLabel | undefined {
  return TRAVEL_RHYTHMS.find(r => r.id === id)
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function isHoliday(date: Date): boolean {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const key = `${month}-${day}`
  return key in CHINA_HOLIDAYS_2024
}

export function isPeakSeason(month: number): boolean {
  return PEAK_SEASON_MONTHS.includes(month)
}

export function analyzeTravelRhythm(checkins: Checkin[]): TravelRhythmPortrait {
  if (!checkins || checkins.length === 0) {
    return {
      primaryRhythm: 'weekend',
      scores: TRAVEL_RHYTHMS.map(r => ({ type: r.id, score: 0, percentage: 0 })),
      monthlyDistribution: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 })),
      weekdayDistribution: Array.from({ length: 7 }, (_, i) => ({ weekday: i, count: 0 })),
      totalCheckins: 0,
      peakSeason: '暂无数据',
      travelStyle: '待探索'
    }
  }

  const dates = checkins.map(c => new Date(c.travelTime)).sort((a, b) => a.getTime() - b.getTime())

  const monthlyDist: MonthlyDistribution[] = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }))
  const weekdayDist: WeekdayDistribution[] = Array.from({ length: 7 }, (_, i) => ({ weekday: i, count: 0 }))

  let weekendCount = 0
  let holidayCount = 0
  let peakSeasonCount = 0
  let offSeasonCount = 0

  dates.forEach(date => {
    const month = date.getMonth()
    const weekday = date.getDay()

    monthlyDist[month].count++
    weekdayDist[weekday].count++

    if (isWeekend(date)) weekendCount++
    if (isHoliday(date)) holidayCount++
    if (isPeakSeason(month + 1)) peakSeasonCount++
    else offSeasonCount++
  })

  const trips = groupIntoTrips(checkins)
  const avgTripLength = trips.length > 0
    ? trips.reduce((sum, trip) => sum + trip.length, 0) / trips.length
    : 0
  const avgCitiesPerTrip = trips.length > 0
    ? trips.reduce((sum, trip) => sum + trip.uniqueCities, 0) / trips.length
    : 0

  const total = dates.length

  const weekendScore = total > 0 ? (weekendCount / total) * 100 : 0
  const holidayScore = total > 0 ? (holidayCount / total) * 100 : 0
  const peakSeasonScore = total > 0 ? (peakSeasonCount / total) * 100 : 0
  const offSeasonScore = total > 0 ? (offSeasonCount / total) * 100 : 0

  const slowTravelScore = Math.min(100, (avgTripLength * 15) + (avgCitiesPerTrip * 20))

  const weekendFinal = weekendScore * 1.2
  const holidayFinal = holidayScore * 1.5
  const offPeakFinal = offSeasonScore * 1.0
  const slowTravelFinal = slowTravelScore * 0.8

  const rawScores = [
    { type: 'weekend' as TravelRhythmType, score: weekendFinal },
    { type: 'holiday' as TravelRhythmType, score: holidayFinal },
    { type: 'offpeak' as TravelRhythmType, score: offPeakFinal },
    { type: 'slowtravel' as TravelRhythmType, score: slowTravelFinal }
  ]

  const totalScore = rawScores.reduce((sum, s) => sum + s.score, 0)
  const scores: TravelRhythmScore[] = rawScores.map(s => ({
    type: s.type,
    score: Math.round(s.score * 10) / 10,
    percentage: totalScore > 0 ? Math.round((s.score / totalScore) * 100) : 0
  })).sort((a, b) => b.score - a.score)

  const primaryRhythm = scores[0].type
  const secondaryRhythm = scores[1].score > 0 ? scores[1].type : undefined

  const peakMonth = monthlyDist.reduce((max, m) => m.count > max.count ? m : max, monthlyDist[0])
  const peakSeasonName = getSeasonName(peakMonth.month)

  const travelStyle = generateTravelStyle(primaryRhythm, secondaryRhythm, avgTripLength)

  return {
    primaryRhythm,
    secondaryRhythm,
    scores,
    monthlyDistribution: monthlyDist,
    weekdayDistribution: weekdayDist,
    totalCheckins: total,
    peakSeason: peakSeasonName,
    travelStyle
  }
}

interface TripGroup {
  checkins: Checkin[]
  length: number
  uniqueCities: number
  startDate: Date
  endDate: Date
}

function groupIntoTrips(checkins: Checkin[]): TripGroup[] {
  if (checkins.length === 0) return []

  const sorted = [...checkins].sort((a, b) =>
    new Date(a.travelTime).getTime() - new Date(b.travelTime).getTime()
  )

  const trips: TripGroup[] = []
  let currentTrip: Checkin[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].travelTime)
    const currDate = new Date(sorted[i].travelTime)
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 3) {
      currentTrip.push(sorted[i])
    } else {
      trips.push(buildTripGroup(currentTrip))
      currentTrip = [sorted[i]]
    }
  }

  if (currentTrip.length > 0) {
    trips.push(buildTripGroup(currentTrip))
  }

  return trips
}

function buildTripGroup(checkins: Checkin[]): TripGroup {
  const dates = checkins.map(c => new Date(c.travelTime))
  const startDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const endDate = new Date(Math.max(...dates.map(d => d.getTime())))
  const length = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  const uniqueCities = new Set(checkins.map(c => c.cityId)).size

  return { checkins, length, uniqueCities, startDate, endDate }
}

function getSeasonName(month: number): string {
  const seasonMap: Record<number, string> = {
    1: '深冬', 2: '初春', 3: '暮春', 4: '初夏', 5: '仲夏', 6: '盛夏',
    7: '酷暑', 8: '金秋', 9: '深秋', 10: '初冬', 11: '隆冬', 12: '寒冬'
  }
  return seasonMap[month] || `${month}月`
}

function generateTravelStyle(
  primary: TravelRhythmType,
  secondary?: TravelRhythmType,
  avgTripLength?: number
): string {
  const primaryLabel = getRhythmById(primary)
  const secondaryLabel = secondary ? getRhythmById(secondary) : null

  if (!primaryLabel) return '旅行探索者'

  if (secondaryLabel && secondary !== primary) {
    const combos: Record<string, string> = {
      'weekend+holiday': '假期双倍快乐玩家',
      'weekend+offpeak': '周末错峰达人',
      'weekend+slowtravel': '周末漫行者',
      'holiday+weekend': '假日周末两不误',
      'holiday+offpeak': '聪明的假日玩家',
      'holiday+slowtravel': '长假深度探索家',
      'offpeak+weekend': '周末避世派',
      'offpeak+holiday': '错峰假日玩家',
      'offpeak+slowtravel': '深度慢游家',
      'slowtravel+weekend': '周末漫游者',
      'slowtravel+holiday': '长假漫游达人',
      'slowtravel+offpeak': '慢节奏独行侠'
    }
    const key = `${primary}+${secondary}`
    if (combos[key]) return combos[key]
  }

  return primaryLabel.name
}

export const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
