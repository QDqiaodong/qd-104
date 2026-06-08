<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useJournalStore } from '@/stores/journal'
import { useCheckinStore } from '@/stores/checkin'
import CitySearchSelect from '@/components/CitySearchSelect.vue'
import imageCompression from 'browser-image-compression'
import type { CollageStyle, CollageStyleConfig, Checkin } from '@/types'

const router = useRouter()
const journalStore = useJournalStore()
const checkinStore = useCheckinStore()

const title = ref('')
const content = ref('')
const selectedCityId = ref<number | undefined>()
const images = ref<string[]>([])
const uploading = ref(false)
const loading = ref(false)
const error = ref('')
const selectedCheckinIds = ref<number[]>([])
const showCheckinPicker = ref(false)
const loadingCheckins = ref(false)

const showCollagePreview = ref(false)
const selectedCollageStyle = ref<CollageStyle>('postcard')
const collageTitle = ref('')
const collageSubtitle = ref('')
const collageDate = ref(new Date().toLocaleDateString('zh-CN'))
const collageLocation = ref('')

const collageStyles: CollageStyleConfig[] = [
  {
    id: 'postcard',
    name: '明信片',
    description: '经典明信片风格，温馨怀旧',
    icon: '🪧',
    minImages: 1,
    maxImages: 4
  },
  {
    id: 'filmstrip',
    name: '胶片条',
    description: '复古胶片质感，文艺气息',
    icon: '🎞️',
    minImages: 2,
    maxImages: 6
  },
  {
    id: 'ticket',
    name: '车票式',
    description: '创意车票设计，旅途纪念',
    icon: '🎫',
    minImages: 1,
    maxImages: 3
  },
  {
    id: 'polaroid',
    name: '拍立得',
    description: '宝丽来风格，即时回忆',
    icon: '📸',
    minImages: 1,
    maxImages: 4
  },
  {
    id: 'mosaic',
    name: '拼图',
    description: '多图拼贴，丰富层次',
    icon: '🧩',
    minImages: 2,
    maxImages: 9
  }
]

const availableImagesForCollage = computed(() => {
  const style = collageStyles.find(s => s.id === selectedCollageStyle.value)
  return style ? images.value.slice(0, style.maxImages) : []
})

const canUseCollageStyle = computed(() => {
  return (style: CollageStyleConfig) => {
    return images.value.length >= style.minImages && images.value.length <= style.maxImages
  }
})

const getSelectedStyleConfig = computed(() => {
  return collageStyles.find(s => s.id === selectedCollageStyle.value)
})

const cityName = computed(() => {
  if (!selectedCityId.value) return ''
  const city = checkinStore.cities.find(c => c.id === selectedCityId.value)
  return city?.name || ''
})

watch([title, cityName], ([newTitle, newCity]) => {
  if (!collageTitle.value && newTitle) {
    collageTitle.value = newTitle
  }
  if (!collageLocation.value && newCity) {
    collageLocation.value = newCity
  }
})

const availableCheckins = computed(() => {
  if (!selectedCityId.value) return []
  return checkinStore.checkins.filter(c => c.cityId === selectedCityId.value)
})

const selectedCheckins = computed(() => {
  return checkinStore.checkins.filter(c => selectedCheckinIds.value.includes(c.id))
})

const sortedCheckinsByCity = computed(() => {
  const cityMap = new Map<number, { cityId: number; cityName: string; checkins: Checkin[] }>()
  for (const checkin of checkinStore.checkins) {
    if (!cityMap.has(checkin.cityId)) {
      cityMap.set(checkin.cityId, {
        cityId: checkin.cityId,
        cityName: checkin.cityName,
        checkins: []
      })
    }
    cityMap.get(checkin.cityId)!.checkins.push(checkin)
  }
  return Array.from(cityMap.values()).sort((a, b) => b.checkins.length - a.checkins.length)
})

function toggleCheckin(checkinId: number) {
  const index = selectedCheckinIds.value.indexOf(checkinId)
  if (index > -1) {
    selectedCheckinIds.value.splice(index, 1)
  } else {
    selectedCheckinIds.value.push(checkinId)
  }
}

