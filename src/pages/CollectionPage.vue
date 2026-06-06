<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCollectionStore } from '@/stores/collection'
import { cancelCollect } from '@/api/journal'
import type { Journal } from '@/types'
import { PERSPECTIVES, matchPerspective, type PerspectiveId, type Perspective } from '@/utils/travelPerspective'

const router = useRouter()
const collectionStore = useCollectionStore()

const loading = ref(true)
const activePerspective = ref<PerspectiveId>('all')
const flippedCards = ref<Set<number>>(new Set())

function getPlaceHolderImage(): string {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23D4C4B0" width="400" height="300"/%3E%3Ctext x="200" y="160" text-anchor="middle" fill="%238B7355" font-size="18"%3E暂无图片%3C/text%3E%3C/svg%3E'
}

onMounted(async () => {
  try {
    await collectionStore.fetchCollections()
  } finally {
    loading.value = false
  }
})

const filteredJournals = computed(() => {
  if (activePerspective.value === 'all') {
    return collectionStore.journals
  }
  return collectionStore.journals.filter(journal => {
    const perspectives = matchPerspective(journal.title, journal.content)
    return perspectives.includes(activePerspective.value)
  })
})

const perspectiveCounts = computed(() => {
  const counts: Record<string, number> = { all: collectionStore.journals.length }
  for (const p of PERSPECTIVES) {
    if (p.id === 'all') continue
    counts[p.id] = collectionStore.journals.filter(j => {
      const perspectives = matchPerspective(j.title, j.content)
      return perspectives.includes(p.id)
    }).length
  }
  return counts
})

