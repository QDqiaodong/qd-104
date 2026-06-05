<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useJournalStore } from '@/stores/journal'
import { useCheckinStore } from '@/stores/checkin'
import imageCompression from 'browser-image-compression'

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
      // 压缩图片
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      }
      const compressedFile = await imageCompression(file, options)

      // 转换为 base64
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
    <div class="container mx-auto px-4 max-w-3xl">
      <h1 class="text-3xl font-serif font-bold text-text-primary mb-8">发布游记</h1>

      <div class="card">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 标题 -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">标题</label>
            <input
              v-model="title"
              type="text"
              placeholder="给游记起个标题吧"
              class="input-field text-lg"
            />
          </div>

          <!-- 城市选择 -->
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

          <!-- 图片上传 -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">添加照片</label>
            <div class="grid grid-cols-3 gap-4">
              <!-- 已上传的图片 -->
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
              </div>

              <!-- 上传按钮 -->
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

          <!-- 内容 -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">游记内容</label>
            <textarea
              v-model="content"
              rows="12"
              placeholder="记录下你的旅行故事吧..."
              class="input-field resize-none"
            ></textarea>
          </div>

          <!-- 错误提示 -->
          <div v-if="error" class="text-red-500 text-sm text-center">
            {{ error }}
          </div>

          <!-- 提交按钮 -->
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
