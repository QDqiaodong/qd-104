<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useCheckinStore } from '@/stores/checkin'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const checkinStore = useCheckinStore()

const loading = ref(true)

onMounted(async () => {
  try {
    await Promise.all([
      userStore.fetchProfile(),
      checkinStore.fetchCities()
    ])
  } finally {
    loading.value = false
  }
})

function getCityName(cityId: number) {
  return checkinStore.cities.find(c => c.id === cityId)?.name || '未知'
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
    </div>
  </div>
</template>
