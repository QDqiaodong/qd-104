<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useJournalStore } from '@/stores/journal'
import { useCheckinStore } from '@/stores/checkin'
import FootprintHeatmap from '@/components/FootprintHeatmap.vue'
import type { Journal } from '@/types'

const router = useRouter()
const journalStore = useJournalStore()
const checkinStore = useCheckinStore()

const loading = ref(true)
const selectedCity = ref<number | undefined>()
const searchKeyword = ref('')

// 本地SVG占位图
function getPlaceHolderImage(cityName: string): string {
  const colors = ['%238B7355', '%23A68B6A', '%23C0A88D', '%23D4C4B0']
  const color = colors[cityName.charCodeAt(0) % colors.length]
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='${color}' stop-opacity='0.8'/%3E%3Cstop offset='100%25' stop-color='%23E8B4B8' stop-opacity='0.6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='800' height='600'/%3E%3Ctext x='400' y='300' text-anchor='middle' fill='%23ffffff' font-size='28' font-family='serif'%3E${encodeURIComponent(cityName)}%3C/text%3E%3Ctext x='400' y='340' text-anchor='middle' fill='%23ffffff' font-size='16'%3E旅行记忆%3C/text%3E%3C/svg%3E`
}

// 模拟数据用于展示
const mockJournals: Journal[] = [
  {
    id: 1,
    title: '杭州西湖：一场说走就走的旅行',
    content: '春天的西湖，杨柳依依，碧波荡漾...',
    images: [getPlaceHolderImage('杭州西湖')],
    cityId: 3,
    cityName: '杭州市',
    authorId: 1,
    authorName: '旅行者小王',
    createTime: '2024-03-15',
    likeCount: 128,
    collectCount: 45
  },
  {
    id: 2,
    title: '成都火锅：舌尖上的麻辣盛宴',
    content: '成都的火锅，麻辣鲜香，让人回味无穷...',
    images: [getPlaceHolderImage('成都火锅')],
    cityId: 10,
    cityName: '成都市',
    authorId: 2,
    authorName: '美食家小李',
    createTime: '2024-03-10',
    likeCount: 256,
    collectCount: 89
  },
  {
    id: 3,
    title: '上海外滩：感受魔都的夜晚',
    content: '外滩的夜景，灯火辉煌，百年风情...',
    images: [getPlaceHolderImage('上海外滩')],
    cityId: 2,
    cityName: '上海市',
    authorId: 3,
    authorName: '城市探索者',
    createTime: '2024-03-08',
    likeCount: 189,
    collectCount: 67
  },
  {
    id: 4,
    title: '苏州园林：一步一景的诗意生活',
    content: '苏州的园林，每一处都是精心设计的山水画...',
    images: [getPlaceHolderImage('苏州园林')],
    cityId: 7,
    cityName: '苏州市',
    authorId: 4,
    authorName: '文艺青年',
    createTime: '2024-03-05',
    likeCount: 145,
    collectCount: 52
  }
]

onMounted(async () => {
  try {
    await Promise.all([
      journalStore.fetchJournals({ page: 1, pageSize: 10 }),
      checkinStore.fetchCities()
    ])
  } finally {
    loading.value = false
  }
})

function goToJournalDetail(journal: Journal) {
  router.push(`/journal/${journal.id}`)
}

