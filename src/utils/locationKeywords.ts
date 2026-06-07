import type { Checkin, LocationKeywordSummary, LocationCategory } from '@/types'

const LOCATION_CATEGORY_DICTIONARY: Record<LocationCategory, string[]> = {
  scenic: [
    '公园', '广场', '塔', '寺', '庙', '观', '宫', '殿', '阁', '楼', '园', '苑', '陵',
    '墓', '祠', '故居', '纪念馆', '博物馆', '美术馆', '展览馆', '科技馆',
    '山', '峰', '岭', '岩', '洞', '峡', '谷', '瀑', '泉', '湖', '河', '江', '海',
    '滩', '岛', '湾', '角', '堤', '坝', '水库', '湿地', '森林', '草原',
    '风景区', '景区', '景点', '度假区', '度假村', '游乐园', '乐园', '动物园', '植物园',
    '古镇', '古城', '古村', '老街', '古街'
  ],
  transportation: [
    '机场', '火车站', '高铁站', '地铁', '地铁站', '轻轨',
    '汽车站', '客运站', '码头', '港口', '渡口',
    '站', '路', '街', '大道', '大街', '巷', '弄', '桥', '隧道',
    '公交', '巴士', '出租', '打车'
  ],
  food: [
    '餐厅', '饭店', '餐馆', '酒楼', '菜馆', '食府', '食堂',
    '小吃', '美食', '夜市', '大排档',
    '咖啡', '咖啡馆', '咖啡店', '奶茶', '甜品', '面包',
    '火锅', '烧烤', '料理'
  ],
  accommodation: [
    '酒店', '宾馆', '旅馆', '旅社', '民宿', '客栈', '旅店',
    '度假村', '公寓', '青年旅舍', '旅舍'
  ],
  shopping: [
    '商场', '购物中心', '广场', '步行街', '商业街',
    '超市', '便利店', '市场', '集市',
    '店', '铺', '行'
  ],
  culture: [
    '大学', '学院', '学校', '图书馆', '体育馆', '体育场',
    '剧院', '影院', '电影院', '音乐厅', '会展中心',
    '美术馆', '博物馆', '展览馆', '科技馆', '艺术馆',
    '教堂', '清真寺'
  ],
  business: [
    '大厦', '写字楼', '办公楼', '商务楼',
    '公司', '总部', '中心',
    '银行', '医院', '诊所',
    '政府', '市政', '厅', '局', '所', '院'
  ],
  residential: [
    '小区', '花园', '公寓', '别墅', '住宅区', '家属院',
    '楼', '栋', '单元', '号'
  ]
}

