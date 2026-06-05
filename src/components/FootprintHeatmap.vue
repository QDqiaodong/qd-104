<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getFootprintHeatmap, getFootprintByDate } from '@/api/footprint'
import type { FootprintHeatmapData, DailyActivity } from '@/types'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const heatmapData = ref<FootprintHeatmapData[]>([])
const selectedDate = ref<string | null>(null)
const selectedDateActivities = ref<DailyActivity[]>([])
const showDetailModal = ref(false)

const months = [
  { value: 1, label: '一月' },
  { value: 2, label: '二月' },
  { value: 3, label: '三月' },
  { value: 4, label: '四月' },
  { value: 5, label: '五月' },
  { value: 6, label: '六月' },
  { value: 7, label: '七月' },
  { value: 8, label: '八月' },
  { value: 9, label: '九月' },
  { value: 10, label: '十月' },
  { value: 11, label: '十一月' },
  { value: 12, label: '十二月' }
]

const years = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => current - 2 + i)
})

const weeks = ['日', '一', '二', '三', '四', '五', '六']

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay()
  
  const days: (number | null)[] = []
  
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null)
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  
  return days
})

const maxActivityCount = computed(() => {
  if (heatmapData.value.length === 0) return 0
  return Math.max(...heatmapData.value.map(d => d.activityCount))
})

function getActivityCount(day: number | null): number {
  if (day === null) return 0
  const dateStr = formatDate(day)
  const data = heatmapData.value.find(d => d.date === dateStr)
  return data?.activityCount || 0
}

function getHeatLevel(day: number | null): number {
  const count = getActivityCount(day)
  if (count === 0) return 0
  if (maxActivityCount.value === 0) return 1
  const level = Math.ceil((count / maxActivityCount.value) * 4)
  return Math.min(level, 4)
}

function getHeatClass(day: number | null): string {
  const level = getHeatLevel(day)
  const classes = [
    'bg-warm-bg',
    'bg-primary/20',
    'bg-primary/40',
    'bg-primary/60',
    'bg-primary/80'
  ]
  return classes[level]
}