function handleCityFilter(cityId: number | undefined) {
  selectedCity.value = cityId
  journalStore.fetchJournals({ page: 1, pageSize: 10, cityId })
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <div>
    <!-- Hero区域 -->
    <section class="relative h-[500px] overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary to-accent opacity-90"></div>
      <div class="relative h-full flex items-center justify-center text-center px-4">
        <div class="max-w-3xl">
          <h1 class="text-5xl md:text-6xl font-serif font-bold text-white mb-6 animate-fade-in">
            记录你的每一步
          </h1>
          <p class="text-xl text-white/90 mb-8 animate-fade-in stagger-1">
            用文字和照片，留住每一次旅行的美好瞬间
          </p>
          <div class="flex flex-wrap justify-center gap-4 animate-fade-in stagger-2">
            <router-link to="/register" class="btn-accent px-8 py-3 text-lg">
              开始记录
            </router-link>
            <router-link to="/checkin" class="bg-white/20 backdrop-blur text-white px-8 py-3 rounded-xl font-medium hover:bg-white/30 transition-all">
              查看打卡
            </router-link>
          </div>
        </div>
      </div>
      <!-- 装饰波浪 -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#FAF8F5" />
        </svg>
      </div>
    </section>

    <!-- 筛选区域 -->
    <section class="py-8 bg-warm-bg">
      <div class="container mx-auto px-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[200px]">
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索游记..."
              class="input-field"
            />
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              @click="handleCityFilter(undefined)"
              :class="['badge', !selectedCity ? 'badge-primary' : 'bg-white text-text-secondary border border-warm-border']"
            >
              全部
            </button>
            <button
              v-for="city in checkinStore.cities"
              :key="city.id"
              @click="handleCityFilter(city.id)"
              :class="['badge', selectedCity === city.id ? 'badge-primary' : 'bg-white text-text-secondary border border-warm-border']"
            >
              {{ city.name }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 足迹热力图 -->
    <section class="py-12 bg-white">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between mb-6">
          <h2 class="section-title mb-0">足迹日历</h2>
          <p class="text-text-muted text-sm">点击日期查看当天的游记和打卡</p>
        </div>
        <FootprintHeatmap />
      </div>
    </section>

    <!-- 游记列表 -->
    <section class="py-12">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between mb-8">
          <h2 class="section-title mb-0">发现精彩游记</h2>
          <span class="text-text-muted">共 {{ journalStore.total || mockJournals.length }} 篇</span>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="i in 6" :key="i" class="card animate-pulse">
            <div class="h-48 bg-secondary rounded-xl mb-4"></div>
            <div class="h-6 bg-secondary rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-secondary rounded w-1/2"></div>
          </div>
        </div>

        <!-- 游记卡片 -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article
            v-for="(journal, index) in (journalStore.journals.length > 0 ? journalStore.journals : mockJournals)"
            :key="journal.id"
            class="card card-hover cursor-pointer animate-fade-in"
            :class="`stagger-${(index % 5) + 1}`"
            @click="goToJournalDetail(journal)"
          >
            <!-- 图片 -->
            <div class="relative h-48 rounded-xl overflow-hidden mb-4">
              <img
                :src="journal.images[0] || getPlaceHolderImage('旅行记忆')"
                :alt="journal.title"
                class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                loading="lazy"
              />
              <div class="absolute top-3 right-3">
                <span class="badge badge-primary">{{ journal.cityName }}</span>
              </div>
            </div>

            <!-- 标题 -->
            <h3 class="text-lg font-serif font-semibold text-text-primary mb-2 line-clamp-2">
              {{ journal.title }}
            </h3>

            <!-- 摘要 -->
            <p class="text-text-secondary text-sm mb-4 line-clamp-2">
              {{ journal.content }}
            </p>

            <!-- 作者信息 -->
            <div class="flex items-center justify-between pt-4 border-t border-warm-border">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <span class="text-primary text-sm font-medium">{{ journal.authorName[0] }}</span>
                </div>
                <span class="text-sm text-text-secondary">{{ journal.authorName }}</span>
              </div>
              <div class="flex items-center space-x-4 text-text-muted text-sm">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {{ journal.likeCount }}
                </span>
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  {{ journal.collectCount }}
                </span>
              </div>
            </div>
          </article>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && journalStore.journals.length === 0 && mockJournals.length === 0" class="text-center py-16">
          <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <svg class="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 class="text-xl font-serif font-semibold text-text-primary mb-2">暂无游记</h3>
          <p class="text-text-secondary mb-6">成为第一个分享旅行故事的人吧</p>
          <router-link to="/publish" class="btn-primary">发布游记</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
