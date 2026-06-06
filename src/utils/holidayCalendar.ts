const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520
]

const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const LUNAR_DAYS = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
]

const SOLAR_1_1 = new Date(1900, 0, 31).getTime()

function getLunarYearDays(year: number): number {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[year - 1900] & i) ? 1 : 0
  }
  return sum + getLunarLeapDays(year)
}

function getLunarLeapMonth(year: number): number {
  return LUNAR_INFO[year - 1900] & 0xf
}

function getLunarLeapDays(year: number): number {
  if (getLunarLeapMonth(year)) {
    return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29
  }
  return 0
}

function getLunarMonthDays(year: number, month: number): number {
  return (LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29
}

export interface LunarDate {
  year: number
  month: number
  day: number
  isLeap: boolean
}

export function solarToLunar(solarDate: Date): LunarDate {
  const target = new Date(solarDate.getFullYear(), solarDate.getMonth(), solarDate.getDate())
  let offset = Math.floor((target.getTime() - SOLAR_1_1) / 86400000)

  let year = 1900
  let daysInYear: number
  while (year < 2100 && offset > 0) {
    daysInYear = getLunarYearDays(year)
    if (offset < daysInYear) break
    offset -= daysInYear
    year++
  }

  const leapMonth = getLunarLeapMonth(year)
  let isLeap = false
  let month = 1
  let daysInMonth: number

  while (month < 13 && offset > 0) {
    if (leapMonth > 0 && month === leapMonth + 1 && !isLeap) {
      --month
      isLeap = true
      daysInMonth = getLunarLeapDays(year)
    } else {
      daysInMonth = getLunarMonthDays(year, month)
    }

    if (isLeap && month === leapMonth + 1) isLeap = false
    if (offset < daysInMonth) break
    offset -= daysInMonth
    month++
  }

  const day = offset + 1

  return { year, month, day, isLeap }
}

export function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeap = false): Date {
  let offset = 0
  for (let i = 1900; i < lunarYear; i++) {
    offset += getLunarYearDays(i)
  }

  const leapMonth = getLunarLeapMonth(lunarYear)
  let addedLeap = false

  for (let i = 1; i < lunarMonth; i++) {
    if (leapMonth > 0 && i === leapMonth + 1 && !addedLeap) {
      offset += getLunarLeapDays(lunarYear)
      addedLeap = true
      i--
      continue
    }
    offset += getLunarMonthDays(lunarYear, i)
  }

  if (isLeap && leapMonth === lunarMonth) {
    offset += getLunarMonthDays(lunarYear, lunarMonth)
  }

  offset += lunarDay - 1

  const result = new Date(SOLAR_1_1)
  result.setDate(result.getDate() + offset)
  return result
}

export interface HolidayInfo {
  name: string
  type: 'solar' | 'lunar' | 'term' | 'adjusted'
  isLegal: boolean
  length?: number
}

const FIXED_SOLAR_HOLIDAYS: Record<string, HolidayInfo> = {
  '01-01': { name: '元旦', type: 'solar', isLegal: true, length: 1 },
  '05-01': { name: '劳动节', type: 'solar', isLegal: true, length: 5 },
  '10-01': { name: '国庆节', type: 'solar', isLegal: true, length: 7 },
  '03-08': { name: '妇女节', type: 'solar', isLegal: false },
  '05-04': { name: '青年节', type: 'solar', isLegal: false },
  '06-01': { name: '儿童节', type: 'solar', isLegal: false },
  '08-01': { name: '建军节', type: 'solar', isLegal: false },
  '09-10': { name: '教师节', type: 'solar', isLegal: false },
  '12-25': { name: '圣诞节', type: 'solar', isLegal: false }
}

const LUNAR_HOLIDAYS: Record<string, HolidayInfo> = {
  '01-01': { name: '春节', type: 'lunar', isLegal: true, length: 7 },
  '01-15': { name: '元宵节', type: 'lunar', isLegal: false },
  '02-02': { name: '龙抬头', type: 'lunar', isLegal: false },
  '05-05': { name: '端午节', type: 'lunar', isLegal: true, length: 3 },
  '07-07': { name: '七夕节', type: 'lunar', isLegal: false },
  '07-15': { name: '中元节', type: 'lunar', isLegal: false },
  '08-15': { name: '中秋节', type: 'lunar', isLegal: true, length: 3 },
  '09-09': { name: '重阳节', type: 'lunar', isLegal: false },
  '12-08': { name: '腊八节', type: 'lunar', isLegal: false },
  '12-23': { name: '小年', type: 'lunar', isLegal: false }
}

