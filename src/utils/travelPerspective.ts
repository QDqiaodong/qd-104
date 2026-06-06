export type PerspectiveId = 'all' | 'night' | 'food' | 'walk' | 'oldtown' | 'nature'

export interface Perspective {
  id: PerspectiveId
  name: string
  icon: string
  description: string
  keywords: string[]
  color: string
  bgColor: string
}

export const PERSPECTIVES: Perspective[] = [
  {
    id: 'all',
    name: '全部',
    icon: '📚',
    description: '浏览所有收藏',
    keywords: [],
    color: 'text-primary',
    bgColor: 'bg-primary-50'
  },
  {
    id: 'night',
    name: '夜景',
    icon: '🌙',
    description: '灯火阑珊的夜晚',
    keywords: ['夜景', '灯光', '夜晚', '霓虹', '灯火', '星空', '夜色', '夜游', '夜景图', '璀璨'],
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  {
    id: 'food',
    name: '美食',
    icon: '🍜',
    description: '舌尖上的旅行',
    keywords: ['美食', '吃', '餐厅', '小吃', '味道', '吃货', '美食街', '早茶', '火锅', '烧烤', '餐厅', '料理', '甜品', '咖啡', '茶馆', '饭局', '好吃'],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'walk',
    name: '步行感',
    icon: '🚶',
    description: '漫步城市的节奏',
    keywords: ['散步', '漫步', '步行', '街道', '巷弄', '闲逛', '走走', '徒步', '压马路', '逛', '溜达', 'citywalk', 'city walk', '漫步'],
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  {
    id: 'oldtown',
    name: '老城气质',
    icon: '🏯',
    description: '时光沉淀的韵味',
    keywords: ['古城', '古镇', '老建筑', '历史', '传统', '文化', '古迹', '老街', '胡同', '古街', '青石板', '明清', '宋代', '唐代', '古老', '怀旧', '复古'],
    color: 'text-amber-700',
    bgColor: 'bg-amber-50'
  },
  {
    id: 'nature',
    name: '自然风光',
    icon: '🏔️',
    description: '山川湖海的诗意',
    keywords: ['山', '海', '湖', '自然', '风景', '公园', '森林', '草原', '瀑布', '沙滩', '海岛', '雪山', '峡谷', '湖泊', '日出', '日落', '云海'],
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  }
]

export function getPerspectiveById(id: PerspectiveId): Perspective | undefined {
  return PERSPECTIVES.find(p => p.id === id)
}

export function matchPerspective(title: string, content: string): PerspectiveId[] {
  const text = (title + ' ' + content).toLowerCase()
  const matched: PerspectiveId[] = []

  for (const perspective of PERSPECTIVES) {
    if (perspective.id === 'all') continue
    
    const hitCount = perspective.keywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    ).length

    if (hitCount >= 1) {
      matched.push(perspective.id)
    }
  }

  return matched
}

export function getPrimaryPerspective(title: string, content: string): PerspectiveId | null {
  const text = (title + ' ' + content).toLowerCase()
  let bestMatch: PerspectiveId | null = null
  let maxHits = 0

  for (const perspective of PERSPECTIVES) {
    if (perspective.id === 'all') continue
    
    const hitCount = perspective.keywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    ).length

    if (hitCount > maxHits) {
      maxHits = hitCount
      bestMatch = perspective.id
    }
  }

  return bestMatch
}
