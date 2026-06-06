import { solarToLunar, lunarToSolar, getHolidayName, isLegalHoliday, HOLIDAY_TEST_CASES } from '../src/utils/holidayCalendar'

let pass = 0
let fail = 0

function check(name: string, cond: boolean, expected: string, actual: string) {
  if (cond) {
    pass++
    console.log(`✅ ${name}`)
  } else {
    fail++
    console.log(`❌ ${name}`)
    console.log(`   期望: ${expected}`)
    console.log(`   实际: ${actual}`)
  }
}

console.log('\n=== 农历转换验证 ===\n')

const l1 = solarToLunar(new Date(2024, 1, 10))
check('2024-02-10 → 农历正月初一',
  l1.year === 2024 && l1.month === 1 && l1.day === 1 && !l1.isLeap,
  '2024/1/1',
  `${l1.year}/${l1.month}/${l1.day} leap=${l1.isLeap}`
)

const l2 = solarToLunar(new Date(2025, 0, 29))
check('2025-01-29 → 农历正月初一',
  l2.year === 2025 && l2.month === 1 && l2.day === 1 && !l2.isLeap,
  '2025/1/1',
  `${l2.year}/${l2.month}/${l2.day} leap=${l2.isLeap}`
)

const l3 = solarToLunar(new Date(2026, 1, 17))
check('2026-02-17 → 农历正月初一',
  l3.year === 2026 && l3.month === 1 && l3.day === 1 && !l3.isLeap,
  '2026/1/1',
  `${l3.year}/${l3.month}/${l3.day} leap=${l3.isLeap}`
)

const s1 = lunarToSolar(2024, 1, 1)
check('2024年正月初一 → 2024-02-10',
  s1.getFullYear() === 2024 && s1.getMonth() === 1 && s1.getDate() === 10,
  '2024-02-10',
  s1.toISOString().slice(0, 10)
)

const s2 = lunarToSolar(2025, 5, 5)
check('2025年五月初五(端午) → 2025-05-31',
  s2.getFullYear() === 2025 && s2.getMonth() === 4 && s2.getDate() === 31,
  '2025-05-31',
  s2.toISOString().slice(0, 10)
)

const s3 = lunarToSolar(2026, 8, 15)
check('2026年八月十五(中秋) → 2026-09-25',
  s3.getFullYear() === 2026 && s3.getMonth() === 8 && s3.getDate() === 25,
  '2026-09-25',
  s3.toISOString().slice(0, 10)
)

console.log('\n=== 节假日识别测试（移动节日）===\n')

HOLIDAY_TEST_CASES.forEach(tc => {
  const date = new Date(tc.date + 'T00:00:00')
  const name = getHolidayName(date) || ''
  const legal = isLegalHoliday(date)
  const ok = name === tc.expectedName && legal === tc.isLegal
  check(`${tc.date} - ${tc.note}`,
    ok,
    `name="${tc.expectedName}" legal=${tc.isLegal}`,
    `name="${name}" legal=${legal}`
  )
})

console.log('\n=== 汇总 ===\n')
console.log(`通过: ${pass}`)
console.log(`失败: ${fail}`)
console.log(`总计: ${pass + fail}`)

if (fail > 0) {
  console.log('\n❌ 有失败用例！\n')
  process.exit(1)
} else {
  console.log('\n🎉 全部通过！\n')
}
