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
} from '../holidayCalendar'

interface TestResult {
  name: string
  passed: boolean
  actual: string
  expected: string
  note: string
}

function runTests(): TestResult[] {
  const results: TestResult[] = []

  results.push({
    name: 'solarToLunar: 2024-02-10 应为 2024年正月初一',
    passed: (() => {
      const lunar = solarToLunar(new Date(2024, 1, 10))
      return lunar.year === 2024 && lunar.month === 1 && lunar.day === 1 && !lunar.isLeap
    })(),
    actual: JSON.stringify(solarToLunar(new Date(2024, 1, 10))),
    expected: 'year:2024, month:1, day:1, isLeap:false',
    note: '2024年春节'
  })

  results.push({
    name: 'solarToLunar: 2025-01-29 应为 2025年正月初一',
    passed: (() => {
      const lunar = solarToLunar(new Date(2025, 0, 29))
      return lunar.year === 2025 && lunar.month === 1 && lunar.day === 1 && !lunar.isLeap
    })(),
    actual: JSON.stringify(solarToLunar(new Date(2025, 0, 29))),
    expected: 'year:2025, month:1, day:1, isLeap:false',
    note: '2025年春节'
  })

  results.push({
    name: 'solarToLunar: 2026-02-17 应为 2026年正月初一',
    passed: (() => {
      const lunar = solarToLunar(new Date(2026, 1, 17))
      return lunar.year === 2026 && lunar.month === 1 && lunar.day === 1 && !lunar.isLeap
    })(),
    actual: JSON.stringify(solarToLunar(new Date(2026, 1, 17))),
    expected: 'year:2026, month:1, day:1, isLeap:false',
    note: '2026年春节'
  })

  results.push({
    name: 'lunarToSolar: 2024年正月初一 -> 2024-02-10',
    passed: (() => {
      const solar = lunarToSolar(2024, 1, 1)
      return solar.getFullYear() === 2024 && solar.getMonth() === 1 && solar.getDate() === 10
    })(),
    actual: lunarToSolar(2024, 1, 1).toISOString().slice(0, 10),
    expected: '2024-02-10',
    note: '农历转公历 2024春节'
  })

  results.push({
    name: 'lunarToSolar: 2025年五月初五 -> 2025-05-31（端午）',
    passed: (() => {
      const solar = lunarToSolar(2025, 5, 5)
      return solar.getFullYear() === 2025 && solar.getMonth() === 4 && solar.getDate() === 31
    })(),
    actual: lunarToSolar(2025, 5, 5).toISOString().slice(0, 10),
    expected: '2025-05-31',
    note: '2025年端午节'
  })

  results.push({
    name: 'lunarToSolar: 2026年八月十五 -> 2026-09-25（中秋）',
    passed: (() => {
      const solar = lunarToSolar(2026, 8, 15)
      return solar.getFullYear() === 2026 && solar.getMonth() === 8 && solar.getDate() === 25
    })(),
    actual: lunarToSolar(2026, 8, 15).toISOString().slice(0, 10),
    expected: '2026-09-25',
    note: '2026年中秋节'
  })

  HOLIDAY_TEST_CASES.forEach((tc, idx) => {
    const date = new Date(tc.date + 'T00:00:00')
    const actualName = getHolidayName(date) || ''
    const actualLegal = isLegalHoliday(date)

    results.push({
      name: `HOLIDAY_${idx + 1}: ${tc.date} ${tc.note}`,
      passed: actualName === tc.expectedName && actualLegal === tc.isLegal,
      actual: `name:"${actualName}", isLegal:${actualLegal}`,
      expected: `name:"${tc.expectedName}", isLegal:${tc.isLegal}`,
      note: tc.note
    })
  })

  results.push({
    name: 'isWeekend: 2024-03-09 (周六) 应为 true',
    passed: isWeekend(new Date(2024, 2, 9)),
    actual: String(isWeekend(new Date(2024, 2, 9))),
    expected: 'true',
    note: '周六'
  })

  results.push({
    name: 'isWeekend: 2024-03-11 (周一) 应为 false',
    passed: !isWeekend(new Date(2024, 2, 11)),
    actual: String(isWeekend(new Date(2024, 2, 11))),
    expected: 'false',
    note: '周一'
  })

  results.push({
    name: 'getHolidayType: 春节应为 legal',
    passed: getHolidayType(new Date(2024, 1, 10)) === 'legal',
    actual: getHolidayType(new Date(2024, 1, 10)),
    expected: 'legal',
    note: '春节当天'
  })

  results.push({
    name: 'getHolidayType: 普通工作日应为 workday',
    passed: getHolidayType(new Date(2024, 2, 15)) === 'workday',
    actual: getHolidayType(new Date(2024, 2, 15)),
    expected: 'workday',
    note: '周三普通工作日'
  })

  results.push({
    name: 'getHolidayType: 元宵节应为 other（非法定）',
    passed: getHolidayType(new Date(2024, 1, 24)) === 'other',
    actual: getHolidayType(new Date(2024, 1, 24)),
    expected: 'other',
    note: '元宵节是传统节日但非法定'
  })

  results.push({
    name: '跨年一致性: 2023春节 -> 2024春节，相差约365天',
    passed: (() => {
      const spring2023 = lunarToSolar(2023, 1, 1)
      const spring2024 = lunarToSolar(2024, 1, 1)
      const diffDays = (spring2024.getTime() - spring2023.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays > 350 && diffDays < 380
    })(),
    actual: (() => {
      const spring2023 = lunarToSolar(2023, 1, 1)
      const spring2024 = lunarToSolar(2024, 1, 1)
      return `${(spring2024.getTime() - spring2023.getTime()) / (1000 * 60 * 60 * 24)}天`
    })(),
    expected: '约355天（农历平年）',
    note: '春节每年公历日期漂移验证'
  })

  results.push({
    name: '清明节: 2023年应为 4月5日前后',
    passed: (() => {
      const info = getHolidayInfo(new Date(2023, 3, 5))
      return info !== null && info.name === '清明节'
    })(),
    actual: String(getHolidayName(new Date(2023, 3, 5))),
    expected: '清明节',
    note: '清明节气日期验证'
  })

  return results
}

export function runHolidayTests(): { total: number; passed: number; failed: number; results: TestResult[] } {
  const results = runTests()
  const passed = results.filter(r => r.passed).length
  const failed = results.length - passed
  return { total: results.length, passed, failed, results }
}

if (typeof window !== 'undefined') {
  (window as any).__runHolidayTests = runHolidayTests
}
