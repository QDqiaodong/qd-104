<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useCheckinStore } from '@/stores/checkin'
import type { Checkin, TravelMethod } from '@/types'

const checkinStore = useCheckinStore()

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
        scrollToEnd()
      }
    })
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
    await checkinStore.createCheckin({
      cityId: selectedCityId.value,
      location: location.value,
      travelTime: travelTime.value,
      travelMethod: travelMethod.value
    })
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
              <select v-model="selectedCityId" class="input-field">
                <option value="">请选择城市</option>
                <template v-for="group in groupedCities" :key="group.province">
                  <optgroup :label="group.province">
                    <option v-for="city in group.cities" :key="city.id" :value="city.id">
                      {{ city.name }}
                    </option>
                  </optgroup>
                </template>
              </select>
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
          class="card card-hover animate-fade-in"
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
                <div>
                  <span class="badge badge-primary mr-2">{{ getCityName(checkin.cityId) }}</span>
                  <span class="badge bg-secondary text-text-secondary">{{ getMethodLabel(checkin.travelMethod) }}</span>
                </div>
                <span class="text-sm text-text-muted">{{ formatDate(checkin.travelTime) }}</span>
              </div>
              <h3 class="text-lg font-medium text-text-primary mt-2">{{ checkin.location }}</h3>
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
                    <!-- 卡片 -->
                    <div 
                      :class="[
                        'w-80 bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500 border border-warm-border/30',
                        currentScrollIndex === index 
                          ? 'scale-105 shadow-2xl z-20 ring-4 ring-primary/20' 
                          : 'scale-95 opacity-70 hover:opacity-90'
                      ]"
                    >
                      <!-- 卡片头部 - 日期和季节 -->
                      <div 
                        :class="[
                          'relative h-32 bg-gradient-to-br p-6 overflow-hidden',
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
                              <div class="text-4xl font-serif font-bold text-white">
                                {{ formatShortDate(checkin.travelTime).split('月')[0] }}
                              </div>
                              <div class="text-white/90 text-lg">
                                {{ formatShortDate(checkin.travelTime).split('月')[1] }}
                              </div>
                            </div>
                            <div class="text-right">
                              <div class="text-3xl">{{ getSeasonEmoji(checkin.travelTime) }}</div>
                              <div class="text-white/80 text-sm mt-1">{{ getSeason(checkin.travelTime) }}季</div>
                            </div>
                          </div>
                          
                          <div class="mt-3 flex items-center space-x-2">
                            <span class="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                              {{ formatYear(checkin.travelTime) }}年
                            </span>
                            <span class="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-white text-sm flex items-center space-x-1">
                              <span>{{ getMethodIcon(checkin.travelMethod) }}</span>
                              <span>{{ getMethodLabel(checkin.travelMethod) }}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <!-- 时间轴节点 -->
                      <div class="absolute left-1/2 -translate-x-1/2 -bottom-3 z-10">
                        <div 
                          :class="[
                            'w-6 h-6 rounded-full border-4 border-white shadow-lg bg-gradient-to-br',
                            getMethodColor(checkin.travelMethod)
                          ]"
                        ></div>
                      </div>

                      <!-- 卡片内容 -->
                      <div class="p-6 pt-8">
                        <!-- 城市 -->
                        <div class="flex items-center space-x-2 mb-3">
                          <span class="text-xl">📍</span>
                          <span class="badge badge-primary text-base px-4 py-1.5">
                            {{ getCityName(checkin.cityId) }}
                          </span>
                        </div>

                        <!-- 地点 -->
                        <h3 class="text-xl font-serif font-semibold text-text-primary mb-3">
                          {{ checkin.location }}
                        </h3>

                        <!-- 诗意短句 -->
                        <p class="text-text-secondary italic border-l-3 border-primary/30 pl-3 py-1 bg-primary-50/50 rounded-r-lg">
                          「{{ generateLocationPhrase(checkin) }}」
                        </p>

                        <!-- 序号标记 -->
                        <div class="mt-4 flex items-center justify-between pt-4 border-t border-warm-border">
                          <span class="text-sm text-text-muted">
                            第 {{ index + 1 }} 次出行
                          </span>
                          <span class="text-sm text-text-muted">
                            {{ formatDate(checkin.createTime).replace(/年\d+月/, '').replace('日', '') }} 记录
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 连接线装饰点 -->
                  <div 
                    v-if="index < scrollCheckins.length - 1"
                    class="flex-shrink-0 flex items-center align-self-stretch"
                    style="width: 32px; padding-top: 160px;"
                  >
                    <div class="w-full flex justify-center space-x-1">
                      <div class="w-2 h-2 rounded-full bg-primary/30"></div>
                      <div class="w-2 h-2 rounded-full bg-primary/50"></div>
                      <div class="w-2 h-2 rounded-full bg-primary/30"></div>
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
</style>
