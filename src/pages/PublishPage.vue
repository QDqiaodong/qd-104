<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useJournalStore } from '@/stores/journal'
import { useCheckinStore } from '@/stores/checkin'
import imageCompression from 'browser-image-compression'
import type { CollageStyle, CollageStyleConfig } from '@/types'

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
      cityId: selectedCityId.value
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
            <select
              v-model="selectedCityId"
              class="input-field"
            >
              <option value="">请选择城市</option>
              <optgroup
                v-for="province in [...new Set(checkinStore.cities.map(c => c.province))]"
                :key="province"
                :label="province"
              >
                <option
                  v-for="city in checkinStore.cities.filter(c => c.province === province)"
                  :key="city.id"
                  :value="city.id"
                >
                  {{ city.name }}
                </option>
              </optgroup>
            </select>
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
  </div>
</template>
