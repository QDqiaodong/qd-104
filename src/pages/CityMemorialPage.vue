<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCityMemorialStore } from '@/stores/cityMemorial'
import { useCheckinStore } from '@/stores/checkin'
import { useJournalStore } from '@/stores/journal'
import { useAuthStore } from '@/stores/auth'
import type { CityMemorialPage as CityMemorialPageType, TravelMethodStat } from '@/types'

const route = useRoute()
const router = useRouter()
const cityMemorialStore = useCityMemorialStore()
const checkinStore = useCheckinStore()
const journalStore = useJournalStore()
const authStore = useAuthStore()

const loading = ref(true)
const cityId = computed(() => Number(route.params.id))

const memorialPage = computed<CityMemorialPageType | null>(() => {
  return cityMemorialStore.getMemorialPage(cityId.value) || null
})

onMounted(async () => {
  try {
    if (authStore.isLoggedIn && !authStore.user) {
      await authStore.fetchCurrentUser()
    }

    await Promise.all([
      checkinStore.fetchCities(),
      checkinStore.fetchCheckins(),
      journalStore.fetchJournals({ page: 1, pageSize: 100 })
    ])
    
    cityMemorialStore.ensureMemorialPage(cityId.value)
    
    if (memorialPage.value?.isNewlyUnlocked) {
      setTimeout(() => {
        cityMemorialStore.clearNewlyUnlocked()
      }, 3000)
    }
  } finally {
    loading.value = false
  }
})

watch(
  () => authStore.user?.id,
  () => {
    if (authStore.user?.id != null && checkinStore.checkins.length > 0) {
      cityMemorialStore.ensureMemorialPage(cityId.value)
    }
  }
)

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

function getMethodColor(method: string) {
  const colors: { [key: string]: string } = {
    plane: 'from-sky-400 to-blue-500',
    train: 'from-green-400 to-emerald-500',
    car: 'from-orange-400 to-amber-500',
    walk: 'from-teal-400 to-cyan-500',
    other: 'from-purple-400 to-violet-500'
  }
  return colors[method] || colors.other
}

