<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWishlistStore } from '@/stores/wishlist'
import { useCheckinStore } from '@/stores/checkin'
import CitySearchSelect from '@/components/CitySearchSelect.vue'
import type { WishlistItem, WishlistRequest } from '@/types'

const wishlistStore = useWishlistStore()
const checkinStore = useCheckinStore()

const loading = ref(true)
const showForm = ref(false)
const editingItem = ref<WishlistItem | null>(null)

const selectedCityId = ref<number | undefined>()
const expectedSeason = ref('')
const reason = ref('')
const experience = ref('')
const submitting = ref(false)

const seasons = [
  { value: 'spring', label: '春季', icon: '🌸' },
  { value: 'summer', label: '夏季', icon: '☀️' },
  { value: 'autumn', label: '秋季', icon: '🍂' },
  { value: 'winter', label: '冬季', icon: '❄️' },
  { value: 'any', label: '四季皆宜', icon: '🌈' }
]

const isEditing = computed(() => editingItem.value !== null)

const formTitle = computed(() => isEditing.value ? '编辑愿望' : '添加愿望城市')

function getSeasonLabel(season?: string) {
  if (!season) return '未设定'
  const s = seasons.find(s => s.value === season)
  return s ? s.label : '未设定'
}

function getSeasonIcon(season?: string) {
  if (!season) return '✨'
  const s = seasons.find(s => s.value === season)
  return s ? s.icon : '✨'
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function openForm() {
  showForm.value = true
  editingItem.value = null
  selectedCityId.value = undefined
  expectedSeason.value = ''
  reason.value = ''
  experience.value = ''
}

function openEditForm(item: WishlistItem) {
  showForm.value = true
  editingItem.value = item
  selectedCityId.value = item.cityId
  expectedSeason.value = item.expectedSeason || ''
  reason.value = item.reason || ''
  experience.value = item.experience || ''
}

function closeForm() {
  showForm.value = false
  editingItem.value = null
}

async function handleSubmit() {
  if (!selectedCityId.value) {
    return
  }

  submitting.value = true

  try {
    const data: WishlistRequest = {
      cityId: selectedCityId.value,
      expectedSeason: expectedSeason.value || undefined,
      reason: reason.value || undefined,
      experience: experience.value || undefined
    }

    if (isEditing.value && editingItem.value) {
      await wishlistStore.updateWishlist(editingItem.value.id, data)
    } else {
      await wishlistStore.addWishlist(data)
    }
    closeForm()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  if (!confirm('确定要删除这个愿望吗？')) {
    return
  }
  await wishlistStore.removeWishlist(id)
}

onMounted(async () => {
  try {
    await Promise.all([
      checkinStore.fetchCities(),
      wishlistStore.fetchWishlist()
    ])
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-warm-bg py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-serif font-bold text-text-primary">
            旅行愿望单
          </h1>
          <p class="text-text-secondary mt-1">
            记录你想去的城市，规划未来的旅行
          </p>
        </div>
        <button @click="openForm" class="btn-primary">
          添加愿望
        </button>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card text-center">
          <div class="text-3xl font-bold text-primary mb-1">
            {{ wishlistStore.wishlist.length }}
          </div>
          <div class="text-sm text-text-secondary">愿望城市</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-accent mb-1">
            {{ wishlistStore.wishlist.filter(w => w.expectedSeason === 'spring').length }}
          </div>
          <div class="text-sm text-text-secondary">春天想去</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-amber-500 mb-1">
            {{ wishlistStore.wishlist.filter(w => w.expectedSeason === 'summer').length }}
          </div>
          <div class="text-sm text-text-secondary">夏天想去</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-sky-500 mb-1">
            {{ wishlistStore.wishlist.filter(w => w.reason || w.experience).length }}
          </div>
          <div class="text-sm text-text-secondary">有详细计划</div>
        </div>
      </div>

      <!-- 愿望单列表 -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="card animate-pulse">
          <div class="flex items-start space-x-4">
            <div class="w-16 h-16 bg-secondary rounded-xl"></div>
            <div class="flex-1">
              <div class="h-5 bg-secondary rounded w-1/3 mb-2"></div>
              <div class="h-4 bg-secondary rounded w-1/2 mb-2"></div>
              <div class="h-4 bg-secondary rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="wishlistStore.wishlist.length === 0" class="card text-center py-16">
        <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center">
          <span class="text-5xl">🌟</span>
        </div>
        <h3 class="text-xl font-serif font-medium text-text-primary mb-3">愿望单还是空的</h3>
        <p class="text-text-secondary mb-8 max-w-md mx-auto">
          每一个想去的城市都是一颗星星，把它们收集起来，
          总有一天会变成你脚下的路
        </p>
        <button @click="openForm" class="btn-primary px-8">
          添加第一个愿望
        </button>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="(item, index) in wishlistStore.wishlist"
          :key="item.id"
          class="card card-hover overflow-hidden animate-fade-in"
          :class="`stagger-${(index % 5) + 1}`"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start space-x-4 flex-1">
              <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center flex-shrink-0 shadow-md">
                <span class="text-2xl">{{ getSeasonIcon(item.expectedSeason) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                  <h3 class="text-lg font-bold text-text-primary">
                    {{ item.cityName }}
                  </h3>
                  <span class="badge bg-secondary text-text-secondary">
                    {{ item.cityProvince }}
                  </span>
                  <span class="badge bg-amber-50 text-amber-600">
                    {{ getSeasonIcon(item.expectedSeason) }} {{ getSeasonLabel(item.expectedSeason) }}
                  </span>
                </div>

                <div v-if="item.cityDescription" class="text-sm text-text-secondary mb-3 line-clamp-1">
                  {{ item.cityDescription }}
                </div>

                <div v-if="item.reason" class="mb-3">
                  <div class="text-xs text-text-muted mb-1 flex items-center space-x-1">
                    <span>💭</span>
                    <span>出发理由</span>
                  </div>
                  <p class="text-sm text-text-primary bg-secondary/50 rounded-lg px-3 py-2">
                    {{ item.reason }}
                  </p>
                </div>

                <div v-if="item.experience">
                  <div class="text-xs text-text-muted mb-1 flex items-center space-x-1">
                    <span>🎯</span>
                    <span>想体验的内容</span>
                  </div>
                  <p class="text-sm text-text-primary bg-primary-50/50 rounded-lg px-3 py-2">
                    {{ item.experience }}
                  </p>
                </div>

                <div class="text-xs text-text-muted mt-3">
                  添加于 {{ formatDate(item.createTime) }}
                </div>
              </div>
            </div>

            <div class="flex flex-col space-y-2 ml-4">
              <button
                @click="openEditForm(item)"
                class="text-sm text-text-secondary hover:text-primary transition-colors"
              >
                ✏️ 编辑
              </button>
              <button
                @click="handleDelete(item.id)"
                class="text-sm text-text-secondary hover:text-rose-500 transition-colors"
              >
                🗑️ 删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加/编辑表单弹窗 -->
      <transition name="fade">
        <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 class="text-xl font-serif font-semibold text-text-primary mb-6">
              {{ formTitle }}
            </h2>

            <form @submit.prevent="handleSubmit" class="space-y-5">
              <!-- 城市选择 -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">选择城市 *</label>
                <CitySearchSelect v-model="selectedCityId" placeholder="输入城市名或别名搜索" />
              </div>

              <!-- 期待季节 -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">期待季节</label>
                <div class="grid grid-cols-5 gap-2">
                  <button
                    v-for="season in seasons"
                    :key="season.value"
                    type="button"
                    @click="expectedSeason = expectedSeason === season.value ? '' : season.value"
                    :class="[
                      'p-3 rounded-xl border-2 text-center transition-all',
                      expectedSeason === season.value
                        ? 'border-primary bg-primary-50'
                        : 'border-warm-border hover:border-primary-300'
                    ]"
                  >
                    <div class="text-xl mb-1">{{ season.icon }}</div>
                    <div class="text-xs text-text-secondary">{{ season.label }}</div>
                  </button>
                </div>
              </div>

              <!-- 出发理由 -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">出发理由</label>
                <textarea
                  v-model="reason"
                  rows="3"
                  placeholder="为什么想去这座城市？是因为某个人、某部电影，还是某张照片？"
                  class="input-field resize-none"
                ></textarea>
              </div>

              <!-- 想体验的内容 -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">想体验的内容</label>
                <textarea
                  v-model="experience"
                  rows="3"
                  placeholder="在这座城市想做什么？吃什么？看什么风景？"
                  class="input-field resize-none"
                ></textarea>
              </div>

              <!-- 按钮 -->
              <div class="flex justify-end space-x-3 pt-4">
                <button type="button" @click="closeForm" class="btn-secondary">
                  取消
                </button>
                <button type="submit" class="btn-primary" :disabled="submitting || !selectedCityId">
                  {{ submitting ? '保存中...' : (isEditing ? '保存修改' : '添加愿望') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
