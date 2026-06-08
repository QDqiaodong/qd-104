<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCheckinStore } from '@/stores/checkin'
import { useCityMemorialStore } from '@/stores/cityMemorial'
import CitySearchSelect from '@/components/CitySearchSelect.vue'
import type { Checkin, TravelMethod, RevisitInfo } from '@/types'
import {
  detectRevisit,
  filterCheckinsBeforeTime,
  getRevisitLabel,
  getRevisitEmoji,
  getRevisitDescription,
  getRevisitColorClass,
  getRevisitBgColorClass,
  getRevisitGradientFromClass,
  getRevisitGradientToClass
} from '@/utils/revisitDetection'

const route = useRoute()
const router = useRouter()

const checkinStore = useCheckinStore()
const cityMemorialStore = useCityMemorialStore()

type ViewMode = 'list' | 'scroll'

const loading = ref(true)
const showForm = ref(false)
const selectedCityId = ref<number | undefined>()
const location = ref('')
const travelTime = ref('')
const travelMethod = ref<TravelMethod>('other')
const submitting = ref(false)
const viewMode = ref<ViewMode>('scroll')
const scrollContainer = ref<HTMLElement | null>(null)
const currentScrollIndex = ref(0)
const zoomedCard = ref<number | null>(null)
const showUnlockModal = ref(false)
const newlyUnlockedCityName = ref('')
const newlyUnlockedCityId = ref<number | null>(null)

const travelMethods: { value: TravelMethod; label: string; icon: string; color: string }[] = [
  { value: 'plane', label: '飞机', icon: '✈️', color: 'from-sky-400 to-blue-500' },
  { value: 'train', label: '火车', icon: '🚂', color: 'from-green-400 to-emerald-500' },
  { value: 'car', label: '自驾', icon: '🚗', color: 'from-orange-400 to-amber-500' },
  { value: 'walk', label: '步行', icon: '🚶', color: 'from-teal-400 to-cyan-500' },
  { value: 'other', label: '其他', icon: '🚌', color: 'from-purple-400 to-violet-500' }
]

const groupedCities = computed(() => {
  const provinces = [...new Set(checkinStore.cities.map(c => c.province))]
  return provinces.map(province => ({
    province,
    cities: checkinStore.cities.filter(c => c.province === province)
  }))
})

const sortedCheckins = computed(() => {
  return viewMode.value === 'scroll' 
    ? [...checkinStore.checkins].sort((a, b) => new Date(a.travelTime).getTime() - new Date(b.travelTime).getTime())
    : checkinStore.checkins
})

const scrollCheckins = computed(() => sortedCheckins.value)

const yearGroups = computed(() => {
  const groups: { [key: number]: Checkin[] } = {}
  sortedCheckins.value.forEach(checkin => {
    const year = new Date(checkin.travelTime).getFullYear()
    if (!groups[year]) {
      groups[year] = []
    }
    groups[year].push(checkin)
  })
  return Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b)).map(([year, items]) => ({
    year: Number(year),
    items
  }))
})

const formRevisitInfo = computed<RevisitInfo | null>(() => {
  if (!selectedCityId.value || !location.value || !travelTime.value) {
    return null
  }
  
  const previousCheckins = filterCheckinsBeforeTime(
    checkinStore.checkins,
    travelTime.value
  )
  
  return detectRevisit(
    {
      cityId: selectedCityId.value,
      location: location.value,
      travelTime: travelTime.value
    },
    previousCheckins
  )
})

const canShowRevisitHint = computed(() => {
  return formRevisitInfo.value && formRevisitInfo.value.type !== 'new_city'
})

async function locateToCheckin() {
  const checkinId = route.query.id
  const targetDate = route.query.date as string

  await nextTick()

  if (checkinId) {
    const id = Number(checkinId)
    const index = sortedCheckins.value.findIndex(c => c.id === id)
    if (index !== -1) {
      if (viewMode.value === 'scroll') {
        scrollToIndex(index)
        toggleZoom(index)
      } else {
        const element = document.getElementById(`checkin-${id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('ring-4', 'ring-primary', 'ring-opacity-50')
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-primary', 'ring-opacity-50')
          }, 3000)
        }
      }
      return
    }
  }

  if (targetDate) {
    const index = sortedCheckins.value.findIndex(c => {
      const checkinDate = new Date(c.travelTime).toISOString().split('T')[0]
      return checkinDate === targetDate
    })
    if (index !== -1) {
      if (viewMode.value === 'scroll') {
        scrollToIndex(index)
      } else {
        const checkin = sortedCheckins.value[index]
        const element = document.getElementById(`checkin-${checkin.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      checkinStore.fetchCities(),
      checkinStore.fetchCheckins()
    ])
  } finally {
    loading.value = false
    nextTick(() => {
      if (viewMode.value === 'scroll' && scrollContainer.value) {
        if (route.query.id || route.query.date) {
          locateToCheckin()
        } else {
          scrollToEnd()
        }
      } else if (route.query.id || route.query.date) {
        locateToCheckin()
      }
    })
  }
})

watch(() => [route.query.id, route.query.date], () => {
  if (!loading.value) {
    locateToCheckin()
  }
})

watch(viewMode, async (newMode) => {
  if (newMode === 'scroll') {
    await checkinStore.fetchCheckins({ sortBy: 'travel_time', sortOrder: 'asc' })
    nextTick(() => {
      scrollToEnd()
    })
  } else {
    await checkinStore.fetchCheckins({ sortBy: 'travel_time', sortOrder: 'desc' })
  }
})

function scrollToEnd() {
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft = scrollContainer.value.scrollWidth
    currentScrollIndex.value = scrollCheckins.value.length - 1
  }
}

