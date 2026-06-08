<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useJournalStore } from '@/stores/journal'
import { useAuthStore } from '@/stores/auth'
import { collectJournal, cancelCollect } from '@/api/journal'
import type { Journal, Checkin } from '@/types'

const route = useRoute()
const router = useRouter()
const journalStore = useJournalStore()
const authStore = useAuthStore()

const loading = ref(true)
const journal = ref<Journal | null>(null)
const activeImageIndex = ref(0)
const showPhotoNav = ref(false)

interface ContentBlock {
  id: string
  type: 'text' | 'image'
  content: string
  imageIndex?: number
}

const contentBlocks = computed<ContentBlock[]>(() => {
  if (!journal.value) return []
  
  const paragraphs = journal.value.content.split('\n\n').filter(p => p.trim())
  const images = journal.value.images.length > 0 ? journal.value.images : [getPlaceHolderImage(0)]
  
  const blocks: ContentBlock[] = []
  const totalImages = images.length
  const totalParagraphs = paragraphs.length
  
  let imageIdx = 0
  paragraphs.forEach((paragraph, idx) => {
    blocks.push({
      id: `text-${idx}`,
      type: 'text',
      content: paragraph
    })
    
    if (imageIdx < totalImages && (idx % 2 === 1 || idx === totalParagraphs - 1)) {
      blocks.push({
        id: `image-${imageIdx}`,
        type: 'image',
        content: images[imageIdx],
        imageIndex: imageIdx
      })
      imageIdx++
    }
  })
  
  while (imageIdx < totalImages) {
    blocks.push({
      id: `image-${imageIdx}`,
      type: 'image',
      content: images[imageIdx],
      imageIndex: imageIdx
    })
    imageIdx++
  }
  
  return blocks
})

const imageBlocks = computed(() => {
  return contentBlocks.value.filter(b => b.type === 'image')
})

function getPlaceHolderImage(index: number): string {
  const colors = ['%238B7355', '%23A68B6A', '%23C0A88D', '%23D4C4B0', '%23A67C52']
  const color = colors[index % colors.length]
  const texts = ['西湖美景', '美食记忆', '城市风光', '古镇风情', '山水之间']
  const text = texts[index % texts.length]
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='${color}' stop-opacity='0.8'/%3E%3Cstop offset='100%25' stop-color='%23E8B4B8' stop-opacity='0.6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='800' height='600'/%3E%3Ctext x='400' y='300' text-anchor='middle' fill='%23ffffff' font-size='28' font-family='serif'%3E${text}%3C/text%3E%3C/svg%3E`
}

const mockImages = [getPlaceHolderImage(0), getPlaceHolderImage(1), getPlaceHolderImage(2), getPlaceHolderImage(3)]