function getDaysBetween(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

function goBack() {
  router.back()
}

function goToJournal(journalId: number) {
  router.push(`/journal/${journalId}`)
}

const primaryMethodStat = computed<TravelMethodStat | null>(() => {
  if (!memorialPage.value?.travelMethods.length) return null
  return memorialPage.value.travelMethods[0]
})

const totalTravelDays = computed(() => {
  if (!memorialPage.value) return 0
  return memorialPage.value.totalDays
})
</script>

<template>
  <div class="min-h-screen bg-warm-bg">
    <!-- 返回按钮 -->
    <div class="fixed top-4 left-4 z-50">
      <button
        @click="goBack"
        class="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-text-primary hover:bg-white transition-all"
      >
        <span class="text-lg">←</span>
      </button>
    </div>

    <!-- 新解锁动画 -->
    <transition name="unlock">
      <div
        v-if="memorialPage?.isNewlyUnlocked"
        class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <div class="text-center">
          <div class="text-8xl mb-6 animate-bounce">🎉</div>
          <h2 class="text-4xl font-serif font-bold text-white mb-4">解锁新城市！</h2>
          <p class="text-2xl text-white/90">{{ memorialPage?.cityName }}</p>
          <p class="text-white/70 mt-2">专属纪念页已生成</p>
        </div>
      </div>
    </transition>

    <!-- 加载状态 -->
    <div v-if="loading" class="container mx-auto px-4 py-8 max-w-4xl">
      <div class="card animate-pulse">
        <div class="h-64 bg-secondary rounded-2xl mb-6"></div>
        <div class="h-8 bg-secondary rounded w-1/3 mb-4"></div>
        <div class="h-4 bg-secondary rounded w-2/3 mb-6"></div>
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="h-20 bg-secondary rounded-xl"></div>
          <div class="h-20 bg-secondary rounded-xl"></div>
          <div class="h-20 bg-secondary rounded-xl"></div>
        </div>
      </div>
    </div>

    <!-- 主内容 -->
    <div v-else-if="memorialPage" class="pb-12">
      <!-- 头部封面 -->
      <div class="relative h-72 overflow-hidden">
        <div 
          class="absolute inset-0 bg-gradient-to-br from-primary via-accent to-rose-400"
        >
          <div class="absolute inset-0 opacity-20">
            <div class="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/30 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div class="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-amber-300/30 blur-3xl translate-x-1/3 translate-y-1/3"></div>
          </div>
        </div>
        
        <div class="relative h-full container mx-auto px-4 flex flex-col justify-end pb-8 max-w-4xl">
          <div class="flex items-center space-x-2 mb-3">
            <span class="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              {{ memorialPage.cityProvince }}
            </span>
            <span v-if="memorialPage.isNewlyUnlocked" class="px-3 py-1 bg-amber-400 rounded-full text-white text-sm font-medium animate-pulse">
              ✨ 新解锁
            </span>
          </div>
          <h1 class="text-5xl font-serif font-bold text-white drop-shadow-lg mb-2">
            {{ memorialPage.cityName }}
          </h1>
          <p v-if="memorialPage.cityDescription" class="text-white/90 text-lg max-w-xl">
            {{ memorialPage.cityDescription }}
          </p>
        </div>
      </div>

      <div class="container mx-auto px-4 max-w-4xl -mt-6 relative z-10">
        <!-- 核心数据卡片 -->
        <div class="card shadow-xl mb-8">
          <div class="grid grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-primary mb-1">{{ memorialPage.visitCount }}</div>
              <div class="text-sm text-text-secondary">到访次数</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-accent mb-1">{{ totalTravelDays }}</div>
              <div class="text-sm text-text-secondary">停留天数</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-rose-500 mb-1">{{ memorialPage.journalCount }}</div>
              <div class="text-sm text-text-secondary">旅行游记</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-amber-500 mb-1">{{ memorialPage.locations.length }}</div>
              <div class="text-sm text-text-secondary">探索地点</div>
            </div>
          </div>
        </div>

        <!-- 首次到访 -->
        <section class="mb-8">
          <div class="card overflow-hidden bg-gradient-to-r from-primary-50 to-accent-50">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg flex-shrink-0">
                <span class="text-3xl">🎫</span>
              </div>
              <div class="flex-1">
                <div class="text-sm text-text-secondary mb-1">首次到访</div>
                <div class="text-2xl font-serif font-bold text-text-primary">
                  {{ formatDate(memorialPage.firstVisit) }}
                </div>
                <div class="text-sm text-text-secondary mt-1">
                  距离现在 {{ Math.floor((Date.now() - new Date(memorialPage.firstVisit).getTime()) / (1000 * 60 * 60 * 24)) }} 天
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-text-secondary mb-1">最近一次</div>
                <div class="text-lg font-medium text-text-primary">
                  {{ formatShortDate(memorialPage.lastVisit) }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 代表照片 -->
        <section v-if="memorialPage.representativePhotos.length > 0" class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="section-title mb-0">
              <span class="mr-2">📸</span>
              代表照片
            </h2>
            <span class="text-xs text-text-secondary">
              共 {{ memorialPage.representativePhotos.length }} 张
            </span>
          </div>
          <div class="card overflow-hidden">
            <div class="photo-grid">
              <div
                v-for="(photo, index) in memorialPage.representativePhotos.slice(0, 9)"
                :key="index"
                class="photo-item"
                :class="{
                  'photo-large': index === 0,
                  'photo-medium': index === 1 || index === 2
                }"
              >
                <img :src="photo" :alt="`${memorialPage.cityName} 照片 ${index + 1}`" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        <!-- 出行方式 -->
        <section v-if="memorialPage.travelMethods.length > 0" class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="section-title mb-0">
              <span class="mr-2">🚀</span>
              出行方式
            </h2>
            <span v-if="primaryMethodStat" class="text-xs text-text-secondary">
              主要方式：{{ primaryMethodStat.label }}
            </span>
          </div>
          <div class="card">
            <div class="space-y-4">
              <div
                v-for="stat in memorialPage.travelMethods"
                :key="stat.method"
                class="flex items-center space-x-4"
              >
                <div 
                  class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0"
                  :class="getMethodColor(stat.method)"
                >
                  <span class="text-2xl">{{ stat.icon }}</span>
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-text-primary">{{ stat.label }}</span>
                    <span class="text-sm text-text-secondary">{{ stat.count }} 次</span>
                  </div>
                  <div class="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full bg-gradient-to-r transition-all duration-500"
                      :class="getMethodColor(stat.method)"
                      :style="{ width: `${(stat.count / memorialPage.visitCount) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 相关游记 -->
        <section v-if="memorialPage.journals.length > 0" class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="section-title mb-0">
              <span class="mr-2">📝</span>
              旅行游记
            </h2>
            <span class="text-xs text-text-secondary">
              共 {{ memorialPage.journals.length }} 篇
            </span>
          </div>
          <div class="space-y-4">
            <div
              v-for="journal in memorialPage.journals"
              :key="journal.id"
              @click="goToJournal(journal.id)"
              class="card card-hover cursor-pointer"
            >
              <div class="flex items-start space-x-4">
                <div v-if="journal.images && journal.images.length > 0" class="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
                  <img :src="journal.images[0]" :alt="journal.title" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-text-primary mb-1 truncate">{{ journal.title }}</h3>
                  <p class="text-sm text-text-secondary line-clamp-2 mb-2">{{ journal.content }}</p>
                  <div class="flex items-center space-x-3 text-xs text-text-muted">
                    <span>{{ formatDate(journal.createTime) }}</span>
                    <span>·</span>
                    <span>❤️ {{ journal.likeCount }}</span>
                    <span>·</span>
                    <span>📚 {{ journal.collectCount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 探索地点 -->
        <section v-if="memorialPage.locations.length > 0" class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="section-title mb-0">
              <span class="mr-2">📍</span>
              探索足迹
            </h2>
            <span class="text-xs text-text-secondary">
              {{ memorialPage.locations.length }} 个地点
            </span>
          </div>
          <div class="card">
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(location, index) in memorialPage.locations"
                :key="index"
                class="px-3 py-1.5 rounded-full text-sm bg-primary-50 text-primary font-medium"
              >
                {{ location }}
              </span>
            </div>
          </div>
        </section>

        <!-- 打卡时间线 -->
        <section class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="section-title mb-0">
              <span class="mr-2">📅</span>
              到访记录
            </h2>
            <span class="text-xs text-text-secondary">
              共 {{ memorialPage.checkins.length }} 次
            </span>
          </div>
          <div class="card">
            <div class="relative">
              <div class="absolute left-6 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-accent to-rose-300"></div>
              
              <div class="space-y-4">
                <div
                  v-for="(checkin, index) in [...memorialPage.checkins].reverse()"
                  :key="checkin.id"
                  class="relative flex items-start space-x-4 pl-12"
                >
                  <div 
                    class="absolute left-4 w-5 h-5 rounded-full border-4 border-white shadow-md bg-gradient-to-br"
                    :class="getMethodColor(checkin.travelMethod)"
                  ></div>
                  
                  <div class="flex-1 bg-secondary/30 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center space-x-2">
                        <span class="text-lg">{{ cityMemorialStore.getMethodConfig(checkin.travelMethod).icon }}</span>
                        <span class="font-medium text-text-primary">{{ checkin.location }}</span>
                      </div>
                      <span class="text-sm text-text-secondary">{{ formatShortDate(checkin.travelTime) }}</span>
                    </div>
                    <div class="text-xs text-text-muted">
                      {{ formatDate(checkin.travelTime) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 纪念页底部 -->
        <div class="text-center py-8">
          <div class="text-5xl mb-4">🏆</div>
          <p class="text-text-secondary text-lg font-serif">
            「{{ memorialPage.cityName }}」的专属回忆
          </p>
          <p class="text-text-muted text-sm mt-2">
            自 {{ formatDate(memorialPage.firstVisit) }} 起的故事
          </p>
        </div>
      </div>
    </div>

    <!-- 未找到页面 -->
    <div v-else class="container mx-auto px-4 py-16 max-w-4xl">
      <div class="card text-center py-16">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-medium text-text-primary mb-2">未找到该城市纪念页</h3>
        <p class="text-text-secondary mb-6">去打卡这座城市，生成你的专属纪念页吧</p>
        <router-link to="/checkin" class="btn-primary">去打卡</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 120px;
  gap: 4px;
}

.photo-item {
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.photo-item:hover {
  transform: scale(1.02);
}

.photo-large {
  grid-column: span 2;
  grid-row: span 2;
}

.photo-medium {
  grid-row: span 1;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.unlock-enter-active,
.unlock-leave-active {
  transition: all 0.5s ease;
}

.unlock-enter-from,
.unlock-leave-to {
  opacity: 0;
}

.unlock-enter-from h2,
.unlock-leave-to h2 {
  transform: scale(0.8);
}
</style>