function goToJournalDetail(journal: Journal) {
  router.push(`/journal/${journal.id}`)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

async function handleRemoveCollection(journal: Journal, event: Event) {
  event.stopPropagation()
  try {
    await cancelCollect(journal.id)
    await collectionStore.refresh()
  } catch (e) {
    console.error('取消收藏失败', e)
  }
}

function selectPerspective(perspectiveId: PerspectiveId) {
  activePerspective.value = perspectiveId
}

function toggleCardFlip(journalId: number, event: Event) {
  event.stopPropagation()
  if (flippedCards.value.has(journalId)) {
    flippedCards.value.delete(journalId)
  } else {
    flippedCards.value.add(journalId)
  }
}

function isFlipped(journalId: number): boolean {
  return flippedCards.value.has(journalId)
}

function getJournalPerspective(journal: Journal): Perspective | null {
  const primary = matchPerspective(journal.title, journal.content)
  if (primary.length === 0) return null
  return PERSPECTIVES.find(p => p.id === primary[0]) || null
}
</script>

<template>
  <div class="min-h-screen bg-warm-bg py-8">
    <div class="container mx-auto px-4 max-w-5xl">
      <div class="mb-8">
        <h1 class="text-3xl font-serif font-bold text-text-primary mb-2">我的收藏</h1>
        <p class="text-text-secondary">翻找灵感，像打开私人攻略抽屉</p>
      </div>

      <!-- 视角切换抽屉 -->
      <div class="mb-8">
        <div class="relative">
          <div class="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 rounded-full"></div>
          
          <div class="flex flex-wrap gap-3 pl-4">
            <button
              v-for="perspective in PERSPECTIVES"
              :key="perspective.id"
              @click="selectPerspective(perspective.id)"
              class="group relative flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-300"
              :class="[
                activePerspective === perspective.id 
                  ? 'bg-white shadow-card scale-105 ring-2 ring-primary/30' 
                  : 'bg-warm-card/60 hover:bg-white hover:shadow-soft'
              ]"
            >
              <span class="text-xl transition-transform duration-300 group-hover:scale-110">
                {{ perspective.icon }}
              </span>
              <span 
                class="font-medium text-sm"
                :class="activePerspective === perspective.id ? 'text-primary' : 'text-text-secondary'"
              >
                {{ perspective.name }}
              </span>
              <span 
                class="text-xs px-2 py-0.5 rounded-full"
                :class="[
                  activePerspective === perspective.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-secondary/50 text-text-muted'
                ]"
              >
                {{ perspectiveCounts[perspective.id] || 0 }}
              </span>
            </button>
          </div>
        </div>

        <div 
          v-if="activePerspective !== 'all'" 
          class="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-primary/30"
        >
          <div class="flex items-center space-x-3">
            <span class="text-3xl">{{ PERSPECTIVES.find(p => p.id === activePerspective)?.icon }}</span>
            <div>
              <h3 class="font-serif font-semibold text-text-primary">
                {{ PERSPECTIVES.find(p => p.id === activePerspective)?.name }}灵感
              </h3>
              <p class="text-sm text-text-secondary">
                {{ PERSPECTIVES.find(p => p.id === activePerspective)?.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="card animate-pulse">
          <div class="h-48 bg-secondary rounded-xl mb-4"></div>
          <div class="h-6 bg-secondary rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-secondary rounded w-1/2"></div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="collectionStore.journals.length === 0" class="card text-center py-16">
        <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
          <svg class="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h3 class="text-xl font-serif font-semibold text-text-primary mb-2">暂无收藏</h3>
        <p class="text-text-secondary mb-6">去发现页逛逛，收藏喜欢的游记吧</p>
        <router-link to="/" class="btn-primary">发现游记</router-link>
      </div>

      <!-- 该视角下无内容 -->
      <div v-else-if="filteredJournals.length === 0" class="card text-center py-16 bg-gradient-to-br from-warm-card to-secondary/20">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-serif font-semibold text-text-primary mb-2">
          这个抽屉里还空空的
        </h3>
        <p class="text-text-secondary mb-6">
          去「全部」里看看，或者多收藏一些「{{ PERSPECTIVES.find(p => p.id === activePerspective)?.name }}」相关的游记吧
        </p>
        <button @click="selectPerspective('all')" class="btn-secondary">
          查看全部收藏
        </button>
      </div>

      <!-- 收藏卡片网格 - 灵感抽屉风格 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(journal, index) in filteredJournals"
          :key="journal.id"
          class="perspective-card animate-fade-in cursor-pointer"
          :class="`stagger-${(index % 5) + 1}`"
          @click="goToJournalDetail(journal)"
        >
          <div 
            class="card-inner"
            :class="{ 'is-flipped': isFlipped(journal.id) }"
          >
            <!-- 正面 -->
            <div class="card-front bg-warm-card rounded-2xl shadow-soft overflow-hidden border border-warm-border/50 transition-all duration-300 hover:shadow-card hover:-translate-y-1">
              <div class="relative h-48 overflow-hidden">
                <img
                  :src="journal.images[0] || getPlaceHolderImage()"
                  :alt="journal.title"
                  class="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  loading="lazy"
                />
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                
                <div class="absolute top-3 left-3 flex flex-wrap gap-2">
                  <span class="badge badge-primary text-xs">
                    {{ journal.cityName }}
                  </span>
                  <span 
                    v-if="getJournalPerspective(journal)" 
                    class="badge text-xs"
                    :class="[getJournalPerspective(journal)?.bgColor, getJournalPerspective(journal)?.color]"
                  >
                    {{ getJournalPerspective(journal)?.icon }} {{ getJournalPerspective(journal)?.name }}
                  </span>
                </div>

                <div class="absolute top-3 right-3 flex space-x-2">
                  <button
                    @click="toggleCardFlip(journal.id, $event)"
                    class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all hover:scale-110"
                    title="翻转查看"
                  >
                    <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    @click="handleRemoveCollection(journal, $event)"
                    class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all hover:scale-110"
                    title="取消收藏"
                  >
                    <svg class="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>

                <div class="absolute bottom-3 left-3 right-3">
                  <h3 class="text-lg font-serif font-semibold text-white line-clamp-2 drop-shadow-lg">
                    {{ journal.title }}
                  </h3>
                </div>
              </div>

              <div class="p-4">
                <p class="text-text-secondary text-sm mb-4 line-clamp-2">
                  {{ journal.content }}
                </p>

                <div class="flex items-center justify-between pt-3 border-t border-warm-border">
                  <div class="flex items-center space-x-2">
                    <div class="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                      <span class="text-primary text-xs font-medium">{{ journal.authorName[0] }}</span>
                    </div>
                    <span class="text-sm text-text-secondary">{{ journal.authorName }}</span>
                  </div>
                  <span class="text-xs text-text-muted">{{ formatDate(journal.createTime) }}</span>
                </div>
              </div>
            </div>

            <!-- 背面 -->
            <div class="card-back absolute inset-0 bg-gradient-to-br from-primary-50 to-accent-light rounded-2xl shadow-card overflow-hidden border border-primary/20 p-5 flex flex-col">
              <div class="text-center mb-4">
                <span class="text-4xl">{{ getJournalPerspective(journal)?.icon || '📖' }}</span>
              </div>
              
              <h3 class="text-lg font-serif font-bold text-text-primary text-center mb-3 line-clamp-2">
                {{ journal.title }}
              </h3>

              <div class="flex-1 overflow-hidden">
                <p class="text-sm text-text-secondary line-clamp-6 leading-relaxed">
                  {{ journal.content }}
                </p>
              </div>

              <div class="mt-4 pt-4 border-t border-primary/10">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-text-muted">📍 {{ journal.cityName }}</span>
                  <span class="text-text-muted">❤️ {{ journal.likeCount }}</span>
                </div>
              </div>

              <div class="mt-3 text-center">
                <span class="text-xs text-text-muted">点击卡片查看详情</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部提示 -->
      <div v-if="filteredJournals.length > 0 && !loading" class="mt-10 text-center">
        <div class="inline-flex items-center space-x-2 text-text-muted text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>点击卡片左上角翻转按钮，查看更多内容</span>
        </div>
      </div>
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

.line-clamp-6 {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.perspective-card {
  perspective: 1000px;
  height: 100%;
  min-height: 380px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 380px;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.card-inner.is-flipped {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
</style>