function scrollToIndex(index: number) {
  if (scrollContainer.value && scrollCheckins.value[index]) {
    const cards = scrollContainer.value.querySelectorAll('.scroll-card')
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: 'smooth', inline: 'center' })
      currentScrollIndex.value = index
    }
  }
}

function scrollPrev() {
  const newIndex = Math.max(0, currentScrollIndex.value - 1)
  scrollToIndex(newIndex)
}

function scrollNext() {
  const newIndex = Math.min(scrollCheckins.value.length - 1, currentScrollIndex.value + 1)
  scrollToIndex(newIndex)
}

function handleScroll() {
  if (!scrollContainer.value) return
  const container = scrollContainer.value
  const cards = container.querySelectorAll('.scroll-card')
  const scrollCenter = container.scrollLeft + container.clientWidth / 2
  
  let closestIndex = 0
  let closestDistance = Infinity
  
  cards.forEach((card, index) => {
    const htmlCard = card as HTMLElement
    const cardCenter = htmlCard.offsetLeft + htmlCard.clientWidth / 2
    const distance = Math.abs(cardCenter - scrollCenter)
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  })
  
  currentScrollIndex.value = closestIndex
}

function openForm() {
  showForm.value = true
  selectedCityId.value = undefined
  location.value = ''
  travelTime.value = ''
  travelMethod.value = 'other'
}

function closeForm() {
  showForm.value = false
}

async function handleSubmit() {
  if (!selectedCityId.value || !location.value || !travelTime.value) {
    return
  }

  submitting.value = true

  try {
    const previousCityIds = new Set(checkinStore.checkins.map(c => c.cityId))
    const wasNewCity = !previousCityIds.has(selectedCityId.value)

    await checkinStore.createCheckin({
      cityId: selectedCityId.value,
      location: location.value,
      travelTime: travelTime.value,
      travelMethod: travelMethod.value
    })

    if (wasNewCity) {
      newlyUnlockedCityId.value = selectedCityId.value
      newlyUnlockedCityName.value = checkinStore.cities.find(c => c.id === selectedCityId.value)?.name || '新城市'
      showUnlockModal.value = true
    }

    closeForm()
    if (viewMode.value === 'scroll') {
      await checkinStore.fetchCheckins({ sortBy: 'travel_time', sortOrder: 'asc' })
      nextTick(() => {
        scrollToEnd()
      })
    }
  } finally {
    submitting.value = false
  }
}

function closeUnlockModal() {
  showUnlockModal.value = false
  newlyUnlockedCityId.value = null
  newlyUnlockedCityName.value = ''
}

function goToCityMemorial() {
  if (newlyUnlockedCityId.value) {
    closeUnlockModal()
    router.push(`/city-memorial/${newlyUnlockedCityId.value}`)
  }
}

function getCityName(cityId: number) {
  return checkinStore.cities.find(c => c.id === cityId)?.name || '未知'
}

function getMethodLabel(method: TravelMethod) {
  return travelMethods.find(m => m.value === method)?.label || '其他'
}

function getMethodIcon(method: TravelMethod) {
  return travelMethods.find(m => m.value === method)?.icon || '🚌'
}

