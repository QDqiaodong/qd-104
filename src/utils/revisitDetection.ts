import type { Checkin, RevisitInfo, RevisitType, LocationMatchResult } from '@/types'

const HIGH_SIMILARITY_THRESHOLD = 0.75
const MEDIUM_SIMILARITY_THRESHOLD = 0.5

export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        )
      }
    }
  }

  return dp[m][n]
}

export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  
  const maxLen = Math.max(s1.length, s2.length)
  if (maxLen === 0) return 1
  
  const distance = levenshteinDistance(s1, s2)
  const baseSimilarity = 1 - distance / maxLen
  
  let bonus = 0
  
  if (s1.includes(s2) || s2.includes(s1)) {
    bonus += 0.15
  }
  
  const prefixLen = getCommonPrefixLength(s1, s2)
  if (prefixLen >= 2) {
    bonus += Math.min(0.1, prefixLen / maxLen * 0.2)
  }
  
  const suffixLen = getCommonSuffixLength(s1, s2)
  if (suffixLen >= 2) {
    bonus += Math.min(0.1, suffixLen / maxLen * 0.2)
  }
  
  return Math.min(1, baseSimilarity + bonus)
}

function getCommonPrefixLength(str1: string, str2: string): number {
  let i = 0
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    i++
  }
  return i
}

function getCommonSuffixLength(str1: string, str2: string): number {
  let i = 0
  const len1 = str1.length
  const len2 = str2.length
  while (i < len1 && i < len2 && str1[len1 - 1 - i] === str2[len2 - 1 - i]) {
    i++
  }
  return i
}

export function findBestLocationMatch(
  location: string,
  checkins: Checkin[],
  cityId?: number
): LocationMatchResult {
  if (!checkins || checkins.length === 0) {
    return { isMatch: false, similarity: 0 }
  }

  const candidates = cityId 
    ? checkins.filter(c => c.cityId === cityId)
    : checkins

  if (candidates.length === 0) {
    return { isMatch: false, similarity: 0 }
  }

  let bestMatch: Checkin | null = null
  let bestSimilarity = 0

  for (const checkin of candidates) {
    const similarity = calculateSimilarity(location, checkin.location)
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity
      bestMatch = checkin
    }
  }

  const isMatch = bestSimilarity >= HIGH_SIMILARITY_THRESHOLD

  const result: LocationMatchResult = {
    isMatch,
    similarity: Math.round(bestSimilarity * 100) / 100
  }

  if (bestMatch) {
    result.matchedCheckin = bestMatch
    result.daysSinceLastVisit = calculateDaysSince(bestMatch.travelTime)
  }

  return result
}

export function calculateDaysSince(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function detectRevisit(
  newCheckinData: { cityId: number; location: string; travelTime: string },
  historicalCheckins: Checkin[]
): RevisitInfo {
  const { cityId, location, travelTime } = newCheckinData

  const cityCheckins = historicalCheckins.filter(c => c.cityId === cityId)
  const hasCityVisited = cityCheckins.length > 0

  if (!hasCityVisited) {
    return {
      type: 'new_city',
      totalVisitsInCity: 0
    }
  }

  const locationMatch = findBestLocationMatch(location, historicalCheckins, cityId)
  const totalVisitsInCity = cityCheckins.length

  if (locationMatch.isMatch && locationMatch.matchedCheckin) {
    return {
      type: 'revisit_location',
      matchedCheckinId: locationMatch.matchedCheckin.id,
      matchedLocation: locationMatch.matchedCheckin.location,
      matchedCityName: locationMatch.matchedCheckin.cityName,
      daysSinceLastVisit: locationMatch.daysSinceLastVisit,
      totalVisitsInCity,
      similarityScore: locationMatch.similarity
    }
  }

  const lastCityVisit = cityCheckins.reduce((latest, curr) => {
    return new Date(curr.travelTime) > new Date(latest.travelTime) ? curr : latest
  })

  return {
    type: 'same_city_new',
    matchedCityName: lastCityVisit.cityName,
    daysSinceLastVisit: calculateDaysSince(lastCityVisit.travelTime),
    totalVisitsInCity,
    similarityScore: locationMatch.similarity
  }
}

export function getRevisitLabel(type: RevisitType): string {
  const labels: Record<RevisitType, string> = {
    'revisit_location': '重访旧地点',
    'same_city_new': '同城新探索',
    'new_city': '新城初遇'
  }
  return labels[type]
}

export function getRevisitEmoji(type: RevisitType): string {
  const emojis: Record<RevisitType, string> = {
    'revisit_location': '🔄',
    'same_city_new': '✨',
    'new_city': '🆕'
  }
  return emojis[type]
}

export function getRevisitDescription(info: RevisitInfo): string {
  switch (info.type) {
    case 'revisit_location':
      if (info.daysSinceLastVisit !== undefined && info.matchedLocation) {
        if (info.daysSinceLastVisit === 0) {
          return `今天又来到${info.matchedLocation}啦`
        } else if (info.daysSinceLastVisit < 7) {
          return `时隔${info.daysSinceLastVisit}天再访${info.matchedLocation}`
        } else if (info.daysSinceLastVisit < 30) {
          return `${Math.floor(info.daysSinceLastVisit / 7)}周后重返${info.matchedLocation}`
        } else {
          return `时隔${Math.floor(info.daysSinceLastVisit / 30)}个月再见${info.matchedLocation}`
        }
      }
      return '故地重游，别有一番滋味'
    case 'same_city_new':
      if (info.daysSinceLastVisit !== undefined && info.matchedCityName) {
        return `${info.matchedCityName}的新发现，第${info.totalVisitsInCity || 0}次到访`
      }
      return '同一座城市，新的风景'
    case 'new_city':
      return '开启一座新城的故事'
    default:
      return ''
  }
}

export function getRevisitColorClass(type: RevisitType): string {
  const colors: Record<RevisitType, string> = {
    'revisit_location': 'text-amber-600',
    'same_city_new': 'text-sky-600',
    'new_city': 'text-emerald-600'
  }
  return colors[type]
}

export function getRevisitBgColorClass(type: RevisitType): string {
  const colors: Record<RevisitType, string> = {
    'revisit_location': 'bg-amber-50',
    'same_city_new': 'bg-sky-50',
    'new_city': 'bg-emerald-50'
  }
  return colors[type]
}

export function getRevisitGradientFromClass(type: RevisitType): string {
  const gradients: Record<RevisitType, string> = {
    'revisit_location': 'from-amber-400',
    'same_city_new': 'from-sky-400',
    'new_city': 'from-emerald-400'
  }
  return gradients[type]
}

export function getRevisitGradientToClass(type: RevisitType): string {
  const gradients: Record<RevisitType, string> = {
    'revisit_location': 'to-orange-500',
    'same_city_new': 'to-blue-500',
    'new_city': 'to-teal-500'
  }
  return gradients[type]
}
