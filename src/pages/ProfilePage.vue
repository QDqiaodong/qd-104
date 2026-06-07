<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useCheckinStore } from '@/stores/checkin'
import { useJournalStore } from '@/stores/journal'
import { useMemoryBlindbox } from '@/composables/useMemoryBlindbox'
import MemoryBlindbox from '@/components/MemoryBlindBox.vue'
import { generateMilestones, getMilestoneTheaterTitle } from '@/utils/milestones'
import type { MilestoneItem } from '@/utils/milestones'
import {
  analyzeTravelRhythm,
  getRhythmById,
  TRAVEL_RHYTHMS,
  WEEKDAY_NAMES,
  MONTH_NAMES
} from '@/utils/travelRhythm'
import type { TravelRhythmPortrait, CityVisitArchive, CityHotColdAnalysis } from '@/types'
import {
  analyzeCityHotCold,
  getCityAffinityLabel,
  getCityAffinityColor,
  getCityAffinityBgColor
} from '@/utils/cityHotCold'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const checkinStore = useCheckinStore()
const journalStore = useJournalStore()

const loading = ref(true)
const showBlindbox = ref(false)

const milestones = computed<MilestoneItem[]>(() => {
  return generateMilestones(checkinStore.checkins, journalStore.journals)
})

const theaterTitle = computed(() => {
  return getMilestoneTheaterTitle(milestones.value.length)
})

const rhythmPortrait = computed<TravelRhythmPortrait>(() => {
  return analyzeTravelRhythm(checkinStore.checkins)
})

const primaryRhythm = computed(() => {
  return getRhythmById(rhythmPortrait.value.primaryRhythm)
})

const maxMonthlyCount = computed(() => {
  return Math.max(...rhythmPortrait.value.monthlyDistribution.map(m => m.count), 1)
})

const maxWeekdayCount = computed(() => {
  return Math.max(...rhythmPortrait.value.weekdayDistribution.map(w => w.count), 1)
})

const cityHotColdAnalysis = computed<CityHotColdAnalysis>(() => {
  const myJournals = journalStore.journals.filter(
    j => j.authorId === authStore.user?.id
  )
  return analyzeCityHotCold(checkinStore.checkins, myJournals)
})

const {
  currentMemory,
  isRevealing,
  hasMemories,
  loadMemories,
  drawRandomMemory
} = useMemoryBlindbox()

onMounted(async () => {
  try {
    await Promise.all([
      userStore.fetchProfile(),
      checkinStore.fetchCities(),
      checkinStore.fetchCheckins(),
      journalStore.fetchJournals({ page: 1, pageSize: 100 })
    ])
  } finally {
    loading.value = false
  }
})

watch(() => checkinStore.checkins, (checkins) => {
  if (checkins.length > 0) {
    loadMemories(checkins.map(c => ({
      id: c.id,
      cityName: c.cityName,
      location: c.location,
      travelTime: c.travelTime,
      travelMethod: c.travelMethod
    })))
  }
}, { immediate: true })

