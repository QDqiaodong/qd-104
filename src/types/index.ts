// 用户相关类型
export interface User {
  id: number
  email: string
  nickname: string
  avatar?: string
  createTime?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  nickname: string
}

export interface AuthResponse {
  token: string
  userId: number
  nickname: string
  email: string
}

// 城市字典
export interface City {
  id: number
  province: string
  name: string
  description?: string
  aliases?: string
}

// 游记相关
export interface Journal {
  id: number
  title: string
  content: string
  images: string[]
  cityId: number
  cityName: string
  authorId: number
  authorName: string
  authorAvatar?: string
  createTime: string
  likeCount: number
  collectCount: number
  isLiked?: boolean
  isCollected?: boolean
}

export interface JournalListRequest {
  page: number
  pageSize: number
  cityId?: number
  keyword?: string
}

export interface JournalListResponse {
  list: Journal[]
  total: number
  page: number
  pageSize: number
}

export interface PublishJournalRequest {
  title: string
  content: string
  images: string[]
  cityId: number
}

// 打卡相关
export type TravelMethod = 'plane' | 'train' | 'car' | 'walk' | 'other'

export type RevisitType = 'revisit_location' | 'same_city_new' | 'new_city'

export interface RevisitInfo {
  type: RevisitType
  matchedCheckinId?: number
  matchedLocation?: string
  matchedCityName?: string
  daysSinceLastVisit?: number
  totalVisitsInCity?: number
  similarityScore?: number
}

export interface Checkin {
  id: number
  userId: number
  cityId: number
  cityName: string
  location: string
  travelTime: string
  travelMethod: TravelMethod
  createTime: string
  revisitInfo?: RevisitInfo
}

export interface LocationMatchResult {
  isMatch: boolean
  similarity: number
  matchedCheckin?: Checkin
  daysSinceLastVisit?: number
}

export interface CheckinRequest {
  cityId: number
  location: string
  travelTime: string
  travelMethod: TravelMethod
}

export interface CheckinListResponse {
  list: Checkin[]
  total: number
}

export interface CityVisitArchive {
  cityId: number
  cityName: string
  firstVisit: string
  lastVisit: string
  visitCount: number
  locations: string[]
  checkins: Checkin[]
}

// 用户档案统计
export interface UserProfile {
  userId: number
  nickname: string
  cityCount: number
  journalCount: number
  checkinCount: number
  collectCount: number
  cities: City[]
}

// 收藏
export interface CollectionRequest {
  journalId: number
}

// 照片拼贴相关类型
export type CollageStyle = 'postcard' | 'filmstrip' | 'ticket' | 'polaroid' | 'mosaic'

export interface CollageStyleConfig {
  id: CollageStyle
  name: string
  description: string
  icon: string
  minImages: number
  maxImages: number
}

export interface CollageConfig {
  style: CollageStyle
  title: string
  subtitle: string
  date: string
  location: string
}

// 足迹热力图相关
export interface DailyActivity {
  id: number
  type: 'journal' | 'checkin'
  title: string
  cityName: string
  time: string
  image?: string
}

export interface FootprintHeatmapData {
  date: string
  activityCount: number
  activities: DailyActivity[]
}

export type TravelRhythmType = 'weekend' | 'holiday' | 'offpeak' | 'slowtravel'

export interface TravelRhythmLabel {
  id: TravelRhythmType
  name: string
  icon: string
  tagline: string
  description: string
  color: string
  bgColor: string
  gradientFrom: string
  gradientTo: string
}

export interface TravelRhythmScore {
  type: TravelRhythmType
  score: number
  percentage: number
}

export interface MonthlyDistribution {
  month: number
  count: number
}

export interface WeekdayDistribution {
  weekday: number
  count: number
}

export interface TravelRhythmPortrait {
  primaryRhythm: TravelRhythmType
  secondaryRhythm?: TravelRhythmType
  scores: TravelRhythmScore[]
  monthlyDistribution: MonthlyDistribution[]
  weekdayDistribution: WeekdayDistribution[]
  totalCheckins: number
  peakSeason: string
  travelStyle: string
}

export interface CityHotColdItem {
  cityId: number
  cityName: string
  visitCount: number
  journalCount: number
  totalScore: number
  firstVisit: string
  lastVisit: string
  locations: string[]
}

export interface CityHotColdAnalysis {
  frequentlyVisited: CityHotColdItem[]
  onceVisited: CityHotColdItem[]
  totalCities: number
  revisitRate: number
  favoriteCity?: CityHotColdItem
}

// API响应封装
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}
