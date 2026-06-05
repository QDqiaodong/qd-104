<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCollectionStore } from '@/stores/collection'
import { cancelCollect } from '@/api/journal'
import type { Journal } from '@/types'

const router = useRouter()
const collectionStore = useCollectionStore()

const loading = ref(true)

// 本地SVG占位图
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
</script>

<template>
  <div class="min-h-screen bg-warm-bg py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <h1 class="text-3xl font-serif font-bold text-text-primary mb-8">我的收藏</h1>

      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="i in 4" :key="i" class="card animate-pulse">
          <div class="h-40 bg-secondary rounded-xl mb-4"></div>
          <div class="h-6 bg-secondary rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-secondary rounded w-1/2"></div>
        </div>
      </div>

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

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article
          v-for="(journal, index) in collectionStore.journals"
          :key="journal.id"
          class="card card-hover cursor-pointer animate-fade-in"
          :class="`stagger-${(index % 5) + 1}`"
          @click="goToJournalDetail(journal)"
        >
          <div class="relative h-40 rounded-xl overflow-hidden mb-4">
            <img
              :src="journal.images[0] || getPlaceHolderImage()"
              :alt="journal.title"
              class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              loading="lazy"
            />
            <div class="absolute top-3 right-3">
              <button
                @click="handleRemoveCollection(journal, $event)"
                class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              >
                <svg class="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
            <div class="absolute top-3 left-3">
              <span class="badge badge-primary">{{ journal.cityName }}</span>
            </div>
          </div>

          <h3 class="text-lg font-serif font-semibold text-text-primary mb-2 line-clamp-2">
            {{ journal.title }}
          </h3>

          <p class="text-text-secondary text-sm mb-4 line-clamp-2">
            {{ journal.content }}
          </p>

          <div class="flex items-center justify-between pt-4 border-t border-warm-border">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span class="text-primary text-sm font-medium">{{ journal.authorName[0] }}</span>
              </div>
              <span class="text-sm text-text-secondary">{{ journal.authorName }}</span>
            </div>
            <span class="text-sm text-text-muted">{{ formatDate(journal.createTime) }}</span>
          </div>
        </article>
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
</style>