function isCheckinSelected(checkinId: number) {
  return selectedCheckinIds.value.includes(checkinId)
}

function formatTravelTime(time: string) {
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const travelMethodLabels: Record<string, { label: string; icon: string }> = {
  plane: { label: '飞机', icon: '✈️' },
  train: { label: '火车', icon: '🚆' },
  car: { label: '自驾', icon: '🚗' },
  walk: { label: '步行', icon: '🚶' },
  other: { label: '其他', icon: '📍' }
}

function getTravelMethodLabel(method: string) {
  return travelMethodLabels[method]?.label || method
}

function getTravelMethodIcon(method: string) {
  return travelMethodLabels[method]?.icon || '📍'
}

async function openCheckinPicker() {
  if (checkinStore.checkins.length === 0) {
    loadingCheckins.value = true
    try {
      await checkinStore.fetchCheckins()
    } finally {
      loadingCheckins.value = false
    }
  }
  showCheckinPicker.value = true
}

function closeCheckinPicker() {
  showCheckinPicker.value = false
}

onMounted(async () => {
  await checkinStore.fetchCities()
})

async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) return

  uploading.value = true

  try {
    for (const file of Array.from(files)) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      }
      const compressedFile = await imageCompression(file, options)

      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(compressedFile)
      })

      images.value.push(base64)
    }
  } catch (e) {
    console.error('图片上传失败', e)
  } finally {
    uploading.value = false
    target.value = ''
  }
}

function removeImage(index: number) {
  images.value.splice(index, 1)
}

function toggleCollagePreview() {
  if (images.value.length === 0) {
    return
  }
  showCollagePreview.value = !showCollagePreview.value
  if (showCollagePreview.value) {
    const availableStyle = collageStyles.find(s => canUseCollageStyle.value(s))
    if (availableStyle && !canUseCollageStyle.value(getSelectedStyleConfig.value!)) {
      selectedCollageStyle.value = availableStyle.id
    }
  }
}

