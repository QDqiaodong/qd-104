<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  solarToLunar,
  lunarToSolar,
  getHolidayInfo,
  isLegalHoliday,
  isHoliday,
  getHolidayName,
  isWeekend,
  getHolidayType,
  HOLIDAY_TEST_CASES
} from '@/utils/holidayCalendar'

interface TestResult {
  name: string
  passed: boolean
  actual: string
  expected: string
  note: string
  category: string
}

const results = ref<TestResult[]>([])
const total = ref(0)
const passed = ref(0)
const failed = ref(0)
const loaded = ref(false)

function runTests() {
  const list: TestResult[] = []

  list.push({
    category: '农历转换',
    name: '2024-02-10 → 农历正月初一',
    note: '2024年春节（公历转农历）',
    passed: (() => {
      const lunar = solarToLunar(new Date(2024, 1, 10))
      return lunar.year === 2024 && lunar.month === 1 && lunar.day === 1 && !lunar.isLeap
    })(),
    actual: (() => {
      const l = solarToLunar(new Date(2024, 1, 10))
      return `${l.year}年${l.isLeap ? '闰' : ''}${l.month}月${l.day}日`
    })(),
    expected: '2024年1月1日'
  })

  list.push({
    category: '农历转换',
    name: '2025-01-29 → 农历正月初一',
    note: '2025年春节（公历转农历）',
    passed: (() => {
      const lunar = solarToLunar(new Date(2025, 0, 29))
      return lunar.year === 2025 && lunar.month === 1 && lunar.day === 1 && !lunar.isLeap
    })(),
    actual: (() => {
      const l = solarToLunar(new Date(2025, 0, 29))
      return `${l.year}年${l.isLeap ? '闰' : ''}${l.month}月${l.day}日`
    })(),
    expected: '2025年1月1日'
  })

  list.push({
    category: '农历转换',
    name: '2026-02-17 → 农历正月初一',
    note: '2026年春节（公历转农历）',
    passed: (() => {
      const lunar = solarToLunar(new Date(2026, 1, 17))
      return lunar.year === 2026 && lunar.month === 1 && lunar.day === 1 && !lunar.isLeap
    })(),
    actual: (() => {
      const l = solarToLunar(new Date(2026, 1, 17))
      return `${l.year}年${l.isLeap ? '闰' : ''}${l.month}月${l.day}日`
    })(),
    expected: '2026年1月1日'
  })

  list.push({
    category: '农历转换',
    name: '2024年正月初一 → 2024-02-10',
    note: '2024年春节（农历转公历）',
    passed: (() => {
      const d = lunarToSolar(2024, 1, 1)
      return d.getFullYear() === 2024 && d.getMonth() === 1 && d.getDate() === 10
    })(),
    actual: lunarToSolar(2024, 1, 1).toISOString().slice(0, 10),
    expected: '2024-02-10'
  })

  list.push({
    category: '农历转换',
    name: '2025年五月初五 → 2025-05-31',
    note: '2025年端午节（农历转公历）',
    passed: (() => {
      const d = lunarToSolar(2025, 5, 5)
      return d.getFullYear() === 2025 && d.getMonth() === 4 && d.getDate() === 31
    })(),
    actual: lunarToSolar(2025, 5, 5).toISOString().slice(0, 10),
    expected: '2025-05-31'
  })

  list.push({
    category: '农历转换',
    name: '2026年八月十五 → 2026-09-25',
    note: '2026年中秋节（农历转公历）',
    passed: (() => {
      const d = lunarToSolar(2026, 8, 15)
      return d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 25
    })(),
    actual: lunarToSolar(2026, 8, 15).toISOString().slice(0, 10),
    expected: '2026-09-25'
  })

  list.push({
    category: '农历转换',
    name: '跨年漂移一致性：春节间隔约355天',
    note: '2023春节→2024春节的天数',
    passed: (() => {
      const s2023 = lunarToSolar(2023, 1, 1)
      const s2024 = lunarToSolar(2024, 1, 1)
      const diff = (s2024.getTime() - s2023.getTime()) / 86400000
      return diff > 350 && diff < 360
    })(),
    actual: (() => {
      const s2023 = lunarToSolar(2023, 1, 1)
      const s2024 = lunarToSolar(2024, 1, 1)
      return `${((s2024.getTime() - s2023.getTime()) / 86400000).toFixed(1)}天`
    })(),
    expected: '约355天（平年）'
  })

  list.push({
    category: '节气计算',
    name: '2023年清明节 → 4月5日前后',
    note: '清明节气日期验证',
    passed: (() => {
      const info = getHolidayInfo(new Date(2023, 3, 5))
      return info !== null && info.name === '清明节'
    })(),
    actual: String(getHolidayName(new Date(2023, 3, 5))),
    expected: '清明节'
  })

  list.push({
    category: '节气计算',
    name: '2024年清明节 → 4月4日前后',
    note: '清明节气日期验证',
    passed: (() => {
      const info = getHolidayInfo(new Date(2024, 3, 4))
      return info !== null && info.name === '清明节'
    })(),
    actual: String(getHolidayName(new Date(2024, 3, 4))),
    expected: '清明节'
  })

  list.push({
    category: '节气计算',
    name: '2025年清明节 → 4月5日前后',
    note: '清明节气日期验证',
    passed: (() => {
      const info = getHolidayInfo(new Date(2025, 3, 5))
      return info !== null && info.name === '清明节'
    })(),
    actual: String(getHolidayName(new Date(2025, 3, 5))),
    expected: '清明节'
  })

  HOLIDAY_TEST_CASES.forEach((tc) => {
    const date = new Date(tc.date + 'T00:00:00')
    const actualName = getHolidayName(date) || ''
    const actualLegal = isLegalHoliday(date)
    const ok = actualName === tc.expectedName && actualLegal === tc.isLegal

    list.push({
      category: '节假日识别',
      name: `${tc.date} - ${tc.note}`,
      note: tc.note,
      passed: ok,
      actual: `name:"${actualName}", isLegal:${actualLegal}`,
      expected: `name:"${tc.expectedName}", isLegal:${tc.isLegal}`
    })
  })

  list.push({
    category: '基础API',
    name: 'isWeekend: 周六 → true',
    note: '2024-03-09 周六',
    passed: isWeekend(new Date(2024, 2, 9)),
    actual: String(isWeekend(new Date(2024, 2, 9))),
    expected: 'true'
  })

  list.push({
    category: '基础API',
    name: 'isWeekend: 周一 → false',
    note: '2024-03-11 周一',
    passed: !isWeekend(new Date(2024, 2, 11)),
    actual: String(isWeekend(new Date(2024, 2, 11))),
    expected: 'false'
  })

  list.push({
    category: '基础API',
    name: 'getHolidayType: 春节 → legal',
    note: '法定节假日类型',
    passed: getHolidayType(new Date(2024, 1, 10)) === 'legal',
    actual: getHolidayType(new Date(2024, 1, 10)),
    expected: 'legal'
  })

  list.push({
    category: '基础API',
    name: 'getHolidayType: 工作日 → workday',
    note: '普通工作日类型',
    passed: getHolidayType(new Date(2024, 2, 15)) === 'workday',
    actual: getHolidayType(new Date(2024, 2, 15)),
    expected: 'workday'
  })

  list.push({
    category: '基础API',
    name: 'getHolidayType: 元宵节 → other',
    note: '传统节日但非法定',
    passed: getHolidayType(new Date(2024, 1, 24)) === 'other',
    actual: getHolidayType(new Date(2024, 1, 24)),
    expected: 'other'
  })

  results.value = list
  total.value = list.length
  passed.value = list.filter(r => r.passed).length
  failed.value = list.filter(r => !r.passed).length
  loaded.value = true
}