const mockJournal: Journal = {
  id: 1,
  title: '杭州西湖：一场说走就走的旅行',
  content: `春日的西湖，恰似一幅泼墨山水画。

清晨的断桥，薄雾缭绕，仿佛穿越千年。湖面波光粼粼，倒映着雷峰塔的剪影。杨柳依依，碧波荡漾，让人不禁想起苏东坡的名句："欲把西湖比西子，淡妆浓抹总相宜。"

沿着苏堤漫步，两侧桃红柳绿，莺啼燕舞。远处的保俶塔在薄雾中若隐若现，宛如仙境。春风拂面，带来阵阵花香，让人沉醉其中。

午后，泛舟湖上，看三潭印月的美景，感受"山色空蒙雨亦奇"的诗意。船桨划过水面，泛起层层涟漪，仿佛时光都慢了下来。

傍晚时分，坐在湖边的长椅上，看夕阳西下，雷峰塔被晚霞染成金色，美得让人窒息。远处传来阵阵钟声，为这一天的旅程画上完美的句号。

这一天的西湖之旅，让我深深感受到了江南水乡的独特魅力。每一帧画面都值得珍藏，每一步脚印都充满了故事。`,
  images: mockImages,
  cityId: 3,
  cityName: '杭州市',
  authorId: 1,
  authorName: '旅行者小王',
  createTime: '2024-03-15',
  likeCount: 128,
  collectCount: 45,
  isLiked: false,
  isCollected: false,
  checkins: [
    {
      id: 1,
      userId: 1,
      cityId: 3,
      cityName: '杭州市',
      location: '断桥残雪',
      travelTime: '2024-03-15 08:30:00',
      travelMethod: 'walk',
      createTime: '2024-03-15 09:00:00'
    },
    {
      id: 2,
      userId: 1,
      cityId: 3,
      cityName: '杭州市',
      location: '苏堤春晓',
      travelTime: '2024-03-15 10:00:00',
      travelMethod: 'walk',
      createTime: '2024-03-15 10:30:00'
    },
    {
      id: 3,
      userId: 1,
      cityId: 3,
      cityName: '杭州市',
      location: '三潭印月',
      travelTime: '2024-03-15 14:00:00',
      travelMethod: 'other',
      createTime: '2024-03-15 14:30:00'
    },
    {
      id: 4,
      userId: 1,
      cityId: 3,
      cityName: '杭州市',
      location: '雷峰夕照',
      travelTime: '2024-03-15 17:30:00',
      travelMethod: 'car',
      createTime: '2024-03-15 18:00:00'
    }
  ]
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
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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

async function scrollToImage(imageIndex: number) {
  activeImageIndex.value = imageIndex
  await nextTick()
  const element = document.getElementById(`image-${imageIndex}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function togglePhotoNav() {
  showPhotoNav.value = !showPhotoNav.value
}

function handleScroll() {
  if (!showPhotoNav.value) return
  
  const imageBlocksList = imageBlocks.value
  for (let i = imageBlocksList.length - 1; i >= 0; i--) {
    const element = document.getElementById(imageBlocksList[i].id)
    if (element) {
      const rect = element.getBoundingClientRect()
      if (rect.top <= window.innerHeight / 2) {
        activeImageIndex.value = i
        break
      }
    }
  }
}

const hasCheckins = computed(() => {
  return journal.value?.checkins && journal.value.checkins.length > 0
})

const sortedCheckins = computed(() => {
  if (!journal.value?.checkins) return []
  return [...journal.value.checkins].sort(
    (a, b) => new Date(a.travelTime).getTime() - new Date(b.travelTime).getTime()
  )
})

function formatCheckinDate(time: string) {
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric'
  })
}

function formatCheckinTime(time: string) {
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const travelMethodLabels: Record<string, { label: string; icon: string }> = {
  plane: { label: '飞机', icon: '✈️' },
  train: { label: '火车', icon: '🚆' },
  car: { label: '自驾', icon: '🚗' },
  walk: { label: '步行', icon: '🚶' },
  other: { label: '其他', icon: '📍' }
}

function getTravelMethodIcon(method: string) {
  return travelMethodLabels[method]?.icon || '📍'
}

function getTravelMethodLabel(method: string) {
  return travelMethodLabels[method]?.label || method
}
</script>

<template>
  <div class="min-h-screen bg-warm-bg py-8">
    <div class="container mx-auto px-4">
      <div class="flex gap-8">
        <!-- 主内容区 -->
        <div class="flex-1 max-w-4xl">
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
              <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <span class="text-primary font-medium text-lg">{{ journal.authorName[0] }}</span>
                  </div>
                  <div>
                    <p class="font-medium text-text-primary">{{ journal.authorName }}</p>
                    <p class="text-sm text-text-muted">{{ formatDate(journal.createTime) }}</p>
                  </div>
                </div>
                <!-- 照片导航切换按钮 -->
                <button
                  @click="togglePhotoNav"
                  :class="['flex items-center gap-2 px-4 py-2 rounded-lg transition-colors lg:hidden', showPhotoNav ? 'bg-primary text-white' : 'bg-warm-bg text-text-secondary hover:bg-secondary']"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  照片导航
                </button>
              </div>

              <!-- 足迹链路概览 -->
              <div v-if="hasCheckins" class="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-5 border border-primary/10">
                <div class="flex items-center gap-2 mb-4">
                  <span class="text-xl">📍</span>
                  <h3 class="font-serif font-semibold text-text-primary">本次旅行足迹</h3>
                  <span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {{ sortedCheckins.length }} 个地点
                  </span>
                </div>
                <div class="relative">
                  <div class="absolute left-3 top-1/2 -translate-y-1/2 w-[calc(100%-1.5rem)] h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-primary/10"></div>
                  <div class="flex items-center justify-between relative">
                    <div
                      v-for="(checkin, index) in sortedCheckins.slice(0, 5)"
                      :key="checkin.id"
                      class="flex flex-col items-center"
                    >
                      <div
                        :class="[
                          'w-3 h-3 rounded-full border-2 border-white shadow-md z-10',
                          index === 0 ? 'bg-primary' : 'bg-primary/60'
                        ]"
                      ></div>
                      <div class="mt-2 text-center">
                        <p class="text-xs font-medium text-text-primary line-clamp-1 max-w-[80px]">
                          {{ checkin.location }}
                        </p>
                        <p class="text-[10px] text-text-muted mt-0.5">
                          {{ formatCheckinDate(checkin.travelTime) }}
                        </p>
                      </div>
                    </div>
                    <div v-if="sortedCheckins.length > 5" class="flex flex-col items-center">
                      <div class="w-3 h-3 rounded-full bg-primary/30 border-2 border-white shadow-md z-10"></div>
                      <div class="mt-2 text-center">
                        <p class="text-xs text-text-muted">+{{ sortedCheckins.length - 5 }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <!-- 图文混排内容 -->
            <div class="prose prose-lg max-w-none">
              <template v-for="block in contentBlocks" :key="block.id">
                <!-- 文本段落 -->
                <div
                  v-if="block.type === 'text'"
                  class="text-text-primary leading-relaxed mb-6 whitespace-pre-line"
                >
                  {{ block.content }}
                </div>
                
                <!-- 图片区块 -->
                <div
                  v-else
                  :id="block.id"
                  class="mb-8 rounded-xl overflow-hidden group"
                >
                  <img
                    :src="block.content"
                    :alt="`图片 ${(block.imageIndex || 0) + 1}`"
                    class="w-full h-auto rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <p class="text-center text-sm text-text-muted mt-2">
                    照片 {{ (block.imageIndex || 0) + 1 }} / {{ imageBlocks.length }}
                  </p>
                </div>
              </template>
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

        <!-- 侧边栏 -->
        <aside
          :class="[
            'hidden lg:block w-64 flex-shrink-0 space-y-6',
            'lg:sticky lg:top-8 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto'
          ]"
        >
          <!-- 足迹链路卡片 -->
          <div v-if="hasCheckins" class="card">
            <h3 class="font-serif font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span class="text-lg">📍</span>
              足迹链路
            </h3>
            <p class="text-xs text-text-muted mb-4">这篇游记对应的真实旅行足迹</p>
            <div class="relative">
              <div class="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/50 via-primary/30 to-primary/10"></div>
              <div class="space-y-4">
                <div
                  v-for="(checkin, index) in sortedCheckins"
                  :key="checkin.id"
                  class="relative pl-10"
                >
                  <div
                    :class="[
                      'absolute left-2 top-1 w-3 h-3 rounded-full border-2 border-white shadow-md',
                      index === 0 ? 'bg-primary' : 'bg-primary/50'
                    ]"
                  ></div>
                  <div class="bg-warm-bg rounded-lg p-3">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-base">{{ getTravelMethodIcon(checkin.travelMethod) }}</span>
                      <span class="font-medium text-text-primary text-sm">{{ checkin.location }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-text-muted">
                      <span>{{ formatCheckinDate(checkin.travelTime) }}</span>
                      <span>·</span>
                      <span>{{ getTravelMethodLabel(checkin.travelMethod) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-warm-border">
              <div class="flex items-center justify-between text-sm">
                <span class="text-text-muted">共 {{ sortedCheckins.length }} 个地点</span>
                <span class="text-primary font-medium">真实足迹</span>
              </div>
            </div>
          </div>

          <!-- 照片导航 -->
          <div class="card">
            <h3 class="font-serif font-semibold text-text-primary mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              照片导航
            </h3>
            <p class="text-xs text-text-muted mb-4">点击照片快速跳转到对应段落</p>
            <div class="space-y-3">
              <button
                v-for="(block, index) in imageBlocks"
                :key="block.id"
                @click="scrollToImage(block.imageIndex || 0)"
                :class="[
                  'w-full rounded-lg overflow-hidden transition-all',
                  'border-2',
                  activeImageIndex === block.imageIndex
                    ? 'border-primary shadow-lg scale-[1.02]'
                    : 'border-transparent hover:border-primary/50'
                ]"
              >
                <img
                  :src="block.content"
                  :alt="`照片 ${index + 1}`"
                  class="w-full h-24 object-cover"
                />
                <div class="bg-white px-2 py-1.5 text-xs text-text-secondary text-center">
                  照片 {{ index + 1 }}
                </div>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- 移动端照片导航弹窗 -->
    <Teleport to="body">
      <div
        v-if="showPhotoNav"
        class="fixed inset-0 z-50 lg:hidden"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="showPhotoNav = false"
        ></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-hidden animate-slide-up">
          <div class="sticky top-0 bg-white border-b border-warm-border px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="font-serif font-semibold text-text-primary flex items-center gap-2">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                照片导航
              </h3>
              <button
                @click="showPhotoNav = false"
                class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-warm-bg transition-colors"
              >
                <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div class="p-6 overflow-y-auto max-h-[calc(70vh-4rem)]">
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="(block, index) in imageBlocks"
                :key="block.id"
                @click="scrollToImage(block.imageIndex || 0); showPhotoNav = false;"
                :class="[
                  'rounded-lg overflow-hidden transition-all',
                  'border-2',
                  activeImageIndex === block.imageIndex
                    ? 'border-primary shadow-lg'
                    : 'border-transparent hover:border-primary/50'
                ]"
              >
                <img
                  :src="block.content"
                  :alt="`照片 ${index + 1}`"
                  class="w-full h-28 object-cover"
                />
                <div class="bg-white px-2 py-1.5 text-xs text-text-secondary text-center">
                  照片 {{ index + 1 }}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
