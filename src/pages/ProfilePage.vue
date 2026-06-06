<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useCheckinStore } from '@/stores/checkin'
import { useMemoryBlindbox } from '@/composables/useMemoryBlindbox'
import MemoryBlindbox from '@/components/MemoryBlindBox.vue'
import {
  analyzeTravelRhythm,
  getRhythmById,
  TRAVEL_RHYTHMS,
  WEEKDAY_NAMES,
  MONTH_NAMES
} from '@/utils/travelRhythm'
import type { TravelRhythmPortrait } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const checkinStore = useCheckinStore()

const loading = ref(true)
const showBlindbox = ref(false)

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
      checkinStore.fetchCheckins()
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

      <!-- 已打卡城市 -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">我的足迹</h2>
          <router-link to="/checkin" class="link text-sm">查看全部</router-link>
        </div>

        <div v-if="loading" class="card animate-pulse">
          <div class="h-24 bg-secondary rounded"></div>
        </div>

        <div v-else-if="!userStore.profile?.cities?.length" class="card text-center py-8">
          <div class="text-5xl mb-4">🌍</div>
          <h3 class="text-lg font-medium text-text-primary mb-2">还没有打卡记录</h3>
          <p class="text-text-secondary mb-4">去打卡你的第一个城市吧</p>
          <router-link to="/checkin" class="btn-primary">开始打卡</router-link>
        </div>

        <div v-else class="card">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="city in userStore.profile?.cities"
              :key="city.id"
              class="aspect-square rounded-xl bg-gradient-to-br from-primary-50 to-secondary flex items-center justify-center"
            >
              <div class="text-center">
                <div class="text-3xl mb-1">📍</div>
                <div class="font-medium text-text-primary">{{ city.name }}</div>
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
