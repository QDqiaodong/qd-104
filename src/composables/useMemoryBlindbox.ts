import { ref, computed } from 'vue'

export interface CityMemory {
  id: number
  cityName: string
  location: string
  date: string
  memoryTitle: string
  travelMethod?: string
}

interface MemorySource {
  id: number
  cityName: string
  location: string
  travelTime: string
  travelMethod?: string
}

const memoryTemplates = [
  '那年今日，{city}的风还在耳边',
  '在{location}的那个午后',
  '一场与{city}的不期而遇',
  '漫步在{location}的时光',
  '{city}，藏着我的小确幸',
  '还记得{location}的味道吗',
  '那些年，我们走过的{city}',
  '在{city}的日子，闪闪发光',
  '回不去的{location}旧时光',
  '与{city}的温柔邂逅'
]

function generateMemoryTitle(cityName: string, location: string): string {
  const template = memoryTemplates[Math.floor(Math.random() * memoryTemplates.length)]
  return template.replace('{city}', cityName).replace('{location}', location)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

export function useMemoryBlindbox() {
  const memories = ref<CityMemory[]>([])
  const currentMemory = ref<CityMemory | null>(null)
  const isRevealing = ref(false)
  const hasDrawn = ref(false)

  const hasMemories = computed(() => memories.value.length > 0)

  function loadMemories(sourceList: MemorySource[]) {
    memories.value = sourceList.map(item => ({
      id: item.id,
      cityName: item.cityName,
      location: item.location,
      date: formatDate(item.travelTime),
      memoryTitle: generateMemoryTitle(item.cityName, item.location),
      travelMethod: item.travelMethod
    }))
    currentMemory.value = null
    hasDrawn.value = false
  }

  function drawRandomMemory(): CityMemory | null {
    if (memories.value.length === 0) {
      return null
    }

    isRevealing.value = true

    const randomIndex = Math.floor(Math.random() * memories.value.length)
    const selected = memories.value[randomIndex]

    selected.memoryTitle = generateMemoryTitle(selected.cityName, selected.location)

    currentMemory.value = selected
    hasDrawn.value = true
    isRevealing.value = false

    return selected
  }

  function reset() {
    currentMemory.value = null
    hasDrawn.value = false
  }

  return {
    memories,
    currentMemory,
    isRevealing,
    hasDrawn,
    hasMemories,
    loadMemories,
    drawRandomMemory,
    reset
  }
}