const TERM_HOLIDAYS: Record<string, HolidayInfo> = {
  'qingming': { name: '清明节', type: 'term', isLegal: true, length: 3 }
}

function getTermDate(year: number, termIndex: number): Date {
  const terms = [0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693]
  const base = new Date(year, 2, 5, 12)
  const termDate = new Date(base.getTime() + terms[termIndex] * 60000)
  return termDate
}

function getQingmingDate(year: number): Date {
  return getTermDate(year, 4)
}

function padZero(n: number): string {
  return n < 10 ? '0' + n : '' + n
}

function formatSolarKey(month: number, day: number): string {
  return `${padZero(month)}-${padZero(day)}`
}

function formatLunarKey(month: number, day: number): string {
  return `${padZero(month)}-${padZero(day)}`
}

const EXACT_HOLIDAY_DATA: Record<number, Record<string, string>> = {
  2023: {
    '01-01': '元旦', '01-02': '元旦',
    '01-21': '春节', '01-22': '春节', '01-23': '春节', '01-24': '春节', '01-25': '春节', '01-26': '春节', '01-27': '春节',
    '04-05': '清明', '04-04': '清明', '04-06': '清明',
    '05-01': '五一', '05-02': '五一', '05-03': '五一',
    '06-22': '端午', '06-23': '端午', '06-24': '端午',
    '09-29': '中秋',
    '10-01': '国庆', '10-02': '国庆', '10-03': '国庆', '10-04': '国庆', '10-05': '国庆', '10-06': '国庆'
  },
  2024: {
    '01-01': '元旦',
    '02-10': '春节', '02-11': '春节', '02-12': '春节', '02-13': '春节', '02-14': '春节', '02-15': '春节', '02-16': '春节', '02-17': '春节',
    '04-04': '清明', '04-05': '清明', '04-06': '清明',
    '05-01': '五一', '05-02': '五一', '05-03': '五一', '05-04': '五一', '05-05': '五一',
    '06-08': '端午', '06-09': '端午', '06-10': '端午',
    '09-15': '中秋', '09-16': '中秋', '09-17': '中秋',
    '10-01': '国庆', '10-02': '国庆', '10-03': '国庆', '10-04': '国庆', '10-05': '国庆', '10-06': '国庆', '10-07': '国庆'
  },
  2025: {
    '01-01': '元旦',
    '01-28': '春节', '01-29': '春节', '01-30': '春节', '01-31': '春节', '02-01': '春节', '02-02': '春节', '02-03': '春节', '02-04': '春节',
    '04-04': '清明', '04-05': '清明', '04-06': '清明',
    '05-01': '五一', '05-02': '五一', '05-03': '五一', '05-04': '五一', '05-05': '五一',
    '05-31': '端午', '06-01': '端午', '06-02': '端午',
    '10-01': '国庆', '10-02': '国庆', '10-03': '国庆', '10-04': '国庆', '10-05': '国庆', '10-06': '国庆中秋', '10-07': '国庆'
  },
  2026: {
    '01-01': '元旦',
    '02-17': '春节', '02-18': '春节', '02-19': '春节', '02-20': '春节', '02-21': '春节', '02-22': '春节', '02-23': '春节', '02-24': '春节', '02-25': '春节',
    '04-05': '清明', '04-06': '清明', '04-07': '清明',
    '05-01': '五一', '05-02': '五一', '05-03': '五一', '05-04': '五一', '05-05': '五一',
    '06-19': '端午', '06-20': '端午', '06-21': '端午',
    '09-25': '中秋', '09-26': '中秋', '09-27': '中秋',
    '10-01': '国庆', '10-02': '国庆', '10-03': '国庆', '10-04': '国庆', '10-05': '国庆', '10-06': '国庆', '10-07': '国庆'
  }
}

