<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useCheckinStore } from '@/stores/checkin'
import { getCityAliases, getMatchedAlias } from '@/utils/cityAlias'

const props = defineProps<{
  modelValue: number | undefined
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
  (e: 'select', city: any): void
}>()

const checkinStore = useCheckinStore()
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)
const searchKeyword = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(0)

const filteredCities = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) {
    return checkinStore.cities.slice(0, 50)
  }
  
  return checkinStore.cities.filter(city => {
    if (city.name.toLowerCase().includes(keyword)) return true
    if (city.province.toLowerCase().includes(keyword)) return true
    
    const aliases = getCityAliases(city)
    return aliases.some(alias => alias.toLowerCase().includes(keyword))
  })
})

const groupedCities = computed(() => {
  const provinces: { [key: string]: typeof filteredCities.value } = {}
  
  filteredCities.value.forEach(city => {
    if (!provinces[city.province]) {
      provinces[city.province] = []
    }
    provinces[city.province].push(city)
  })
  
  return Object.entries(provinces).map(([province, cities]) => ({
    province,
    cities
  }))
})

const selectedCityName = computed(() => {
  if (!props.modelValue) return ''
  const city = checkinStore.cities.find(c => c.id === props.modelValue)
  return city?.name || ''
})

function handleInputFocus() {
  showDropdown.value = true
  searchKeyword.value = selectedCityName.value
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.select()
    }
  })
}

function handleInputBlur() {
  setTimeout(() => {
    showDropdown.value = false
    if (props.modelValue) {
      searchKeyword.value = selectedCityName.value
    } else {
      searchKeyword.value = ''
    }
  }, 200)
}

function selectCity(city: any) {
  emit('update:modelValue', city.id)
  emit('select', city)
  showDropdown.value = false
  searchKeyword.value = city.name
}

function handleKeydown(e: KeyboardEvent) {
  if (!showDropdown.value) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      showDropdown.value = true
      highlightedIndex.value = 0
    }
    return
  }

  const totalItems = filteredCities.value.length
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, totalItems - 1)
      scrollToHighlighted()
      break
    case 'ArrowUp':
      e.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      scrollToHighlighted()
      break
    case 'Enter':
      e.preventDefault()
      if (filteredCities.value[highlightedIndex.value]) {
        selectCity(filteredCities.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      showDropdown.value = false
      break
  }
}

function scrollToHighlighted() {
  nextTick(() => {
    const items = dropdownRef.value?.querySelectorAll('.city-item')
    if (items && items[highlightedIndex.value]) {
      ;(items[highlightedIndex.value] as HTMLElement).scrollIntoView({
        block: 'nearest'
      })
    }
  })
}

watch(searchKeyword, () => {
  highlightedIndex.value = 0
})

watch(filteredCities, () => {
  highlightedIndex.value = 0
})

onMounted(async () => {
  if (checkinStore.cities.length === 0) {
    await checkinStore.fetchCities()
  }
  if (props.modelValue) {
    searchKeyword.value = selectedCityName.value
  }
})
</script>

<template>
  <div class="relative">
    <div class="relative">
      <input
        ref="inputRef"
        type="text"
        :value="searchKeyword"
        @input="searchKeyword = ($event.target as HTMLInputElement).value"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @keydown="handleKeydown"
        :placeholder="placeholder || '搜索城市，支持别名如「魔都」「蓉城」「姑苏」'"
        class="input-field pr-10"
      />
      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
        🔍
      </span>
    </div>

    <transition name="fade">
      <div
        v-if="showDropdown"
        ref="dropdownRef"
        class="absolute z-50 w-full mt-2 bg-white border border-warm-border rounded-xl shadow-xl max-h-80 overflow-y-auto"
      >
        <div v-if="filteredCities.length === 0" class="px-4 py-8 text-center text-text-muted">
          <div class="text-3xl mb-2">🔍</div>
          <p>未找到匹配的城市</p>
          <p class="text-xs mt-1">试试输入「魔都」「蓉城」「姑苏」等别名</p>
        </div>

        <template v-else>
          <template v-for="group in groupedCities" :key="group.province">
            <div class="px-3 py-2 text-xs font-medium text-text-muted bg-warm-bg/50 sticky top-0">
              {{ group.province }}
            </div>
            <div
              v-for="(city, index) in group.cities"
              :key="city.id"
              class="city-item px-4 py-3 cursor-pointer hover:bg-primary-50 transition-colors border-b border-warm-border/30 last:border-b-0"
              :class="{
                'bg-primary-50': filteredCities[highlightedIndex]?.id === city.id
              }"
              @click="selectCity(city)"
              @mouseenter="highlightedIndex = filteredCities.findIndex(c => c.id === city.id)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-text-primary">
                    {{ city.name }}
                    <span
                      v-if="getMatchedAlias(searchKeyword, city)"
                      class="ml-2 text-xs text-primary bg-primary-100 px-2 py-0.5 rounded-full"
                    >
                      别名：{{ getMatchedAlias(searchKeyword, city) }}
                    </span>
                  </div>
                  <div class="text-xs text-text-muted mt-1">
                    {{ city.province }}
                  </div>
                </div>
                <div v-if="modelValue === city.id" class="text-primary">
                  ✓
                </div>
              </div>
              <div v-if="city.description" class="text-xs text-text-secondary mt-1 line-clamp-1">
                {{ city.description }}
              </div>
            </div>
          </template>
        </template>

        <div v-if="searchKeyword && filteredCities.length > 0" class="px-3 py-2 text-xs text-text-muted bg-warm-bg/30 border-t border-warm-border/50">
          共找到 {{ filteredCities.length }} 个城市
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