async function handleSubmit() {
  if (!title.value.trim()) {
    error.value = '请输入标题'
    return
  }

  if (!content.value.trim()) {
    error.value = '请输入游记内容'
    return
  }

  if (!selectedCityId.value) {
    error.value = '请选择城市'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await journalStore.createJournal({
      title: title.value,
      content: content.value,
      images: images.value,
      cityId: selectedCityId.value,
      checkinIds: selectedCheckinIds.value.length > 0 ? selectedCheckinIds.value : undefined
    })
    router.push('/')
  } catch (e) {
    error.value = '发布失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-warm-bg py-8">
    <div class="container mx-auto px-4 max-w-5xl">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-serif font-bold text-text-primary">发布游记</h1>
        <button
          v-if="images.length > 0"
          @click="toggleCollagePreview"
          :class="[
            'px-5 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2',
            showCollagePreview
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'bg-white text-primary border-2 border-primary hover:bg-primary-50'
          ]"
        >
          <span class="text-xl">🎨</span>
          <span>{{ showCollagePreview ? '返回编辑' : '封面预览' }}</span>
        </button>
      </div>

      <!-- 拼贴预览模式 -->
      <div v-if="showCollagePreview" class="space-y-6">
        <div class="card">
          <h2 class="text-xl font-serif font-semibold text-text-primary mb-4 flex items-center space-x-2">
            <span>✨</span>
            <span>选择封面风格</span>
          </h2>
          <p class="text-text-secondary text-sm mb-6">选择一种风格，提前感受游记发布后的首屏气质</p>
          
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              v-for="style in collageStyles"
              :key="style.id"
              @click="selectedCollageStyle = style.id"
              :disabled="!canUseCollageStyle(style)"
              :class="[
                'p-4 rounded-xl border-2 transition-all duration-300 text-left',
                selectedCollageStyle === style.id
                  ? 'border-primary bg-primary-50 shadow-md'
                  : canUseCollageStyle(style)
                    ? 'border-warm-border hover:border-primary-300 hover:bg-primary-50/30'
                    : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              ]"
            >
              <div class="text-3xl mb-2">{{ style.icon }}</div>
              <div class="font-medium text-text-primary">{{ style.name }}</div>
              <div class="text-xs text-text-muted mt-1">
                {{ canUseCollageStyle(style) ? style.description : `需 ${style.minImages}-${style.maxImages} 张图片` }}
              </div>
            </button>
          </div>
        </div>

        <!-- 拼贴配置 -->
        <div class="card">
          <h2 class="text-xl font-serif font-semibold text-text-primary mb-4 flex items-center space-x-2">
            <span>✏️</span>
            <span>封面文字</span>
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">主标题</label>
              <input
                v-model="collageTitle"
                type="text"
                placeholder="例如：夏日奇遇"
                class="input-field"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">副标题</label>
              <input
                v-model="collageSubtitle"
                type="text"
                placeholder="例如：一段难忘的旅程"
                class="input-field"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">日期</label>
              <input
                v-model="collageDate"
                type="text"
                class="input-field"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text-primary mb-2">地点</label>
              <input
                v-model="collageLocation"
                type="text"
                placeholder="例如：杭州·西湖"
                class="input-field"
              />
            </div>
          </div>
        </div>

        <!-- 拼贴预览展示 -->
        <div class="card">
          <h2 class="text-xl font-serif font-semibold text-text-primary mb-6 flex items-center space-x-2">
            <span>👁️</span>
            <span>封面预览</span>
            <span class="text-sm font-normal text-text-muted ml-2">- {{ getSelectedStyleConfig?.name }}风格</span>
          </h2>
          
          <div class="flex justify-center">
            <!-- 明信片风格 -->
            <div v-if="selectedCollageStyle === 'postcard'" class="relative">
              <div class="w-96 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-2xl overflow-hidden border-4 border-white">
                <div class="p-4">
                  <div class="grid grid-cols-2 gap-2 mb-4">
                    <div 
                      v-for="(image, index) in availableImagesForCollage.slice(0, 4)" 
                      :key="index"
                      class="aspect-square rounded-lg overflow-hidden shadow-inner"
                    >
                      <img :src="image" class="w-full h-full object-cover" />
                    </div>
                    <div 
                      v-for="i in Math.max(0, 4 - availableImagesForCollage.length)" 
                      :key="'empty-' + i"
                      class="aspect-square rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                    >
                      <span class="text-4xl text-gray-300">🖼️</span>
                    </div>
                  </div>
                  
                  <div class="border-t-2 border-dashed border-amber-200 pt-4">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <h3 class="text-2xl font-serif font-bold text-text-primary">{{ collageTitle || '我的旅行' }}</h3>
                        <p class="text-text-secondary mt-1">{{ collageSubtitle }}</p>
                      </div>
                      <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg ml-4">
                        <span class="text-2xl">📮</span>
                      </div>
                    </div>
                    <div class="flex items-center justify-between mt-4 text-sm text-text-muted">
                      <span class="flex items-center space-x-1">
                        <span>📍</span>
                        <span>{{ collageLocation || '未知地点' }}</span>
                      </span>
                      <span>{{ collageDate }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="absolute -top-3 -right-3 w-10 h-10 bg-red-500 rounded-full shadow-lg flex items-center justify-center">
                <span class="text-white text-lg">❤️</span>
              </div>
            </div>

            <!-- 胶片条风格 -->
            <div v-else-if="selectedCollageStyle === 'filmstrip'" class="relative">
              <div class="bg-gray-900 rounded-lg p-4 shadow-2xl">
                <div class="flex space-x-3">
                  <div 
                    v-for="(image, index) in availableImagesForCollage.slice(0, 6)" 
                    :key="index"
                    class="relative"
                  >
                    <div class="w-28 h-36 bg-gray-800 rounded-sm overflow-hidden border-2 border-gray-700">
                      <img :src="image" class="w-full h-full object-cover" />
                    </div>
                    <div class="absolute top-1 left-1/2 -translate-x-1/2 flex space-x-0.5">
                      <div class="w-1 h-1 bg-gray-600 rounded-full"></div>
                      <div class="w-1 h-1 bg-gray-600 rounded-full"></div>
                    </div>
                    <div class="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-0.5">
                      <div class="w-1 h-1 bg-gray-600 rounded-full"></div>
                      <div class="w-1 h-1 bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div class="mt-4 text-center">
                  <h3 class="text-xl font-serif font-bold text-amber-100">{{ collageTitle || '胶片记忆' }}</h3>
                  <p class="text-amber-200/70 text-sm mt-1">{{ collageLocation }} · {{ collageDate }}</p>
                </div>
              </div>
              <div class="absolute -top-2 left-4 text-3xl">🎞️</div>
            </div>

            <!-- 车票式风格 -->
            <div v-else-if="selectedCollageStyle === 'ticket'" class="relative">
              <div class="w-96 bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl shadow-2xl overflow-hidden relative">
                <div class="absolute left-12 top-0 bottom-0 w-0.5 bg-white/20"></div>
                <div class="absolute right-12 top-0 bottom-0 w-0.5 bg-white/20"></div>
                
                <div class="flex">
                  <div class="w-20 p-4 flex flex-col items-center justify-center border-r border-white/20">
                    <div class="text-4xl mb-2">🚀</div>
                    <div class="text-white/80 text-xs text-center">出发</div>
                  </div>
                  
                  <div class="flex-1 p-4">
                    <div class="flex justify-between items-start mb-3">
                      <div>
                        <h3 class="text-2xl font-serif font-bold text-white">{{ collageTitle || '旅行票根' }}</h3>
                        <p class="text-white/70 text-sm">{{ collageSubtitle }}</p>
                      </div>
                      <div class="text-right">
                        <div class="text-white/60 text-xs">票价</div>
                        <div class="text-white font-bold">FREE</div>
                      </div>
                    </div>
                    
                    <div class="flex space-x-2 mb-3">
                      <div 
                        v-for="(image, index) in availableImagesForCollage.slice(0, 3)" 
                        :key="index"
                        class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-inner"
                      >
                        <img :src="image" class="w-full h-full object-cover" />
                      </div>
                    </div>
                    
                    <div class="flex items-center justify-between text-white/80 text-sm">
                      <span class="flex items-center space-x-1">
                        <span>📍</span>
                        <span>{{ collageLocation || '目的地' }}</span>
                      </span>
                      <span>{{ collageDate }}</span>
                    </div>
                  </div>
                  
                  <div class="w-20 p-4 flex flex-col items-center justify-center border-l border-white/20">
                    <div class="text-4xl mb-2">🎯</div>
                    <div class="text-white/80 text-xs text-center">到达</div>
                  </div>
                </div>
                
                <div class="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-warm-bg rounded-full"></div>
                <div class="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-warm-bg rounded-full"></div>
              </div>
            </div>

            <!-- 拍立得风格 -->
            <div v-else-if="selectedCollageStyle === 'polaroid'" class="relative">
              <div class="flex space-x-4">
                <div 
                  v-for="(image, index) in availableImagesForCollage.slice(0, 4)" 
                  :key="index"
                  class="relative"
                  :style="{ transform: `rotate(${(index - 1.5) * 3}deg)`, zIndex: 10 - index }"
                >
                  <div class="bg-white p-3 pb-10 rounded shadow-xl">
                    <div class="w-40 h-40 bg-gray-100 overflow-hidden">
                      <img :src="image" class="w-full h-full object-cover" />
                    </div>
                    <div class="mt-3 text-center">
                      <p class="font-serif text-text-primary text-sm">{{ collageTitle || '拍立得' }}</p>
                      <p class="text-xs text-text-muted mt-1">{{ collageDate }}</p>
                    </div>
                  </div>
                  <div class="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-yellow-200/80 rounded-sm shadow-sm"></div>
                </div>
              </div>
            </div>

            <!-- 拼图风格 -->
            <div v-else-if="selectedCollageStyle === 'mosaic'" class="relative">
              <div class="w-96 bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div class="relative">
                  <div v-if="availableImagesForCollage.length >= 1" class="grid grid-cols-3 grid-rows-3 gap-1 p-1">
                    <div 
                      v-for="(image, index) in availableImagesForCollage.slice(0, 9)" 
                      :key="index"
                      :class="[
                        'overflow-hidden rounded-lg',
                        index === 0 ? 'col-span-2 row-span-2' : ''
                      ]"
                    >
                      <img :src="image" class="w-full h-full object-cover min-h-full" :class="index === 0 ? 'h-64' : 'h-32'" />
                    </div>
                  </div>
                  
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 pt-16">
                    <h3 class="text-2xl font-serif font-bold text-white">{{ collageTitle || '精彩瞬间' }}</h3>
                    <p class="text-white/80 mt-1">{{ collageSubtitle }}</p>
                    <div class="flex items-center space-x-4 mt-3 text-white/70 text-sm">
                      <span class="flex items-center space-x-1">
                        <span>📍</span>
                        <span>{{ collageLocation }}</span>
                      </span>
                      <span>{{ collageDate }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="text-center mt-8">
            <p class="text-sm text-text-muted bg-warm-card inline-flex items-center space-x-2 px-4 py-2 rounded-full">
              <span>💡</span>
              <span>这是发布后首屏的预览效果，图片会作为游记封面展示</span>
            </p>
          </div>
        </div>

        <!-- 发布按钮 -->
        <div class="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            @click="toggleCollagePreview"
            class="btn-secondary"
          >
            继续编辑
          </button>
          <button
            type="button"
            @click="handleSubmit"
            class="btn-primary"
            :disabled="loading"
          >
            {{ loading ? '发布中...' : '确认发布' }}
          </button>
        </div>
      </div>

      <!-- 普通编辑模式 -->
      <div v-else class="card">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">标题</label>
            <input
              v-model="title"
              type="text"
              placeholder="给游记起个标题吧"
              class="input-field text-lg"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">所在城市</label>
            <CitySearchSelect v-model="selectedCityId" placeholder="输入城市名或别名，如：魔都、蓉城、姑苏" />
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              关联打卡足迹
              <span class="text-text-muted font-normal ml-2">
                关联后，游记会展示你走过的真实地点链路
              </span>
            </label>
            <button
              type="button"
              @click="openCheckinPicker"
              class="w-full p-4 border-2 border-dashed border-warm-border rounded-xl hover:border-primary transition-colors text-left"
            >
              <div v-if="selectedCheckins.length === 0" class="flex items-center justify-center text-text-muted">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>点击选择要关联的打卡记录</span>
              </div>
              <div v-else class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-text-primary">
                    已关联 {{ selectedCheckins.length }} 个打卡地点
                  </span>
                  <span class="text-primary text-sm">点击管理</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="checkin in selectedCheckins.slice(0, 5)"
                    :key="checkin.id"
                    class="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    <span class="mr-1">{{ getTravelMethodIcon(checkin.travelMethod) }}</span>
                    <span class="truncate max-w-[120px]">{{ checkin.location }}</span>
                  </span>
                  <span
                    v-if="selectedCheckins.length > 5"
                    class="inline-flex items-center px-2.5 py-1 bg-secondary text-text-muted text-xs rounded-full"
                  >
                    +{{ selectedCheckins.length - 5 }} 个
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              添加照片
              <span v-if="images.length > 0" class="text-primary ml-2">({{ images.length }}张)</span>
            </label>
            <div class="grid grid-cols-3 gap-4">
              <div
                v-for="(image, index) in images"
                :key="index"
                class="relative aspect-square rounded-xl overflow-hidden group"
              >
                <img :src="image" alt="" class="w-full h-full object-cover" />
                <button
                  type="button"
                  @click="removeImage(index)"
                  class="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
                <div class="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-white text-xs">
                  {{ index + 1 }}
                </div>
              </div>

              <label
                v-if="images.length < 9"
                class="aspect-square rounded-xl border-2 border-dashed border-warm-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  @change="handleImageUpload"
                  class="hidden"
                />
                <svg v-if="!uploading" class="w-8 h-8 text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span v-if="!uploading" class="text-sm text-text-muted">添加照片</span>
                <span v-else class="text-sm text-primary">上传中...</span>
              </label>
            </div>
            <p class="text-xs text-text-muted mt-2">最多上传9张照片，支持jpg、png格式</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">游记内容</label>
            <textarea
              v-model="content"
              rows="12"
              placeholder="记录下你的旅行故事吧..."
              class="input-field resize-none"
            ></textarea>
          </div>

          <div v-if="error" class="text-red-500 text-sm text-center">
            {{ error }}
          </div>

          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click="router.back()"
              class="btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="loading"
            >
              {{ loading ? '发布中...' : '发布游记' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 打卡选择器弹窗 -->
    <Teleport to="body">
      <div
        v-if="showCheckinPicker"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="closeCheckinPicker"
        ></div>
        <div class="relative bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl mx-4">
          <div class="sticky top-0 bg-white border-b border-warm-border px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-serif font-semibold text-text-primary flex items-center gap-2">
                <span>📍</span>
                选择关联的打卡记录
              </h3>
              <button
                @click="closeCheckinPicker"
                class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-warm-bg transition-colors"
              >
                <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p class="text-sm text-text-muted mt-1">
              选择你这次旅行中走过的打卡地点，游记会按时间顺序展示真实的足迹链路
            </p>
          </div>

          <div class="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            <div v-if="loadingCheckins" class="flex flex-col items-center justify-center py-12">
              <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p class="text-text-muted">加载打卡记录中...</p>
            </div>

            <div v-else-if="checkinStore.checkins.length === 0" class="text-center py-12">
              <div class="text-5xl mb-4">📝</div>
              <p class="text-text-primary font-medium mb-2">还没有打卡记录</p>
              <p class="text-text-muted text-sm">先去打卡记录你的足迹吧~</p>
            </div>

            <div v-else class="space-y-6">
              <div
                v-for="cityGroup in sortedCheckinsByCity"
                :key="cityGroup.cityId"
                class="space-y-3"
              >
                <div class="flex items-center gap-2">
                  <span class="text-lg">🏙️</span>
                  <h4 class="font-medium text-text-primary">{{ cityGroup.cityName }}</h4>
                  <span class="text-xs text-text-muted bg-secondary px-2 py-0.5 rounded-full">
                    {{ cityGroup.checkins.length }} 个打卡
                  </span>
                </div>
                <div class="space-y-2 pl-2">
                  <div
                    v-for="checkin in cityGroup.checkins"
                    :key="checkin.id"
                    @click="toggleCheckin(checkin.id)"
                    :class="[
                      'p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
                      'flex items-start gap-3',
                      isCheckinSelected(checkin.id)
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-warm-border hover:border-primary/50 hover:bg-primary/5'
                    ]"
                  >
                    <div
                      :class="[
                        'w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors',
                        isCheckinSelected(checkin.id)
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-300'
                      ]"
                    >
                      <svg v-if="isCheckinSelected(checkin.id)" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-lg">{{ getTravelMethodIcon(checkin.travelMethod) }}</span>
                        <span class="font-medium text-text-primary">{{ checkin.location }}</span>
                      </div>
                      <div class="flex items-center gap-3 text-sm text-text-muted">
                        <span class="flex items-center gap-1">
                          <span>📅</span>
                          {{ formatTravelTime(checkin.travelTime) }}
                        </span>
                        <span class="flex items-center gap-1">
                          <span>🚀</span>
                          {{ getTravelMethodLabel(checkin.travelMethod) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="sticky bottom-0 bg-white border-t border-warm-border px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="text-sm text-text-muted">
                已选择 <span class="text-primary font-medium">{{ selectedCheckinIds.length }}</span> 个打卡
              </div>
              <div class="flex gap-3">
                <button
                  @click="selectedCheckinIds = []"
                  class="px-4 py-2 text-text-secondary hover:text-primary transition-colors"
                >
                  清空选择
                </button>
                <button
                  @click="closeCheckinPicker"
                  class="btn-primary"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