export function getHolidayInfo(date: Date): HolidayInfo | null {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const solarKey = formatSolarKey(month, day)

  if (EXACT_HOLIDAY_DATA[year] && EXACT_HOLIDAY_DATA[year][solarKey]) {
    return {
      name: EXACT_HOLIDAY_DATA[year][solarKey],
      type: 'adjusted',
      isLegal: true
    }
  }

  const solarHoliday = FIXED_SOLAR_HOLIDAYS[solarKey]
  if (solarHoliday) {
    return solarHoliday
  }

  const lunar = solarToLunar(date)
  const lunarKey = formatLunarKey(lunar.month, lunar.day)
  if (!lunar.isLeap) {
    const lunarHoliday = LUNAR_HOLIDAYS[lunarKey]
    if (lunarHoliday) {
      return lunarHoliday
    }
  }

  const qingming = getQingmingDate(year)
  if (
    month === qingming.getMonth() + 1 &&
    day === qingming.getDate()
  ) {
    return TERM_HOLIDAYS.qingming
  }

  return null
}

export function isLegalHoliday(date: Date): boolean {
  const info = getHolidayInfo(date)
  return info !== null && info.isLegal
}

export function isHoliday(date: Date): boolean {
  return getHolidayInfo(date) !== null
}

export function getHolidayName(date: Date): string | null {
  const info = getHolidayInfo(date)
  return info ? info.name : null
}

export function isWeekend(date: Date): boolean {
  const d = date.getDay()
  return d === 0 || d === 6
}

export function isRestDay(date: Date): boolean {
  if (isWeekend(date)) return true
  if (isLegalHoliday(date)) return true
  return false
}

export function getHolidayType(date: Date): 'weekend' | 'legal' | 'other' | 'workday' {
  if (isLegalHoliday(date)) return 'legal'
  if (isWeekend(date)) return 'weekend'
  if (isHoliday(date)) return 'other'
  return 'workday'
}

export function formatLunarDate(date: Date): string {
  const lunar = solarToLunar(date)
  const leapStr = lunar.isLeap ? '闰' : ''
  return `${lunar.year}年${leapStr}${LUNAR_MONTHS[lunar.month - 1]}月${LUNAR_DAYS[lunar.day - 1]}`
}

export const HOLIDAY_TEST_CASES: { date: string; expectedName: string; isLegal: boolean; note: string }[] = [
  { date: '2024-02-10', expectedName: '春节', isLegal: true, note: '2024春节（固定2024年农历正月初一）' },
  { date: '2025-01-29', expectedName: '春节', isLegal: true, note: '2025春节（农历正月初一）' },
  { date: '2026-02-17', expectedName: '春节', isLegal: true, note: '2026春节（农历正月初一）' },
  { date: '2024-06-10', expectedName: '端午', isLegal: true, note: '2024端午（农历五月初五）' },
  { date: '2025-05-31', expectedName: '端午', isLegal: true, note: '2025端午（农历五月初五）' },
  { date: '2026-06-19', expectedName: '端午', isLegal: true, note: '2026端午（农历五月初五）' },
  { date: '2024-09-17', expectedName: '中秋', isLegal: true, note: '2024中秋（农历八月十五）' },
  { date: '2025-10-06', expectedName: '国庆中秋', isLegal: true, note: '2025中秋（与国庆重合）' },
  { date: '2026-09-25', expectedName: '中秋', isLegal: true, note: '2026中秋（农历八月十五）' },
  { date: '2024-04-04', expectedName: '清明节', isLegal: true, note: '2024清明节气' },
  { date: '2025-04-05', expectedName: '清明节', isLegal: true, note: '2025清明节气' },
  { date: '2024-01-01', expectedName: '元旦', isLegal: true, note: '公历固定节日' },
  { date: '2024-05-01', expectedName: '劳动节', isLegal: true, note: '五一劳动节' },
  { date: '2024-10-01', expectedName: '国庆节', isLegal: true, note: '国庆节' },
  { date: '2024-02-14', expectedName: '春节', isLegal: true, note: '2024年春节假期第5天' },
  { date: '2023-01-22', expectedName: '春节', isLegal: true, note: '2023年春节（正月初一）' },
  { date: '2024-03-15', expectedName: '', isLegal: false, note: '普通工作日' },
  { date: '2024-03-09', expectedName: '', isLegal: false, note: '普通周六' },
  { date: '2024-02-24', expectedName: '元宵节', isLegal: false, note: '元宵节非法定假日' }
]