function getCityName(cityId: number) {
  return checkinStore.cities.find(c => c.id === cityId)?.name || '未知'
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function openBlindbox() {
  showBlindbox.value = true
}

function handleDraw() {
  drawRandomMemory()
}

function closeBlindbox() {
  showBlindbox.value = false
}
</script>

<template>
  <div class="min-h-screen bg-warm-bg py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <!-- 用户信息 -->
      <div class="card mb-8">
        <div class="flex items-center space-x-6">
          <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span class="text-white text-4xl font-serif font-bold">
              {{ authStore.user?.nickname?.[0] || 'U' }}
            </span>
          </div>
          <div>
            <h1 class="text-2xl font-serif font-bold text-text-primary">
              {{ authStore.user?.nickname || '旅行者' }}
            </h1>
            <p class="text-text-secondary mt-1">{{ authStore.user?.email }}</p>
            <div class="flex items-center space-x-2 mt-3">
              <span class="badge badge-primary">旅行爱好者</span>
              <span class="badge bg-secondary text-text-secondary">记录者</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div v-for="i in 4" :key="i" class="card animate-pulse">
          <div class="h-12 bg-secondary rounded mb-2"></div>
          <div class="h-4 bg-secondary rounded w-1/2"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card text-center">
          <div class="text-4xl font-bold text-primary mb-2">{{ userStore.profile?.cityCount || 0 }}</div>
          <div class="text-text-secondary">打卡城市</div>
        </div>
        <div class="card text-center">
          <div class="text-4xl font-bold text-accent mb-2">{{ userStore.profile?.journalCount || 0 }}</div>
          <div class="text-text-secondary">发布游记</div>
        </div>
        <div class="card text-center">
          <div class="text-4xl font-bold text-primary mb-2">{{ userStore.profile?.checkinCount || 0 }}</div>
          <div class="text-text-secondary">出行次数</div>
        </div>
        <div class="card text-center">
          <div class="text-4xl font-bold text-accent mb-2">{{ userStore.profile?.collectCount || 0 }}</div>
          <div class="text-text-secondary">收藏游记</div>
        </div>
      </div>

      <!-- 里程碑剧场 -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">
            <span class="mr-2">🎭</span>
            {{ theaterTitle }}
          </h2>
          <span class="text-xs text-text-secondary">
            共 {{ milestones.length }} 个人生节点
          </span>
        </div>

        <div v-if="loading" class="card animate-pulse">
          <div class="h-40 bg-secondary rounded"></div>
        </div>

        <div v-else-if="milestones.length === 0" class="card text-center py-10">
          <div class="text-6xl mb-4">🎬</div>
          <h3 class="text-lg font-medium text-text-primary mb-2">剧场幕布尚未拉开</h3>
          <p class="text-text-secondary mb-4">开始记录你的第一次旅行，书写专属人生剧本</p>
          <router-link to="/checkin" class="btn-primary">开启旅程</router-link>
        </div>

        <div v-else class="milestone-theater">
          <!-- 剧场顶幕 -->
          <div class="theater-curtain">
            <div class="curtain-left"></div>
            <div class="curtain-right"></div>
            <div class="spotlight"></div>
          </div>

          <!-- 舞台区域 -->
          <div class="theater-stage">
            <div class="milestone-timeline">
              <div
                v-for="(milestone, index) in milestones"
                :key="milestone.id"
                class="milestone-node"
                :style="{ animationDelay: `${index * 0.15}s` }"
              >
                <!-- 时间轴连接线 -->
                <div
                  v-if="index < milestones.length - 1"
                  class="timeline-connector"
                ></div>

                <!-- 里程碑卡片 -->
                <div
                  class="milestone-card card overflow-hidden relative"
                  :class="[index % 2 === 0 ? 'milestone-left' : 'milestone-right']"
                >
                  <div class="absolute inset-0 opacity-10">
                    <div
                      class="absolute top-0 w-32 h-32 rounded-full blur-2xl"
                      :class="[
                        index % 2 === 0 ? '-left-4' : '-right-4',
                        `bg-gradient-to-br ${milestone.gradientFrom} ${milestone.gradientTo}`
                      ]"
                    ></div>
                  </div>

                  <div class="relative flex items-start space-x-4">
                    <!-- 图标舞台 -->
                    <div
                      class="milestone-icon w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0"
                      :class="[milestone.gradientFrom, milestone.gradientTo]"
                    >
                      <span class="text-2xl">{{ milestone.icon }}</span>
                    </div>

                    <!-- 内容 -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center space-x-2 mb-1">
                        <span
                          class="text-xs font-medium px-2 py-0.5 rounded-full"
                          :class="[milestone.accentColor, 'bg-white/60']"
                        >
                          第{{ index + 1 }}幕
                        </span>
                        <span v-if="milestone.date" class="text-xs text-text-secondary">
                          {{ milestone.date }}
                        </span>
                      </div>
                      <h3 class="font-bold text-text-primary text-lg mb-1">
                        {{ milestone.title }}
                      </h3>
                      <p class="text-text-secondary text-sm mb-2">
                        {{ milestone.description }}
                      </p>
                      <p
                        class="font-serif text-lg"
                        :class="milestone.accentColor"
                      >
                        {{ milestone.value }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- 节点圆点 -->
                <div
                  class="milestone-dot"
                  :class="`bg-gradient-to-br ${milestone.gradientFrom} ${milestone.gradientTo}`"
                ></div>
              </div>
            </div>

            <!-- 舞台地面 -->
            <div class="stage-floor"></div>
          </div>
        </div>
      </section>

      <!-- 旅途节奏画像 -->
      <section class="mb-8">
        <h2 class="section-title">旅途节奏画像</h2>

        <div v-if="loading" class="card animate-pulse">
          <div class="h-32 bg-secondary rounded"></div>
        </div>

        <div v-else-if="!checkinStore.checkins.length" class="card text-center py-8">
          <div class="text-5xl mb-4">🎯</div>
          <h3 class="text-lg font-medium text-text-primary mb-2">还没有足够的旅行数据</h3>
          <p class="text-text-secondary mb-4">多记录几次打卡，生成你的专属旅行节奏</p>
          <router-link to="/checkin" class="btn-primary">去打卡</router-link>
        </div>

        <div v-else class="space-y-6">
          <!-- 主节奏卡片 -->
          <div
            class="card overflow-hidden relative"
            :class="[primaryRhythm?.bgColor]"
          >
            <div class="absolute inset-0 opacity-10">
              <div
                class="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl"
                :class="`bg-gradient-to-br ${primaryRhythm?.gradientFrom} ${primaryRhythm?.gradientTo}`"
              ></div>
            </div>
            <div class="relative flex items-center space-x-6">
              <div
                class="w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0"
                :class="[primaryRhythm?.gradientFrom, primaryRhythm?.gradientTo]"
              >
                <span class="text-4xl">{{ primaryRhythm?.icon }}</span>
              </div>
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <h3 class="text-xl font-bold text-text-primary">{{ primaryRhythm?.name }}</h3>
                  <span
                    class="px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="[primaryRhythm?.bgColor, primaryRhythm?.color]"
                  >
                    主节奏
                  </span>
                </div>
                <p class="text-text-secondary text-sm mb-3">{{ primaryRhythm?.tagline }}</p>
                <p class="text-lg font-serif text-text-primary">「{{ rhythmPortrait.travelStyle }}」</p>
              </div>
            </div>
          </div>

          <!-- 四维度评分 -->
          <div class="card">
            <h3 class="font-medium text-text-primary mb-4">节奏维度分析</h3>
            <div class="space-y-4">
              <div
                v-for="score in rhythmPortrait.scores"
                :key="score.type"
                class="space-y-1"
              >
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center space-x-2">
                    <span>{{ getRhythmById(score.type)?.icon }}</span>
                    <span class="text-text-primary font-medium">{{ getRhythmById(score.type)?.name }}</span>
                  </div>
                  <span class="text-text-secondary">{{ score.percentage }}%</span>
                </div>
                <div class="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full bg-gradient-to-r transition-all duration-500"
                    :class="[
                      getRhythmById(score.type)?.gradientFrom,
                      getRhythmById(score.type)?.gradientTo
                    ]"
                    :style="{ width: `${score.percentage}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 月度分布 & 星期分布 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 月度出行分布 -->
            <div class="card">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium text-text-primary">月度出行分布</h3>
                <span class="text-xs text-text-secondary">
                  高峰: {{ rhythmPortrait.peakSeason }}
                </span>
              </div>
              <div class="flex items-end justify-between h-32 space-x-1">
                <div
                  v-for="month in rhythmPortrait.monthlyDistribution"
                  :key="month.month"
                  class="flex-1 flex flex-col items-center"
                >
                  <div
                    class="w-full rounded-t transition-all duration-300"
                    :class="[
                      month.count > 0
                        ? 'bg-gradient-to-t from-primary to-accent'
                        : 'bg-secondary'
                    ]"
                    :style="{
                      height: `${(month.count / maxMonthlyCount) * 80 + 4}px`,
                      minHeight: '4px'
                    }"
                  ></div>
                  <span class="text-xs text-text-secondary mt-1">{{ MONTH_NAMES[month.month - 1] }}</span>
                </div>
              </div>
            </div>

            <!-- 星期出行分布 -->
            <div class="card">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium text-text-primary">星期出行分布</h3>
                <span class="text-xs text-text-secondary">
                  共 {{ rhythmPortrait.totalCheckins }} 次打卡
                </span>
              </div>
              <div class="flex items-end justify-between h-32 space-x-1">
                <div
                  v-for="day in rhythmPortrait.weekdayDistribution"
                  :key="day.weekday"
                  class="flex-1 flex flex-col items-center"
                >
                  <div
                    class="w-full rounded-t transition-all duration-300"
                    :class="[
                      day.weekday === 0 || day.weekday === 6
                        ? day.count > 0
                          ? 'bg-gradient-to-t from-amber-400 to-orange-500'
                          : 'bg-secondary'
                        : day.count > 0
                          ? 'bg-gradient-to-t from-primary to-accent'
                          : 'bg-secondary'
                    ]"
                    :style="{
                      height: `${(day.count / maxWeekdayCount) * 80 + 4}px`,
                      minHeight: '4px'
                    }"
                  ></div>
                  <span
                    class="text-xs mt-1"
                    :class="[
                      day.weekday === 0 || day.weekday === 6
                        ? 'text-amber-600 font-medium'
                        : 'text-text-secondary'
                    ]"
                  >{{ WEEKDAY_NAMES[day.weekday] }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 节奏标签云 -->
          <div class="card">
            <h3 class="font-medium text-text-primary mb-4">旅行风格标签</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="rhythm in TRAVEL_RHYTHMS"
                :key="rhythm.id"
                class="px-3 py-1.5 rounded-full text-sm"
                :class="[
                  rhythm.id === rhythmPortrait.primaryRhythm
                    ? `${rhythm.bgColor} ${rhythm.color} font-medium`
                    : 'bg-secondary text-text-secondary'
                ]"
              >
                {{ rhythm.icon }} {{ rhythm.name }}
              </span>
              <span class="px-3 py-1.5 rounded-full text-sm bg-primary-50 text-primary font-medium">
                🌍 {{ rhythmPortrait.peakSeason }}出行
              </span>
              <span class="px-3 py-1.5 rounded-full text-sm bg-accent-light text-accent font-medium">
                📊 {{ rhythmPortrait.totalCheckins }} 次足迹
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 城市冷热门发现 -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">
            <span class="mr-2">🔥</span>
            城市冷热门发现
          </h2>
          <span class="text-xs text-text-secondary">
            基于 {{ cityHotColdAnalysis.totalCities }} 座城市分析
          </span>
        </div>

        <div v-if="loading" class="card animate-pulse">
          <div class="h-32 bg-secondary rounded"></div>
        </div>

        <div v-else-if="cityHotColdAnalysis.totalCities === 0" class="card text-center py-8">
          <div class="text-5xl mb-4">🗺️</div>
          <h3 class="text-lg font-medium text-text-primary mb-2">还没有足够的旅行数据</h3>
          <p class="text-text-secondary mb-4">多去几座城市，发现你的旅行偏爱</p>
          <router-link to="/checkin" class="btn-primary">去打卡</router-link>
        </div>

        <div v-else class="space-y-6">
          <!-- 核心数据卡片 -->
          <div class="grid grid-cols-3 gap-4">
            <div class="card text-center">
              <div class="text-3xl font-bold text-primary mb-1">{{ cityHotColdAnalysis.totalCities }}</div>
              <div class="text-sm text-text-secondary">足迹城市</div>
            </div>
            <div class="card text-center">
              <div class="text-3xl font-bold text-amber-500 mb-1">{{ cityHotColdAnalysis.revisitRate }}%</div>
              <div class="text-sm text-text-secondary">城市回访率</div>
            </div>
            <div class="card text-center">
              <div class="text-3xl font-bold text-rose-500 mb-1">{{ cityHotColdAnalysis.frequentlyVisited.length }}</div>
              <div class="text-sm text-text-secondary">反复回访</div>
            </div>
          </div>

          <!-- 最偏爱城市 -->
          <div v-if="cityHotColdAnalysis.favoriteCity" class="card overflow-hidden relative bg-gradient-to-r from-rose-50 to-amber-50">
            <div class="absolute inset-0 opacity-10">
              <div class="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl bg-gradient-to-br from-rose-400 to-amber-400"></div>
            </div>
            <div class="relative flex items-center space-x-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center shadow-lg flex-shrink-0">
                <span class="text-3xl">❤️</span>
              </div>
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="text-sm text-rose-600 font-medium">最偏爱的城市</span>
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-white/80 text-rose-600">
                    {{ getCityAffinityLabel(cityHotColdAnalysis.favoriteCity.visitCount) }}
                  </span>
                </div>
                <h3 class="text-xl font-bold text-text-primary">{{ cityHotColdAnalysis.favoriteCity.cityName }}</h3>
                <p class="text-sm text-text-secondary mt-1">
                  累计到访 <span class="font-medium text-rose-600">{{ cityHotColdAnalysis.favoriteCity.visitCount }}</span> 次
                  · 留下 <span class="font-medium text-amber-600">{{ cityHotColdAnalysis.favoriteCity.journalCount }}</span> 篇游记
                </p>
              </div>
            </div>
          </div>

          <!-- 冷热对照 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 反复回访的城市 -->
            <div class="card">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                  <span class="text-lg">🔥</span>
                  <h3 class="font-medium text-text-primary">反复回访的城市</h3>
                </div>
                <span class="text-xs text-rose-500 font-medium">
                  {{ cityHotColdAnalysis.frequentlyVisited.length }} 座
                </span>
              </div>

              <div v-if="cityHotColdAnalysis.frequentlyVisited.length === 0" class="text-center py-6">
                <div class="text-3xl mb-2">💫</div>
                <p class="text-sm text-text-secondary">还没有反复回访的城市</p>
              </div>

              <div v-else class="space-y-3 max-h-80 overflow-y-auto">
                <div
                  v-for="city in cityHotColdAnalysis.frequentlyVisited"
                  :key="city.cityId"
                  class="flex items-center justify-between p-3 rounded-xl transition-colors"
                  :class="getCityAffinityBgColor(city.visitCount)"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                      <span class="text-lg">📍</span>
                    </div>
                    <div>
                      <div class="font-medium text-text-primary">{{ city.cityName }}</div>
                      <div class="text-xs text-text-secondary">
                        {{ city.journalCount > 0 ? `${city.journalCount} 篇游记` : '' }}
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold" :class="getCityAffinityColor(city.visitCount)">
                      {{ city.visitCount }}
                    </div>
                    <div class="text-xs text-text-secondary">次到访</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 只停留过一次的城市 -->
            <div class="card">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                  <span class="text-lg">❄️</span>
                  <h3 class="font-medium text-text-primary">只停留过一次的城市</h3>
                </div>
                <span class="text-xs text-sky-500 font-medium">
                  {{ cityHotColdAnalysis.onceVisited.length }} 座
                </span>
              </div>

              <div v-if="cityHotColdAnalysis.onceVisited.length === 0" class="text-center py-6">
                <div class="text-3xl mb-2">🎯</div>
                <p class="text-sm text-text-secondary">每座城市都值得再访</p>
              </div>

              <div v-else class="space-y-2 max-h-80 overflow-y-auto">
                <div
                  v-for="city in cityHotColdAnalysis.onceVisited"
                  :key="city.cityId"
                  class="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <span class="text-base">🏙️</span>
                    </div>
                    <div>
                      <div class="font-medium text-text-primary text-sm">{{ city.cityName }}</div>
                      <div class="text-xs text-text-secondary">
                        {{ formatDate(city.firstVisit) }}
                      </div>
                    </div>
                  </div>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-white text-slate-500">
                    初遇
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 旅行洞察 -->
          <div class="card bg-secondary/30">
            <div class="flex items-start space-x-3">
              <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                <span class="text-xl">💡</span>
              </div>
              <div>
                <h3 class="font-medium text-text-primary mb-1">旅行洞察</h3>
                <p class="text-sm text-text-secondary leading-relaxed">
                  <template v-if="cityHotColdAnalysis.revisitRate >= 50">
                    你是一位「念旧的旅行者」，超过一半的城市都有你重访的足迹。
                    那些反复抵达的地方，一定藏着你特别的情感和故事。
                  </template>
                  <template v-else-if="cityHotColdAnalysis.revisitRate >= 20">
                    你在「探索与回味」之间找到了平衡，既有新鲜城市的冒险，
                    也有偏爱之地的重逢。每一种旅行都是独一无二的体验。
                  </template>
                  <template v-else-if="cityHotColdAnalysis.totalCities > 0">
                    你是一位「好奇的探索者」，每座城市都只留下一次足迹。
                    世界那么大，还有无数未知在等着你去发现。
                  </template>
                  <template v-else>
                    开始记录你的旅行吧，每一座城市都有属于它的故事。
                  </template>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 城市到访档案 -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">城市到访档案</h2>
          <router-link to="/checkin" class="link text-sm">查看全部</router-link>
        </div>

        <div v-if="loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="card animate-pulse">
            <div class="h-6 bg-secondary rounded w-1/3 mb-3"></div>
            <div class="h-4 bg-secondary rounded w-1/2 mb-2"></div>
            <div class="h-4 bg-secondary rounded w-2/3"></div>
          </div>
        </div>

        <div v-else-if="checkinStore.cityVisitArchives.length === 0" class="card text-center py-8">
          <div class="text-5xl mb-4">🌍</div>
          <h3 class="text-lg font-medium text-text-primary mb-2">还没有打卡记录</h3>
          <p class="text-text-secondary mb-4">去打卡你的第一个城市吧</p>
          <router-link to="/checkin" class="btn-primary">开始打卡</router-link>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="archive in checkinStore.cityVisitArchives"
            :key="archive.cityId"
            class="card overflow-hidden"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <span class="text-2xl">📍</span>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-text-primary">{{ archive.cityName }}</h3>
                  <p class="text-sm text-text-secondary">
                    累计到访 <span class="text-primary font-bold">{{ archive.visitCount }}</span> 次
                  </p>
                </div>
              </div>
              <div class="text-right">
                <div class="badge badge-primary">
                  第 {{ archive.visitCount }} 次到访
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="bg-secondary/50 rounded-lg p-3">
                <div class="text-xs text-text-secondary mb-1">首次到达</div>
                <div class="text-sm font-medium text-text-primary">
                  {{ formatDate(archive.firstVisit) }}
                </div>
              </div>
              <div class="bg-secondary/50 rounded-lg p-3">
                <div class="text-xs text-text-secondary mb-1">最近一次</div>
                <div class="text-sm font-medium text-text-primary">
                  {{ formatDate(archive.lastVisit) }}
                </div>
              </div>
            </div>

            <div v-if="archive.locations.length > 0">
              <div class="text-xs text-text-secondary mb-2">停留地点</div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(location, idx) in archive.locations"
                  :key="idx"
                  class="px-2.5 py-1 text-xs rounded-full bg-primary-50 text-primary"
                >
                  {{ location }}
                </span>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-secondary">
              <div class="text-xs text-text-secondary mb-2">到访记录</div>
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <div
                  v-for="checkin in archive.checkins"
                  :key="checkin.id"
                  class="flex items-center justify-between text-sm py-1"
                >
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 rounded-full bg-accent"></div>
                    <span class="text-text-primary">{{ checkin.location || '未命名地点' }}</span>
                  </div>
                  <span class="text-text-secondary text-xs">{{ formatDate(checkin.travelTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 城市记忆盲盒 -->
      <section class="mb-8">
        <h2 class="section-title">城市记忆盲盒</h2>
        <div
          class="card card-hover cursor-pointer overflow-hidden relative"
          @click="openBlindbox"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10"></div>
          <div class="relative flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span class="text-3xl">🎁</span>
              </div>
              <div>
                <h3 class="font-bold text-text-primary text-lg">随机重逢</h3>
                <p class="text-sm text-text-secondary">从历史足迹中抽取一段旅行回忆</p>
              </div>
            </div>
            <div class="flex items-center space-x-2 text-purple-600">
              <span class="text-sm font-medium">开启盲盒</span>
              <span class="text-xl">→</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 快捷操作 -->
      <section>
        <h2 class="section-title">快捷操作</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <router-link to="/publish" class="card card-hover flex items-center space-x-4">
            <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <span class="text-2xl">✏️</span>
            </div>
            <div>
              <h3 class="font-medium text-text-primary">发布游记</h3>
              <p class="text-sm text-text-secondary">分享你的旅行故事</p>
            </div>
          </router-link>

          <router-link to="/checkin" class="card card-hover flex items-center space-x-4">
            <div class="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center">
              <span class="text-2xl">📍</span>
            </div>
            <div>
              <h3 class="font-medium text-text-primary">打卡记录</h3>
              <p class="text-sm text-text-secondary">记录你的足迹</p>
            </div>
          </router-link>

          <router-link to="/collection" class="card card-hover flex items-center space-x-4">
            <div class="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <span class="text-2xl">📚</span>
            </div>
            <div>
              <h3 class="font-medium text-text-primary">我的收藏</h3>
              <p class="text-sm text-text-secondary">查看收藏的游记</p>
            </div>
          </router-link>
        </div>
      </section>

      <MemoryBlindbox
        :visible="showBlindbox"
        :memory="currentMemory"
        :is-revealing="isRevealing"
        :has-memories="hasMemories"
        @close="closeBlindbox"
        @draw="handleDraw"
      />
    </div>
  </div>
</template>

<style scoped>
.milestone-theater {
  position: relative;
}

.theater-curtain {
  position: relative;
  height: 32px;
  overflow: hidden;
  margin-bottom: -8px;
  z-index: 2;
}

.curtain-left,
.curtain-right {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(180deg, #7c3aed 0%, #4f46e5 100%);
  opacity: 0.8;
}

.curtain-left {
  left: 0;
  border-radius: 0 0 40% 0;
  transform-origin: top left;
  animation: curtainOpenLeft 1.5s ease-out forwards;
}

.curtain-right {
  right: 0;
  border-radius: 0 0 0 40%;
  transform-origin: top right;
  animation: curtainOpenRight 1.5s ease-out forwards;
}

.spotlight {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 100%;
  background: linear-gradient(180deg, rgba(251, 191, 36, 0.4) 0%, transparent 100%);
  border-radius: 50% 50% 0 0;
  animation: spotlightPulse 3s ease-in-out infinite;
}

@keyframes curtainOpenLeft {
  from { transform: scaleX(1); }
  to { transform: scaleX(0.3); }
}

@keyframes curtainOpenRight {
  from { transform: scaleX(1); }
  to { transform: scaleX(0.3); }
}

@keyframes spotlightPulse {
  0%, 100% { opacity: 0.6; width: 100px; }
  50% { opacity: 1; width: 140px; }
}

.theater-stage {
  position: relative;
  padding: 20px 0 30px;
}

.milestone-timeline {
  position: relative;
  padding: 10px 0;
}

.milestone-node {
  position: relative;
  display: flex;
  align-items: center;
  opacity: 0;
  animation: milestoneAppear 0.8s ease-out forwards;
  margin-bottom: 24px;
}

.milestone-node:last-child {
  margin-bottom: 0;
}

@keyframes milestoneAppear {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.timeline-connector {
  position: absolute;
  left: 50%;
  top: 56px;
  bottom: -24px;
  width: 2px;
  background: linear-gradient(
    180deg,
    #c4b5fd 0%,
    #a78bfa 50%,
    #c4b5fd 100%
  );
  transform: translateX(-50%);
  z-index: 0;
}

.milestone-dot {
  position: absolute;
  left: 50%;
  top: 44px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transform: translateX(-50%);
  z-index: 3;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9),
              0 0 20px rgba(167, 139, 250, 0.5);
  animation: dotGlow 2s ease-in-out infinite;
}

@keyframes dotGlow {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9),
                0 0 15px rgba(167, 139, 250, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9),
                0 0 25px rgba(167, 139, 250, 0.7);
  }
}

.milestone-card {
  position: relative;
  width: calc(50% - 36px);
  z-index: 2;
}

.milestone-left {
  margin-right: auto;
  margin-left: 0;
}

.milestone-right {
  margin-left: auto;
  margin-right: 0;
}

.milestone-icon {
  animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.stage-floor {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(139, 92, 246, 0.1) 50%,
    rgba(139, 92, 246, 0.15) 100%
  );
  border-radius: 0 0 16px 16px;
  pointer-events: none;
}

@media (max-width: 768px) {
  .milestone-timeline {
    padding-left: 8px;
  }

  .milestone-card {
    width: calc(100% - 44px);
    margin-left: 44px !important;
    margin-right: 0 !important;
  }

  .timeline-connector {
    left: 16px;
    top: 48px;
  }

  .milestone-dot {
    left: 16px;
    top: 36px;
    width: 12px;
    height: 12px;
  }

  .milestone-icon {
    width: 44px !important;
    height: 44px !important;
  }

  .milestone-icon span {
    font-size: 1.25rem;
  }
}
</style>
