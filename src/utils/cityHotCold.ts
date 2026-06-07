import type { Checkin, Journal, CityHotColdItem, CityHotColdAnalysis } from '@/types'

export function analyzeCityHotCold(checkins: Checkin[], journals: Journal[]): CityHotColdAnalysis {
  const cityMap = new Map<number, {
    cityName: string
    checkins: Checkin[]
    journals: Journal[]
  }>()

  for (const checkin of checkins) {
    if (!cityMap.has(checkin.cityId)) {
      cityMap.set(checkin.cityId, {
        cityName: checkin.cityName,
        checkins: [],
        journals: []
      })
    }
    cityMap.get(checkin.cityId)!.checkins.push(checkin)
  }

  for (const journal of journals) {
    if (cityMap.has(journal.cityId)) {
      cityMap.get(journal.cityId)!.journals.push(journal)
    }
  }

  const cityItems: CityHotColdItem[] = []

  for (const [cityId, data] of cityMap) {
    const sortedCheckins = [...data.checkins].sort(
      (a, b) => new Date(a.travelTime).getTime() - new Date(b.travelTime).getTime()
    )

    const firstVisit = sortedCheckins.length > 0
      ? sortedCheckins[0].travelTime
      : data.journals.length > 0
        ? data.journals[0].createTime
        : ''

    const lastVisit = sortedCheckins.length > 0
      ? sortedCheckins[sortedCheckins.length - 1].travelTime
      : data.journals.length > 0
        ? data.journals[data.journals.length - 1].createTime
        : ''

    const locations = [...new Set(sortedCheckins.map(c => c.location).filter(Boolean))]

    const visitCount = sortedCheckins.length
    const journalCount = data.journals.length
    const totalScore = visitCount * 1 + journalCount * 2

    cityItems.push({
      cityId,
      cityName: data.cityName,
      visitCount,
      journalCount,
      totalScore,
      firstVisit,
      lastVisit,
      locations
    })
  }

  cityItems.sort((a, b) => b.totalScore - a.totalScore)

  const frequentlyVisited = cityItems.filter(city => city.visitCount >= 2)
  const onceVisited = cityItems.filter(city => city.visitCount === 1)

  const totalCities = cityItems.length
  const revisitRate = totalCities > 0
    ? Math.round((frequentlyVisited.length / totalCities) * 100)
    : 0

  const favoriteCity = frequentlyVisited.length > 0
    ? frequentlyVisited.reduce((best, city) =>
        city.totalScore > best.totalScore ? city : best
      , frequentlyVisited[0])
    : undefined

  return {
    frequentlyVisited,
    onceVisited,
    totalCities,
    revisitRate,
    favoriteCity
  }
}

export function getCityAffinityLabel(visitCount: number): string {
  if (visitCount >= 10) return '深度眷恋'
  if (visitCount >= 7) return '常客'
  if (visitCount >= 5) return '偏爱'
  if (visitCount >= 3) return '回访'
  if (visitCount >= 2) return '重游'
  return '初遇'
}

export function getCityAffinityColor(visitCount: number): string {
  if (visitCount >= 10) return 'text-rose-600'
  if (visitCount >= 7) return 'text-orange-600'
  if (visitCount >= 5) return 'text-amber-600'
  if (visitCount >= 3) return 'text-emerald-600'
  if (visitCount >= 2) return 'text-sky-600'
  return 'text-slate-500'
}

export function getCityAffinityBgColor(visitCount: number): string {
  if (visitCount >= 10) return 'bg-rose-50'
  if (visitCount >= 7) return 'bg-orange-50'
  if (visitCount >= 5) return 'bg-amber-50'
  if (visitCount >= 3) return 'bg-emerald-50'
  if (visitCount >= 2) return 'bg-sky-50'
  return 'bg-slate-50'
}