const CATEGORY_LABELS: { id: LocationCategory; name: string; icon: string; color: string; bgColor: string }[] = [
  { id: 'scenic', name: '景点地标', icon: '🏛️', color: 'text-rose-600', bgColor: 'bg-rose-50' },
  { id: 'food', name: '美食探索', icon: '🍜', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { id: 'transportation', name: '交通枢纽', icon: '🚇', color: 'text-sky-600', bgColor: 'bg-sky-50' },
  { id: 'shopping', name: '购物逛街', icon: '🛍️', color: 'text-pink-600', bgColor: 'bg-pink-50' },
  { id: 'culture', name: '文化场所', icon: '📚', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { id: 'accommodation', name: '住宿停留', icon: '🏨', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { id: 'business', name: '商务活动', icon: '🏢', color: 'text-slate-600', bgColor: 'bg-slate-50' },
  { id: 'residential', name: '生活区域', icon: '🏠', color: 'text-orange-600', bgColor: 'bg-orange-50' }
]

export function getCategoryInfo(categoryId: LocationCategory) {
  return CATEGORY_LABELS.find(c => c.id === categoryId)
}

export function categorizeLocation(location: string): LocationCategory[] {
  const categories: LocationCategory[] = []

  for (const category of Object.keys(LOCATION_CATEGORY_DICTIONARY) as LocationCategory[]) {
    const keywords = LOCATION_CATEGORY_DICTIONARY[category]
    if (keywords.some(kw => location.includes(kw))) {
      categories.push(category)
    }
  }

  if (categories.length === 0) {
    categories.push('scenic')
  }

  return categories
}

function extractKeywords(location: string): string[] {
  const keywords: string[] = []

  for (const category of Object.keys(LOCATION_CATEGORY_DICTIONARY) as LocationCategory[]) {
    for (const kw of LOCATION_CATEGORY_DICTIONARY[category]) {
      if (location.includes(kw)) {
        keywords.push(kw)
      }
    }
  }

  const shortPatterns = location.match(/[\u4e00-\u9fa5]{2,}/g)
  if (shortPatterns) {
    for (const word of shortPatterns) {
      if (!keywords.includes(word) && word.length >= 2 && word.length <= 6) {
        keywords.push(word)
      }
    }
  }

  return keywords
}

export function analyzeLocationKeywords(checkins: Checkin[]): LocationKeywordSummary {
  if (!checkins || checkins.length === 0) {
    return {
      topKeywords: [],
      categoryDistribution: CATEGORY_LABELS.map(c => ({ category: c.id, count: 0, percentage: 0 })),
      topLocations: [],
      routeMemory: [],
      totalLocations: 0
    }
  }

  const keywordCount = new Map<string, number>()
  const categoryCount = new Map<LocationCategory, number>()
  const locationCount = new Map<string, number>()

  for (const checkin of checkins) {
    const location = checkin.location
    if (!location) continue

    locationCount.set(location, (locationCount.get(location) || 0) + 1)

    const keywords = extractKeywords(location)
    for (const kw of keywords) {
      keywordCount.set(kw, (keywordCount.get(kw) || 0) + 1)
    }

    const categories = categorizeLocation(location)
    for (const cat of categories) {
      categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1)
    }
  }

  const topKeywords = [...keywordCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  const totalCategoryCount = checkins.length

  const categoryDistribution = CATEGORY_LABELS.map(c => {
    const count = categoryCount.get(c.id) || 0
    return {
      category: c.id,
      count,
      percentage: totalCategoryCount > 0 ? Math.round((count / totalCategoryCount) * 100) : 0
    }
  }).sort((a, b) => b.count - a.count)

  const topLocations = [...locationCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([location, count]) => ({ location, count }))

  const routeMemory = generateRouteMemory(checkins, topKeywords, categoryDistribution)

  return {
    topKeywords,
    categoryDistribution,
    topLocations,
    routeMemory,
    totalLocations: locationCount.size
  }
}

function generateRouteMemory(
  checkins: Checkin[],
  topKeywords: { word: string; count: number }[],
  categoryDistribution: { category: LocationCategory; count: number; percentage: number }[]
): string[] {
  const memories: string[] = []

  const topCategory = categoryDistribution.find(c => c.count > 0)
  if (topCategory) {
    const catInfo = getCategoryInfo(topCategory.category)
    if (catInfo && topCategory.percentage >= 40) {
      memories.push(`${catInfo.icon} 偏爱${catInfo.name}型路线`)
    }
  }

  const uniqueLocations = new Set(checkins.map(c => c.location).filter(Boolean))
  const uniqueCount = uniqueLocations.size

  if (uniqueCount >= 5) {
    memories.push('🗺️ 深度探索者')
  } else if (uniqueCount >= 3) {
    memories.push('✨ 多点漫游者')
  }

  if (topKeywords.length > 0) {
    const top3 = topKeywords.slice(0, 3).map(k => k.word)
    memories.push(`📍 ${top3.join('·')}`)
  }

  const foodCount = categoryDistribution.find(c => c.category === 'food')?.count || 0
  const scenicCount = categoryDistribution.find(c => c.category === 'scenic')?.count || 0

  if (foodCount > 0 && scenicCount > 0 && foodCount >= scenicCount) {
    memories.push('🍽️ 美食优先')
  }

  const transportCount = categoryDistribution.find(c => c.category === 'transportation')?.count || 0
  if (transportCount >= 3) {
    memories.push('🚶 城市穿行')
  }

  if (memories.length === 0) {
    memories.push('🌆 城市印象')
  }

  return memories.slice(0, 4)
}

export const LOCATION_CATEGORIES = CATEGORY_LABELS