function formatDate(day: number): string {
  const y = currentYear.value
  const m = String(currentMonth.value).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function loadHeatmapData() {
  if (!authStore.isLoggedIn) {
    heatmapData.value = []
    return
  }
  
  loading.value = true
  try {
    const data = await getFootprintHeatmap({
      year: currentYear.value,
      month: currentMonth.value
    })
    heatmapData.value = data
  } catch (e) {
    console.error('加载热力图数据失败', e)
    heatmapData.value = []
  } finally {
    loading.value = false
  }
}

async function handleDateClick(day: number | null) {
  if (day === null) return
  
  const dateStr = formatDate(day)
  const count = getActivityCount(day)
  
  if (count === 0) return
  
  selectedDate.value = dateStr
  
  try {
    const data = await getFootprintByDate(dateStr)
    selectedDateActivities.value = data.activities
    showDetailModal.value = true
  } catch (e) {
    console.error('加载日期详情失败', e)
  }
}

function handleActivityClick(activity: DailyActivity) {
  if (activity.type === 'journal') {
    router.push(`/journal/${activity.id}`)
    showDetailModal.value = false
  } else if (activity.type === 'checkin') {
    router.push({
      path: '/checkin',
      query: { id: String(activity.id) }
    })
    showDetailModal.value = false
  }
}

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

function getPlaceHolderImage(title: string): string {
  const colors = ['%238B7355', '%23A68B6A', '%23C0A88D', '%23D4C4B0']
  const color = colors[title.charCodeAt(0) % colors.length]
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='${color}' stop-opacity='0.8'/%3E%3Cstop offset='100%25' stop-color='%23E8B4B8' stop-opacity='0.6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='800' height='600'/%3E%3Ctext x='400' y='300' text-anchor='middle' fill='%23ffffff' font-size='28' font-family='serif'%3E${encodeURIComponent(title.slice(0, 4))}%3C/text%3E%3C/svg%3E`
}

watch([currentYear, currentMonth], loadHeatmapData)

onMounted(() => {
  loadHeatmapData()
})
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-serif font-semibold text-text-primary">
        我的足迹日历
      </h3>
      <div class="flex items-center gap-2">
        <button
          @click="prevMonth"
          class="w-8 h-8 flex items-center justify-center rounded-lg bg-warm-bg hover:bg-secondary transition-colors"
        >
          <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <select
          v-model="currentYear"
          class="px-3 py-1.5 rounded-lg border border-warm-border bg-white text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}年
          </option>
        </select>
        <select
          v-model="currentMonth"
          class="px-3 py-1.5 rounded-lg border border-warm-border bg-white text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option v-for="month in months" :key="month.value" :value="month.value">
            {{ month.label }}
          </option>
        </select>
        <button
          @click="nextMonth"
          class="w-8 h-8 flex items-center justify-center rounded-lg bg-warm-bg hover:bg-secondary transition-colors"
        >
          <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="!authStore.isLoggedIn" class="text-center py-8">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
        <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p class="text-text-secondary mb-4">登录后查看你的足迹日历</p>
      <router-link to="/login" class="btn-primary">立即登录</router-link>
    </div>

    <div v-else>
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div
          v-for="week in weeks"
          :key="week"
          class="text-center text-sm text-text-muted py-2"
        >
          {{ week }}
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="[
            'aspect-square rounded-lg flex items-center justify-center text-sm transition-all',
            day !== null ? 'cursor-pointer hover:ring-2 hover:ring-primary/50' : '',
            getHeatClass(day)
          ]"
          @click="handleDateClick(day)"
        >
          <span
            :class="[
              getActivityCount(day) > 0 ? 'font-medium' : 'text-text-muted',
              getActivityCount(day) >= 3 ? 'text-white' : 'text-text-secondary'
            ]"
          >
            {{ day ?? '' }}
          </span>
        </div>
      </div>

      <div class="flex items-center justify-end gap-4 mt-4 text-xs text-text-muted">
        <span>活跃度：</span>
        <div class="flex items-center gap-1">
          <span class="w-4 h-4 rounded bg-warm-border"></span>
          <span>低</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="w-4 h-4 rounded bg-primary/80"></span>
          <span>高</span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showDetailModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="showDetailModal = false"
        ></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-scale-in">
          <div class="sticky top-0 bg-white border-b border-warm-border px-6 py-4">
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-serif font-semibold text-text-primary">
                {{ formatDisplayDate(selectedDate || '') }}
              </h4>
              <button
                @click="showDetailModal = false"
                class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-warm-bg transition-colors"
              >
                <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="px-6 py-4 overflow-y-auto max-h-[60vh]">
            <div class="space-y-4">
              <div
                v-for="activity in selectedDateActivities"
                :key="`${activity.type}-${activity.id}`"
                class="flex gap-4 p-3 rounded-xl bg-warm-bg hover:bg-secondary/50 cursor-pointer transition-colors"
                @click="handleActivityClick(activity)"
              >
                <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    :src="activity.image || getPlaceHolderImage(activity.title)"
                    :alt="activity.title"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      :class="[
                        'text-xs px-2 py-0.5 rounded-full',
                        activity.type === 'journal'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-primary/10 text-primary'
                      ]"
                    >
                      {{ activity.type === 'journal' ? '游记' : '打卡' }}
                    </span>
                    <span class="text-xs text-text-muted">{{ activity.cityName }}</span>
                  </div>
                  <h5 class="font-medium text-text-primary truncate">
                    {{ activity.title }}
                  </h5>
                  <p class="text-xs text-text-muted mt-1">
                    {{ activity.time }}
                  </p>
                </div>
                <svg class="w-5 h-5 text-text-muted flex-shrink-0 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