function getMethodColor(method: TravelMethod) {
  return travelMethods.find(m => m.value === method)?.color || 'from-gray-400 to-gray-500'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatShortDate(date: string) {
  const d = new Date(date)
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}月${day}日`
}

function formatYear(date: string) {
  return new Date(date).getFullYear()
}

function getSeason(date: string) {
  const month = new Date(date).getMonth() + 1
  if (month >= 3 && month <= 5) return '春'
  if (month >= 6 && month <= 8) return '夏'
  if (month >= 9 && month <= 11) return '秋'
  return '冬'
}

function getSeasonEmoji(date: string) {
  const season = getSeason(date)
  const emojis: { [key: string]: string } = { '春': '🌸', '夏': '☀️', '秋': '🍂', '冬': '❄️' }
  return emojis[season] || '🌿'
}

function generateLocationPhrase(checkin: Checkin) {
  const city = getCityName(checkin.cityId)
  const phrases = [
    `在${city}的${checkin.location}留下足迹`,
    `漫步于${city}${checkin.location}`,
    `${city}·${checkin.location}的记忆`,
    `路过${city}的${checkin.location}`,
    `${city}${checkin.location}之行`,
    `邂逅${city}的${checkin.location}`
  ]
  const hash = checkin.id % phrases.length
  return phrases[hash]
}

function isYearActive(groupIndex: number) {
  const groups = yearGroups.value
  if (!groups.length) return false
  
  const currentYear = groups[groupIndex].year
  const nextYear = groups[groupIndex + 1]?.year
  
  const currentYearStartIndex = sortedCheckins.value.findIndex(
    c => formatYear(c.travelTime) === currentYear
  )
  const nextYearStartIndex = nextYear 
    ? sortedCheckins.value.findIndex(c => formatYear(c.travelTime) === nextYear)
    : sortedCheckins.value.length
  
  return currentScrollIndex.value >= currentYearStartIndex && 
         currentScrollIndex.value < nextYearStartIndex
}

function getDaysApart(checkin1: Checkin, checkin2: Checkin) {
  const date1 = new Date(checkin1.travelTime)
  const date2 = new Date(checkin2.travelTime)
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function getTravelStory(checkin: Checkin, index: number) {
  const prevCheckin = sortedCheckins.value[index - 1]
  if (!prevCheckin) return { text: '旅途的起点', emoji: '🚀' }
  
  const days = getDaysApart(prevCheckin, checkin)
  const prevCity = getCityName(prevCheckin.cityId)
  const currentCity = getCityName(checkin.cityId)
  
  if (prevCity === currentCity) {
    if (days <= 1) return { text: '故地重游', emoji: '🔄' }
    if (days <= 7) return { text: `${days}天后再见`, emoji: '👋' }
    return { text: `时隔${days}天重逢`, emoji: '💫' }
  }
  
  if (days <= 3) return { text: `从${prevCity}到${currentCity}`, emoji: '🗺️' }
  if (days <= 30) return { text: `${days}天后的新旅程`, emoji: '✨' }
  if (days <= 90) return { text: `${Math.floor(days / 7)}周后的遇见`, emoji: '🌟' }
  return { text: `时隔${Math.floor(days / 30)}个月`, emoji: '⏰' }
}

function getCheckinRevisitInfo(checkin: Checkin): RevisitInfo | null {
  if (checkin.revisitInfo) {
    return checkin.revisitInfo
  }
  
  const previousCheckins = filterCheckinsBeforeTime(
    checkinStore.checkins,
    checkin.travelTime,
    checkin.id
  )
  
  return detectRevisit(
    {
      cityId: checkin.cityId,
      location: checkin.location,
      travelTime: checkin.travelTime
    },
    previousCheckins
  )
}

function hasRevisitInfo(checkin: Checkin): boolean {
  const info = getCheckinRevisitInfo(checkin)
  return info !== null && info.type !== 'new_city'
}

function toggleZoom(index: number) {
  if (zoomedCard.value === index) {
    zoomedCard.value = null
  } else {
    zoomedCard.value = index
  }
}

function closeZoom() {
  zoomedCard.value = null
}
</script>

<template>
  <div class="min-h-screen bg-warm-bg">
    <!-- 头部 -->
    <div class="container mx-auto px-4 pt-8 pb-4 max-w-7xl">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-serif font-bold text-text-primary">
            {{ viewMode === 'scroll' ? '旅行长卷' : '旅行打卡' }}
          </h1>
          <p class="text-text-secondary mt-1">
            {{ viewMode === 'scroll' ? '翻阅你的人生画册，重温每一段旅途' : '记录你的每一次出行' }}
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <!-- 视图切换 -->
          <div class="flex bg-warm-card rounded-xl p-1 shadow-soft border border-warm-border/50">
            <button
              @click="viewMode = 'list'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                viewMode === 'list'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              ]"
            >
              <span class="mr-1">📋</span>
              列表
            </button>
            <button
              @click="viewMode = 'scroll'"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                viewMode === 'scroll'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              ]"
            >
              <span class="mr-1">📜</span>
              长卷
            </button>
          </div>
          <button @click="openForm" class="btn-primary">
            新增打卡
          </button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="card text-center">
          <div class="text-3xl font-bold text-primary mb-1">{{ checkinStore.total }}</div>
          <div class="text-sm text-text-secondary">打卡次数</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-primary mb-1">
            {{ [...new Set(checkinStore.checkins.map(c => c.cityId))].length }}
          </div>
          <div class="text-sm text-text-secondary">探索城市</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-accent mb-1">
            {{ checkinStore.checkins.filter(c => c.travelMethod === 'plane').length }}
          </div>
          <div class="text-sm text-text-secondary">飞行旅程</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-accent mb-1">
            {{ checkinStore.checkins.filter(c => c.travelMethod === 'car').length }}
          </div>
          <div class="text-sm text-text-secondary">自驾旅途</div>
        </div>
      </div>
    </div>

    <!-- 打卡表单 -->
    <transition name="page">
      <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white rounded-2xl p-6 w-full max-w-md">
          <h2 class="text-xl font-serif font-semibold text-text-primary mb-6">新增打卡</h2>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <!-- 城市选择 -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">选择城市</label>
              <CitySearchSelect v-model="selectedCityId" placeholder="输入城市名或别名，如：魔都、蓉城、姑苏" />
            </div>

            <!-- 打卡地点 -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">打卡地点</label>
              <input
                v-model="location"
                type="text"
                placeholder="例如：西湖断桥"
                class="input-field"
              />
            </div>

            <!-- 出行时间 -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">出行时间</label>
              <input
                v-model="travelTime"
                type="date"
                class="input-field"
              />
            </div>

            <!-- 出行方式 -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">出行方式</label>
              <div class="grid grid-cols-5 gap-2">
                <button
                  v-for="method in travelMethods"
                  :key="method.value"
                  type="button"
                  @click="travelMethod = method.value"
                  :class="[
                    'p-3 rounded-xl border-2 text-center transition-all',
                    travelMethod === method.value
                      ? 'border-primary bg-primary-50'
                      : 'border-warm-border hover:border-primary-300'
                  ]"
                >
                  <div class="text-xl mb-1">{{ method.icon }}</div>
                  <div class="text-xs text-text-secondary">{{ method.label }}</div>
                </button>
              </div>
            </div>

            <!-- 重访提醒 -->
            <transition name="fade">
              <div
                v-if="canShowRevisitHint && formRevisitInfo"
                :class="[
                  'rounded-xl p-4 border-2 transition-all duration-300',
                  getRevisitBgColorClass(formRevisitInfo.type),
                  formRevisitInfo.type === 'revisit_location' ? 'border-amber-200' : 'border-sky-200'
                ]"
              >
                <div class="flex items-start space-x-3">
                  <div 
                    :class="[
                      'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-md',
                      getRevisitGradientFromClass(formRevisitInfo.type),
                      getRevisitGradientToClass(formRevisitInfo.type)
                    ]"
                  >
                    <span class="text-xl">{{ getRevisitEmoji(formRevisitInfo.type) }}</span>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <h4 :class="['font-semibold', getRevisitColorClass(formRevisitInfo.type)]">
                        {{ getRevisitLabel(formRevisitInfo.type) }}
                      </h4>
                      <span v-if="formRevisitInfo.totalVisitsInCity" class="text-xs text-text-muted bg-white/60 px-2 py-0.5 rounded-full">
                        第 {{ formRevisitInfo.totalVisitsInCity }} 次到访
                      </span>
                    </div>
                    <p class="text-sm text-text-secondary mt-1">
                      {{ getRevisitDescription(formRevisitInfo) }}
                    </p>
                    <p v-if="formRevisitInfo.type === 'revisit_location' && formRevisitInfo.matchedLocation" class="text-xs text-text-muted mt-2">
                      上次打卡：{{ formRevisitInfo.matchedLocation }}
                    </p>
                    <p v-if="formRevisitInfo.similarityScore && formRevisitInfo.type === 'revisit_location'" class="text-xs text-text-muted mt-1">
                      地点相似度：{{ Math.round(formRevisitInfo.similarityScore * 100) }}%
                    </p>
                  </div>
                </div>
              </div>
            </transition>

            <!-- 按钮 -->
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" @click="closeForm" class="btn-secondary">
                取消
              </button>
              <button type="submit" class="btn-primary" :disabled="submitting">
                {{ submitting ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- 列表视图 -->
    <div v-if="viewMode === 'list'" class="container mx-auto px-4 pb-8 max-w-4xl">
      <div class="space-y-4">
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="card animate-pulse">
            <div class="flex items-start space-x-4">
              <div class="w-16 h-16 bg-secondary rounded-xl"></div>
              <div class="flex-1">
                <div class="h-5 bg-secondary rounded w-1/3 mb-2"></div>
                <div class="h-4 bg-secondary rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="checkinStore.checkins.length === 0" class="card text-center py-12">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <span class="text-4xl">📍</span>
          </div>
          <h3 class="text-lg font-medium text-text-primary mb-2">暂无打卡记录</h3>
          <p class="text-text-secondary mb-6">开始记录你的第一次旅行打卡吧</p>
          <button @click="openForm" class="btn-primary">添加打卡</button>
        </div>

        <div
          v-else
          v-for="(checkin, index) in checkinStore.checkins"
          :key="checkin.id"
          :id="`checkin-${checkin.id}`"
          class="card card-hover animate-fade-in transition-all duration-300"
          :class="`stagger-${(index % 5) + 1}`"
        >
          <div class="flex items-start space-x-4">
            <div 
              :class="[
                'w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0',
                getMethodColor(checkin.travelMethod)
              ]"
            >
              <span class="text-white text-2xl">{{ getMethodIcon(checkin.travelMethod) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between">
                <div class="flex flex-wrap items-center gap-1">
                  <span class="badge badge-primary mr-2">{{ getCityName(checkin.cityId) }}</span>
                  <span class="badge bg-secondary text-text-secondary">{{ getMethodLabel(checkin.travelMethod) }}</span>
                  <span
                    v-if="hasRevisitInfo(checkin)"
                    :class="[
                      'badge',
                      getRevisitBgColorClass(getCheckinRevisitInfo(checkin)!.type),
                      getRevisitColorClass(getCheckinRevisitInfo(checkin)!.type)
                    ]"
                  >
                    {{ getRevisitEmoji(getCheckinRevisitInfo(checkin)!.type) }}
                    {{ getRevisitLabel(getCheckinRevisitInfo(checkin)!.type) }}
                  </span>
                </div>
                <span class="text-sm text-text-muted">{{ formatDate(checkin.travelTime) }}</span>
              </div>
              <h3 class="text-lg font-medium text-text-primary mt-2">{{ checkin.location }}</h3>
              <p
                v-if="hasRevisitInfo(checkin)"
                :class="['text-sm mt-1', getRevisitColorClass(getCheckinRevisitInfo(checkin)!.type)]"
              >
                {{ getRevisitDescription(getCheckinRevisitInfo(checkin)!) }}
              </p>
              <p class="text-sm text-text-muted mt-1">
                {{ formatDate(checkin.createTime) }} 创建
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 旅行长卷视图 -->
    <div v-else class="pb-16">
      <!-- 放大查看模态框 -->
      <transition name="fade">
        <div v-if="zoomedCard !== null" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" @click.self="closeZoom">
          <div class="relative max-w-lg w-full transform transition-all duration-300 scale-100">
            <button @click="closeZoom" class="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            
            <div class="bg-white rounded-3xl overflow-hidden shadow-2xl">
              <!-- 放大卡片头部 -->
              <div 
                v-if="scrollCheckins[zoomedCard]"
                :class="[
                  'relative h-48 bg-gradient-to-br p-8 overflow-hidden',
                  getMethodColor(scrollCheckins[zoomedCard].travelMethod)
                ]"
              >
                <div class="absolute inset-0 opacity-20">
                  <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/30"></div>
                  <div class="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/20 -mb-16 -ml-16"></div>
                </div>
                
                <div class="relative z-10 h-full flex flex-col justify-center">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-7xl font-serif font-bold text-white drop-shadow-xl">
                        {{ formatShortDate(scrollCheckins[zoomedCard].travelTime).split('月')[0] }}
                      </div>
                      <div class="text-white/90 text-2xl font-medium mt-1">
                        {{ formatShortDate(scrollCheckins[zoomedCard].travelTime).split('月')[1] }}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-6xl drop-shadow-xl">{{ getSeasonEmoji(scrollCheckins[zoomedCard].travelTime) }}</div>
                      <div class="text-white/90 text-base mt-2 font-medium">{{ formatYear(scrollCheckins[zoomedCard].travelTime) }}年 · {{ getSeason(scrollCheckins[zoomedCard].travelTime) }}季</div>
                    </div>
                  </div>
                  
                  <div class="mt-6 flex items-center space-x-3">
                    <span class="px-4 py-1.5 bg-white/25 backdrop-blur-sm rounded-full text-white text-base font-medium">
                      {{ getCityName(scrollCheckins[zoomedCard].cityId) }}
                    </span>
                    <span class="px-4 py-1.5 bg-white/25 backdrop-blur-sm rounded-full text-white text-base flex items-center space-x-2">
                      <span class="text-xl">{{ getMethodIcon(scrollCheckins[zoomedCard].travelMethod) }}</span>
                      <span>{{ getMethodLabel(scrollCheckins[zoomedCard].travelMethod) }}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- 放大卡片内容 -->
              <div v-if="scrollCheckins[zoomedCard]" class="p-8">
                <h2 class="text-3xl font-serif font-bold text-text-primary mb-3">
                  {{ scrollCheckins[zoomedCard].location }}
                </h2>
                
                <!-- 重访信息 -->
                <div v-if="hasRevisitInfo(scrollCheckins[zoomedCard])" class="mb-4">
                  <div
                    :class="[
                      'inline-flex items-center space-x-2 px-4 py-2 rounded-xl',
                      getRevisitBgColorClass(getCheckinRevisitInfo(scrollCheckins[zoomedCard])!.type)
                    ]"
                  >
                    <span class="text-xl">{{ getRevisitEmoji(getCheckinRevisitInfo(scrollCheckins[zoomedCard])!.type) }}</span>
                    <div>
                      <div :class="['font-semibold', getRevisitColorClass(getCheckinRevisitInfo(scrollCheckins[zoomedCard])!.type)]">
                        {{ getRevisitLabel(getCheckinRevisitInfo(scrollCheckins[zoomedCard])!.type) }}
                      </div>
                      <div class="text-xs text-text-secondary">
                        {{ getRevisitDescription(getCheckinRevisitInfo(scrollCheckins[zoomedCard])!) }}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-6 mb-6">
                  <p class="text-xl text-text-secondary italic leading-relaxed">
                    「{{ generateLocationPhrase(scrollCheckins[zoomedCard]) }}」
                  </p>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-warm-card rounded-xl p-4 text-center">
                    <div class="text-3xl mb-2">{{ getTravelStory(scrollCheckins[zoomedCard], zoomedCard).emoji }}</div>
                    <div class="text-sm text-text-secondary">{{ getTravelStory(scrollCheckins[zoomedCard], zoomedCard).text }}</div>
                  </div>
                  <div class="bg-warm-card rounded-xl p-4 text-center">
                    <div class="text-3xl mb-2">🏆</div>
                    <div class="text-sm text-text-secondary">第 {{ zoomedCard + 1 }} 次出行</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- 长卷背景装饰 -->
      <div class="relative">
        <!-- 顶部装饰线 -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        
        <!-- 空状态 -->
        <div v-if="loading" class="container mx-auto px-4 py-16 max-w-7xl">
          <div class="flex space-x-6 overflow-hidden">
            <div v-for="i in 5" :key="i" class="flex-shrink-0 w-80 h-96 card animate-pulse">
              <div class="h-full flex flex-col">
                <div class="h-8 bg-secondary rounded mb-4"></div>
                <div class="h-32 bg-secondary rounded mb-4"></div>
                <div class="h-6 bg-secondary rounded w-3/4 mb-2"></div>
                <div class="h-4 bg-secondary rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="scrollCheckins.length === 0" class="container mx-auto px-4 py-16 max-w-4xl">
          <div class="card text-center py-16 bg-gradient-to-br from-warm-card to-primary-50/30">
            <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-accent-light flex items-center justify-center">
              <span class="text-5xl">📜</span>
            </div>
            <h3 class="text-xl font-serif font-medium text-text-primary mb-3">你的旅行长卷还是空白</h3>
            <p class="text-text-secondary mb-8 max-w-md mx-auto">
              每一次出行都是人生画卷上的一笔，开始记录你的第一次旅行，让生活留下痕迹
            </p>
            <button @click="openForm" class="btn-primary px-8">
              开启第一笔
            </button>
          </div>
        </div>

        <!-- 旅行长卷内容 -->
        <div v-else class="relative">
          <!-- 年份导航 -->
          <div class="container mx-auto px-4 mb-4 max-w-7xl">
            <div class="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              <span class="text-sm text-text-muted flex-shrink-0">年份：</span>
              <button
                v-for="(group, groupIndex) in yearGroups"
                :key="group.year"
                @click="scrollToIndex(sortedCheckins.findIndex(c => formatYear(c.travelTime) === group.year))"
                :class="[
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex-shrink-0',
                  isYearActive(groupIndex)
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-warm-card text-text-secondary hover:bg-primary-50 border border-warm-border'
                ]"
              >
                {{ group.year }}年 ({{ group.items.length }})
              </button>
            </div>
          </div>

          <!-- 长卷滚动区域 -->
          <div class="relative">
            <!-- 左右导航按钮 -->
            <button
              v-if="scrollCheckins.length > 1"
              @click="scrollPrev"
              :disabled="currentScrollIndex === 0"
              class="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-text-primary hover:bg-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <span class="text-xl">←</span>
            </button>
            <button
              v-if="scrollCheckins.length > 1"
              @click="scrollNext"
              :disabled="currentScrollIndex === scrollCheckins.length - 1"
              class="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-text-primary hover:bg-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <span class="text-xl">→</span>
            </button>

            <!-- 渐变遮罩 -->
            <div class="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-warm-bg to-transparent z-10 pointer-events-none"></div>
            <div class="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-warm-bg to-transparent z-10 pointer-events-none"></div>

            <!-- 滚动容器 -->
            <div
              ref="scrollContainer"
              @scroll="handleScroll"
              class="overflow-x-auto scrollbar-hide px-8 md:px-20 py-8"
              :style="{ scrollSnapType: 'x mandatory' }"
            >
              <div class="flex items-start space-x-8 min-w-max px-8">
                <!-- 起点标记 -->
                <div class="flex-shrink-0 flex flex-col items-center pt-32">
                  <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-200 to-accent-light flex items-center justify-center shadow-lg">
                    <span class="text-2xl">🎬</span>
                  </div>
                  <div class="mt-3 text-sm text-text-secondary font-medium">旅途起点</div>
                  <div class="mt-1 text-xs text-text-muted">人生的第一次出发</div>
                </div>

                <!-- 时间轴连接线 -->
                <div class="flex-shrink-0 relative">
                  <!-- 主时间线 -->
                  <div class="absolute top-40 left-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-accent/40 rounded-full"
                       :style="{ width: `${(scrollCheckins.length - 1) * 384 + (scrollCheckins.length - 1) * 32 + 100}px` }">
                  </div>
                </div>

                <!-- 打卡卡片 -->
                <template v-for="(checkin, index) in scrollCheckins" :key="checkin.id">
                  <div 
                    class="scroll-card flex-shrink-0 relative"
                    :style="{ scrollSnapAlign: 'center' }"
                  >
                    <!-- 旅程故事标签 -->
                    <div class="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
                      <div class="px-4 py-1.5 bg-white rounded-full shadow-md border border-warm-border flex items-center space-x-1.5">
                        <span class="text-lg">{{ getTravelStory(checkin, index).emoji }}</span>
                        <span class="text-sm font-medium text-text-secondary">{{ getTravelStory(checkin, index).text }}</span>
                      </div>
                    </div>

                    <!-- 卡片 -->
                    <div 
                      @click="toggleZoom(index)"
                      :class="[
                        'w-80 bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500 border border-warm-border/30 cursor-pointer mt-6',
                        currentScrollIndex === index 
                          ? 'scale-105 shadow-2xl z-20 ring-4 ring-primary/20' 
                          : 'scale-95 opacity-70 hover:opacity-90 hover:scale-100'
                      ]"
                    >
                      <!-- 卡片头部 - 日期和季节 -->
                      <div 
                        :class="[
                          'relative h-36 bg-gradient-to-br p-6 overflow-hidden',
                          getMethodColor(checkin.travelMethod)
                        ]"
                      >
                        <!-- 装饰图案 -->
                        <div class="absolute inset-0 opacity-20">
                          <div class="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/30"></div>
                          <div class="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/20 -mb-10 -ml-10"></div>
                        </div>
                        
                        <div class="relative z-10">
                          <div class="flex items-center justify-between">
                            <div>
                              <div class="text-5xl font-serif font-bold text-white drop-shadow-lg">
                                {{ formatShortDate(checkin.travelTime).split('月')[0] }}
                              </div>
                              <div class="text-white/90 text-xl font-medium">
                                {{ formatShortDate(checkin.travelTime).split('月')[1] }}
                              </div>
                            </div>
                            <div class="text-right">
                              <div class="text-4xl drop-shadow-lg">{{ getSeasonEmoji(checkin.travelTime) }}</div>
                              <div class="text-white/90 text-sm mt-1 font-medium">{{ getSeason(checkin.travelTime) }}季之旅</div>
                            </div>
                          </div>
                          
                          <div class="mt-4 flex items-center space-x-2">
                            <span class="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                              {{ formatYear(checkin.travelTime) }}年
                            </span>
                            <span class="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-white text-sm flex items-center space-x-1.5">
                              <span class="text-lg">{{ getMethodIcon(checkin.travelMethod) }}</span>
                              <span>{{ getMethodLabel(checkin.travelMethod) }}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <!-- 时间轴节点 -->
                      <div class="absolute left-1/2 -translate-x-1/2 -bottom-3 z-10">
                        <div 
                          :class="[
                            'w-8 h-8 rounded-full border-4 border-white shadow-xl bg-gradient-to-br flex items-center justify-center',
                            getMethodColor(checkin.travelMethod)
                          ]"
                        >
                          <span class="text-white text-sm font-bold">{{ index + 1 }}</span>
                        </div>
                      </div>

                      <!-- 卡片内容 -->
                      <div class="p-6 pt-8">
                        <!-- 城市 -->
                        <div class="flex items-center space-x-2 mb-4">
                          <span class="text-2xl">📍</span>
                          <span class="badge badge-primary text-lg px-5 py-2 font-serif">
                            {{ getCityName(checkin.cityId) }}
                          </span>
                        </div>

                        <!-- 地点 -->
                        <h3 class="text-2xl font-serif font-bold text-text-primary mb-2 leading-tight">
                          {{ checkin.location }}
                        </h3>

                        <!-- 重访标签 -->
                        <div v-if="hasRevisitInfo(checkin)" class="mb-4">
                          <span
                            :class="[
                              'inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium',
                              getRevisitBgColorClass(getCheckinRevisitInfo(checkin)!.type),
                              getRevisitColorClass(getCheckinRevisitInfo(checkin)!.type)
                            ]"
                          >
                            <span>{{ getRevisitEmoji(getCheckinRevisitInfo(checkin)!.type) }}</span>
                            <span>{{ getRevisitLabel(getCheckinRevisitInfo(checkin)!.type) }}</span>
                          </span>
                          <p :class="['text-xs mt-1.5', getRevisitColorClass(getCheckinRevisitInfo(checkin)!.type)]">
                            {{ getRevisitDescription(getCheckinRevisitInfo(checkin)!) }}
                          </p>
                        </div>

                        <!-- 诗意短句 -->
                        <div class="relative">
                          <div class="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                          <p class="text-text-secondary italic pl-4 py-2 bg-gradient-to-r from-primary-50/50 to-transparent rounded-r-lg text-lg">
                            「{{ generateLocationPhrase(checkin) }}」
                          </p>
                        </div>

                        <!-- 序号标记 -->
                        <div class="mt-6 flex items-center justify-between pt-4 border-t border-warm-border">
                          <div class="flex items-center space-x-1">
                            <span class="text-lg">📝</span>
                            <span class="text-sm text-text-muted">
                              {{ formatDate(checkin.createTime).replace('年', '/').replace('月', '/').replace('日', '') }}
                            </span>
                          </div>
                          <span class="text-sm font-medium text-primary">
                            第 {{ index + 1 }} 站
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 连接线装饰点 -->
                  <div 
                    v-if="index < scrollCheckins.length - 1"
                    class="flex-shrink-0 flex items-center align-self-stretch"
                    style="width: 40px; padding-top: 176px;"
                  >
                    <div class="w-full flex justify-center items-center space-x-1">
                      <div class="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
                      <div class="w-2 h-2 rounded-full bg-primary/40"></div>
                      <div class="w-3 h-3 rounded-full bg-primary/60 shadow-sm"></div>
                      <div class="w-2 h-2 rounded-full bg-primary/40"></div>
                      <div class="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
                    </div>
                  </div>
                </template>

                <!-- 终点标记 -->
                <div class="flex-shrink-0 flex flex-col items-center pt-32">
                  <div class="w-16 h-16 rounded-full bg-gradient-to-br from-accent-light to-primary-200 flex items-center justify-center shadow-lg">
                    <span class="text-2xl">✨</span>
                  </div>
                  <div class="mt-3 text-sm text-text-secondary font-medium">待续</div>
                  <div class="mt-1 text-xs text-text-muted">未来的旅途</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 滚动指示器 -->
          <div class="flex justify-center items-center space-x-2 mt-8">
            <div class="flex space-x-1.5">
              <button
                v-for="(checkin, index) in scrollCheckins"
                :key="checkin.id"
                @click="scrollToIndex(index)"
                :class="[
                  'h-2 rounded-full transition-all duration-300',
                  currentScrollIndex === index
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-secondary hover:bg-primary-300'
                ]"
              ></button>
            </div>
            <span class="ml-4 text-sm text-text-muted">
              {{ currentScrollIndex + 1 }} / {{ scrollCheckins.length }}
            </span>
          </div>

          <!-- 操作提示 -->
          <div class="text-center mt-6">
            <p class="text-sm text-text-muted inline-flex items-center space-x-2 bg-warm-card px-4 py-2 rounded-full border border-warm-border/50">
              <span>👆</span>
              <span>左右滑动或点击按钮翻阅旅行长卷</span>
              <span>👆</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 新城市解锁弹窗 -->
    <transition name="unlock">
      <div v-if="showUnlockModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="bg-white rounded-3xl p-8 w-full max-w-sm text-center overflow-hidden relative">
          <div class="absolute inset-0 opacity-10">
            <div class="absolute top-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div class="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 blur-3xl translate-x-1/3 translate-y-1/3"></div>
          </div>
          
          <div class="relative z-10">
            <div class="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 class="text-3xl font-serif font-bold text-text-primary mb-2">解锁新城市！</h2>
            <div class="text-2xl font-bold text-primary mb-1">{{ newlyUnlockedCityName }}</div>
            <p class="text-text-secondary mb-6">专属纪念页已生成</p>
            
            <div class="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-4 mb-6">
              <div class="text-sm text-text-secondary mb-2">纪念页包含</div>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div class="text-2xl mb-1">📅</div>
                  <div class="text-xs text-text-secondary">到访时间</div>
                </div>
                <div>
                  <div class="text-2xl mb-1">📝</div>
                  <div class="text-xs text-text-secondary">旅行游记</div>
                </div>
                <div>
                  <div class="text-2xl mb-1">🚀</div>
                  <div class="text-xs text-text-secondary">出行方式</div>
                </div>
              </div>
            </div>
            
            <div class="space-y-3">
              <button @click="goToCityMemorial" class="btn-primary w-full">
                <span class="mr-2">✨</span>
                查看纪念页
              </button>
              <button @click="closeUnlockModal" class="btn-secondary w-full">
                稍后再说
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.border-l-3 {
  border-left-width: 3px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.unlock-enter-active,
.unlock-leave-active {
  transition: all 0.4s ease;
}

.unlock-enter-from,
.unlock-leave-to {
  opacity: 0;
}

.unlock-enter-from > div,
.unlock-leave-to > div {
  transform: scale(0.8) translateY(20px);
}
</style>
