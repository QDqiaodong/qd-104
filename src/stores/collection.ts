import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCollections } from '@/api/journal'
import type { Journal } from '@/types'

function getPlaceHolderImage(text: string): string {
  const colors = ['%238B7355', '%23A68B6A', '%23C0A88D', '%23D4C4B0', '%23E8B4B8']
  const color = colors[text.charCodeAt(0) % colors.length]
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='${color}' stop-opacity='0.8'/%3E%3Cstop offset='100%25' stop-color='%23E8B4B8' stop-opacity='0.6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='800' height='600'/%3E%3Ctext x='400' y='300' text-anchor='middle' fill='%23ffffff' font-size='28' font-family='serif'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`
}

const mockCollections: Journal[] = [
  {
    id: 101,
    title: '上海外滩夜景：万国建筑的璀璨时光',
    content: '外滩的夜晚灯火辉煌，百年建筑在灯光下更显魅力。漫步在外滩，吹着江风，看着对岸陆家嘴的霓虹闪烁，感受魔都的独特夜色。',
    images: [getPlaceHolderImage('外滩夜景')],
    cityId: 2,
    cityName: '上海市',
    authorId: 10,
    authorName: '夜景猎人',
    createTime: '2024-02-20',
    likeCount: 356,
    collectCount: 128,
    isCollected: true
  },
  {
    id: 102,
    title: '成都美食之旅：从街边小吃到火锅盛宴',
    content: '成都的美食让人欲罢不能，火锅、串串、担担面、龙抄手...每一样都是舌尖上的享受。吃在成都，绝对是吃货的天堂。',
    images: [getPlaceHolderImage('成都美食')],
    cityId: 10,
    cityName: '成都市',
    authorId: 11,
    authorName: '美食探险家',
    createTime: '2024-02-18',
    likeCount: 428,
    collectCount: 195,
    isCollected: true
  },
  {
    id: 103,
    title: '苏州老城漫步：园林与巷弄的诗意',
    content: '漫步在苏州的老城区，青石板路、白墙黛瓦，每一步都是风景。从拙政园到平江路，感受江南水乡的温婉与细腻。',
    images: [getPlaceHolderImage('苏州老城')],
    cityId: 7,
    cityName: '苏州市',
    authorId: 12,
    authorName: '江南墨客',
    createTime: '2024-02-15',
    likeCount: 267,
    collectCount: 98,
    isCollected: true
  },
  {
    id: 104,
    title: '黄山云海日出：大自然的壮丽奇观',
    content: '凌晨四点爬上黄山光明顶，等待日出的那一刻。云海翻涌，霞光万丈，奇松怪石在晨光中若隐若现，宛如仙境。',
    images: [getPlaceHolderImage('黄山日出')],
    cityId: 28,
    cityName: '黄山市',
    authorId: 13,
    authorName: '山野行者',
    createTime: '2024-02-12',
    likeCount: 512,
    collectCount: 234,
    isCollected: true
  },
  {
    id: 105,
    title: '北京胡同散步：老北京的烟火气',
    content: '穿梭在南锣鼓巷的胡同里，看看四合院的门楼，听听老北京的儿化音。走着走着，仿佛穿越回了旧时光。',
    images: [getPlaceHolderImage('北京胡同')],
    cityId: 1,
    cityName: '北京市',
    authorId: 14,
    authorName: '皇城根儿',
    createTime: '2024-02-10',
    likeCount: 189,
    collectCount: 76,
    isCollected: true
  },
  {
    id: 106,
    title: '广州早茶：一盅两件的悠闲时光',
    content: '虾饺、烧卖、凤爪、肠粉...广州的早茶文化博大精深。约上三五好友，一壶普洱茶，几份点心，就是一个惬意的早晨。',
    images: [getPlaceHolderImage('广州早茶')],
    cityId: 15,
    cityName: '广州市',
    authorId: 15,
    authorName: '粤式老饕',
    createTime: '2024-02-08',
    likeCount: 312,
    collectCount: 145,
    isCollected: true
  },
  {
    id: 107,
    title: '西安古城墙骑行：穿越千年的旅程',
    content: '租一辆自行车，在西安古城墙上骑行一圈。城墙下是现代化的城市，城墙上是历史的厚重，这种穿越感太奇妙了。',
    images: [getPlaceHolderImage('西安城墙')],
    cityId: 44,
    cityName: '西安市',
    authorId: 16,
    authorName: '长安旧梦',
    createTime: '2024-02-05',
    likeCount: 278,
    collectCount: 112,
    isCollected: true
  },
  {
    id: 108,
    title: '厦门环岛路骑行：海风与阳光的约会',
    content: '沿着厦门环岛路慢慢骑行，一边是蔚蓝的大海，一边是葱郁的绿植。吹着海风，晒着太阳，时间仿佛都慢了下来。',
    images: [getPlaceHolderImage('厦门环岛')],
    cityId: 30,
    cityName: '厦门市',
    authorId: 17,
    authorName: '海岛旅人',
    createTime: '2024-02-03',
    likeCount: 234,
    collectCount: 89,
    isCollected: true
  },
  {
    id: 109,
    title: '丽江古城夜色：灯火阑珊处的浪漫',
    content: '丽江的夜晚格外迷人，大研古城里灯火通明，小溪潺潺，杨柳依依。找一家酒吧坐下，听着民谣，感受别样的夜生活。',
    images: [getPlaceHolderImage('丽江夜色')],
    cityId: 59,
    cityName: '丽江市',
    authorId: 18,
    authorName: '纳西游子',
    createTime: '2024-02-01',
    likeCount: 367,
    collectCount: 156,
    isCollected: true
  },
  {
    id: 110,
    title: '重庆洪崖洞：现实版千与千寻',
    content: '夜晚的洪崖洞灯火通明，层层叠叠的吊脚楼依山而建，像极了《千与千寻》里的场景。站在千厮门大桥上看过去，美不胜收。',
    images: [getPlaceHolderImage('重庆夜景')],
    cityId: 4,
    cityName: '重庆市',
    authorId: 19,
    authorName: '山城记录者',
    createTime: '2024-01-28',
    likeCount: 445,
    collectCount: 201,
    isCollected: true
  },
  {
    id: 111,
    title: '杭州西湖漫步：苏堤春晓的诗意',
    content: '春天的苏堤最美，杨柳依依，桃花灼灼。漫步在苏堤上，一边是西湖的碧波，一边是葱郁的花木，真是人生一大享受。',
    images: [getPlaceHolderImage('西湖苏堤')],
    cityId: 5,
    cityName: '杭州市',
    authorId: 20,
    authorName: '西湖散人',
    createTime: '2024-01-25',
    likeCount: 298,
    collectCount: 134,
    isCollected: true
  },
  {
    id: 112,
    title: '张家界国家森林公园：阿凡达的奇幻世界',
    content: '走进张家界，就像进入了另一个世界。一根根拔地而起的石柱，云雾缭绕山间，难怪《阿凡达》会选这里取景。',
    images: [getPlaceHolderImage('张家界')],
    cityId: 26,
    cityName: '张家界市',
    authorId: 21,
    authorName: '奇峰探幽',
    createTime: '2024-01-22',
    likeCount: 389,
    collectCount: 178,
    isCollected: true
  }
]

export const useCollectionStore = defineStore('collection', () => {
  const journals = ref<Journal[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchCollections() {
    loading.value = true
    try {
      try {
        const response = await getCollections(1, 100)
        if (response.list && response.list.length > 0) {
          journals.value = response.list
          total.value = response.total
        } else {
          journals.value = mockCollections
          total.value = mockCollections.length
        }
      } catch {
        journals.value = mockCollections
        total.value = mockCollections.length
      }
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    await fetchCollections()
  }

  return {
    journals,
    total,
    loading,
    fetchCollections,
    refresh
  }
})