const categories = ['农历转换', '节气计算', '节假日识别', '基础API']

function getResultsByCategory(cat: string) {
  return results.value.filter(r => r.category === cat)
}

onMounted(() => {
  runTests()
})
</script>

<template>
  <div class="min-h-screen bg-warm-bg py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <h1 class="text-2xl font-bold text-text-primary mb-6">🧪 节假日计算层 - 回归测试</h1>

      <div v-if="!loaded" class="card animate-pulse">
        <div class="h-12 bg-secondary rounded"></div>
      </div>

      <div v-else>
        <div class="card mb-6">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-3xl font-bold text-text-primary">{{ total }}</div>
              <div class="text-sm text-text-secondary">总用例</div>
            </div>
            <div>
              <div class="text-3xl font-bold text-emerald-600">{{ passed }}</div>
              <div class="text-sm text-text-secondary">通过</div>
            </div>
            <div>
              <div class="text-3xl font-bold" :class="failed > 0 ? 'text-red-600' : 'text-emerald-600'">{{ failed }}</div>
              <div class="text-sm text-text-secondary">失败</div>
            </div>
          </div>
          <div class="mt-4 text-center">
            <span v-if="failed === 0" class="text-emerald-600 font-medium">🎉 全部通过！移动节假日识别正确。</span>
            <span v-else class="text-red-600 font-medium">❌ 有 {{ failed }} 个用例失败，请检查。</span>
          </div>
        </div>

        <div v-for="cat in categories" :key="cat" class="mb-6">
          <h2 class="section-title">{{ cat }}</h2>
          <div class="card divide-y divide-secondary">
            <div
              v-for="(item, idx) in getResultsByCategory(cat)"
              :key="idx"
              class="py-3 flex items-start space-x-3"
            >
              <span class="text-xl flex-shrink-0">{{ item.passed ? '✅' : '❌' }}</span>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-text-primary">{{ item.name }}</div>
                <div class="text-sm text-text-secondary mt-1">{{ item.note }}</div>
                <div v-if="!item.passed" class="mt-2 text-sm">
                  <div class="text-emerald-600">期望: {{ item.expected }}</div>
                  <div class="text-red-600">实际: {{ item.actual }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="font-medium text-text-primary mb-3">📌 移动节假日覆盖说明</h3>
          <ul class="text-sm text-text-secondary space-y-2">
            <li>• <strong>春节</strong>：覆盖 2023/2024/2025/2026 四个年份，验证农历正月初一的公历漂移</li>
            <li>• <strong>端午</strong>：覆盖 2024/2025/2026 三个年份，验证农历五月初五的公历变化</li>
            <li>• <strong>中秋</strong>：覆盖 2024/2025/2026 三个年份，验证农历八月十五的公历变化</li>
            <li>• <strong>清明</strong>：覆盖 2023/2024/2025 三个年份，验证节气日期的稳定性</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
