<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useJournalStore } from '@/stores/journal'
import { useAuthStore } from '@/stores/auth'
import { collectJournal, cancelCollect } from '@/api/journal'
import type { Journal } from '@/types'

const route = useRoute()
const router = useRouter()
const journalStore = useJournalStore()
const authStore = useAuthStore()

const loading = ref(true)
const journal = ref<Journal | null>(null)

// 本地SVG占位图
function getPlaceHolderImage(index: number): string {
  const colors = ['%238B7355', '%23A68B6A', '%23C0A88D']
  const color = colors[index % colors.length]
  const texts = ['西湖美景', '美食记忆', '城市风光']
  const text = texts[index % texts.length]
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='${color}' stop-opacity='0.8'/%3E%3Cstop offset='100%25' stop-color='%23E8B4B8' stop-opacity='0.6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='800' height='600'/%3E%3Ctext x='400' y='300' text-anchor='middle' fill='%23ffffff' font-size='28' font-family='serif'%3E${text}%3C/text%3E%3C/svg%3E`
}

// 模拟数据
const mockJournal: Journal = {
  id: 1,
  title: '杭州西湖：一场说走就走的旅行',
  content: `春日的西湖，恰似一幅泼墨山水画。

清晨的断桥，薄雾缭绕，仿佛穿越千年。湖面波光粼粼，倒映着雷峰塔的剪影。杨柳依依，碧波荡漾，让人不禁想起苏东坡的名句："欲把西湖比西子，淡妆浓抹总相宜。"

沿着苏堤漫步，两侧桃红柳绿，莺啼燕舞。远处的保俶塔在薄雾中若隐若现，宛如仙境。

午后，泛舟湖上，看三潭印月的美景，感受"山色空蒙雨亦奇"的诗意。

傍晚时分，坐在湖边的长椅上，看夕阳西下，雷峰塔被晚霞染成金色，美得让人窒息。

这一天的西湖之旅，让我深深感受到了江南水乡的独特魅力。`,
  images: [getPlaceHolderImage(0), getPlaceHolderImage(1), getPlaceHolderImage(2)],
  cityId: 3,
  cityName: '杭州市',
  authorId: 1,
  authorName: '旅行者小王',
  createTime: '2024-03-15',
  likeCount: 128,
  collectCount: 45,
  isLiked: false,
  isCollected: false
}

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    const response = await journalStore.fetchJournalDetail(id)
    journal.value = response
  } catch {
    journal.value = mockJournal
  } finally {
    loading.value = false
  }
})

function goBack() {
  router.back()
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function handleLike() {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (journal.value) {
    journal.value.isLiked = !journal.value.isLiked
    journal.value.likeCount += journal.value.isLiked ? 1 : -1
  }
}

async function handleCollect() {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (journal.value) {
    try {
      if (journal.value.isCollected) {
        await cancelCollect(journal.value.id)
      } else {
        await collectJournal(journal.value.id)
      }
      journal.value.isCollected = !journal.value.isCollected
      journal.value.collectCount += journal.value.isCollected ? 1 : -1
    } catch (e) {
      console.error('收藏操作失败', e)
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-warm-bg py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <!-- 返回按钮 -->
      <button
        @click="goBack"
        class="flex items-center text-text-secondary hover:text-primary transition-colors mb-8"
      >
        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      <!-- 加载状态 -->
      <div v-if="loading" class="card animate-pulse">
        <div class="h-8 bg-secondary rounded w-3/4 mb-4"></div>
        <div class="h-4 bg-secondary rounded w-1/4 mb-8"></div>
        <div class="h-96 bg-secondary rounded-xl mb-6"></div>
        <div class="space-y-3">
          <div class="h-4 bg-secondary rounded w-full"></div>
          <div class="h-4 bg-secondary rounded w-full"></div>
          <div class="h-4 bg-secondary rounded w-3/4"></div>
        </div>
      </div>

      <!-- 游记内容 -->
      <article v-else-if="journal" class="card">
        <!-- 头部信息 -->
        <header class="mb-8">
          <span class="badge badge-primary mb-4">{{ journal.cityName }}</span>
          <h1 class="text-3xl md:text-4xl font-serif font-bold text-text-primary mb-6">
            {{ journal.title }}
          </h1>
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <span class="text-primary font-medium text-lg">{{ journal.authorName[0] }}</span>
              </div>
              <div>
                <p class="font-medium text-text-primary">{{ journal.authorName }}</p>
                <p class="text-sm text-text-muted">{{ formatDate(journal.createTime) }}</p>
              </div>
            </div>
          </div>
        </header>

        <!-- 图片画廊 -->
        <div class="grid gap-4 mb-8">
          <img
            v-for="(image, index) in (journal.images.length > 0 ? journal.images : [getPlaceHolderImage(0)])"
            :key="index"
            :src="image"
            :alt="`图片 ${index + 1}`"
            class="w-full rounded-xl object-cover"
            :class="index === 0 ? 'h-[400px]' : 'h-64'"
            loading="lazy"
          />
        </div>

        <!-- 正文内容 -->
        <div class="prose prose-lg max-w-none">
          <div
            v-for="(paragraph, index) in journal.content.split('\n\n')"
            :key="index"
            class="text-text-primary leading-relaxed mb-6 whitespace-pre-line"
          >
            {{ paragraph }}
          </div>
        </div>

        <!-- 底部操作 -->
        <footer class="mt-12 pt-8 border-t border-warm-border">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-6">
              <button
                @click="handleLike"
                :class="['flex items-center space-x-2 transition-colors', journal.isLiked ? 'text-red-500' : 'text-text-secondary hover:text-red-500']"
              >
                <svg class="w-6 h-6" :fill="journal.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{{ journal.likeCount }}</span>
              </button>
              <button
                @click="handleCollect"
                :class="['flex items-center space-x-2 transition-colors', journal.isCollected ? 'text-accent' : 'text-text-secondary hover:text-accent']"
              >
                <svg class="w-6 h-6" :fill="journal.isCollected ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>{{ journal.collectCount }}</span>
              </button>
            </div>
          </div>
        </footer>
      </article>

      <!-- 底部推荐 -->
      <section class="mt-12">
        <h2 class="section-title">更多精彩游记</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <router-link
            v-for="i in 3"
            :key="i"
            to="/"
            class="card card-hover"
          >
            <div class="h-32 bg-secondary rounded-xl mb-3 image-loading"></div>
            <h3 class="font-medium text-text-primary line-clamp-2">探索更多旅行故事...</h3>
          </router-link>
        </div>
      </section>
    </div>
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
