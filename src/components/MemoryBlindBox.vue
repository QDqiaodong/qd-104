<script setup lang="ts">
import { computed } from 'vue'
import type { CityMemory } from '@/composables/useMemoryBlindbox'

interface Props {
  visible: boolean
  memory: CityMemory | null
  isRevealing?: boolean
  hasMemories?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isRevealing: false,
  hasMemories: true
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'draw'): void
}>()

const travelMethodLabels: Record<string, string> = {
  plane: '✈️ 飞机',
  train: '🚄 火车',
  car: '🚗 自驾',
  walk: '🚶 步行',
  other: '🎒 其他'
}

const travelMethodText = computed(() => {
  if (!props.memory?.travelMethod) return ''
  return travelMethodLabels[props.memory.travelMethod] || props.memory.travelMethod
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="emit('close')">
        <Transition name="scale">
          <div v-if="visible" class="relative w-full max-w-sm">
            <button
              class="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors z-10"
              @click="emit('close')"
            >
              <span class="text-xl">✕</span>
            </button>

            <div v-if="!hasMemories" class="card text-center py-12">
              <div class="text-6xl mb-4">📭</div>
              <h3 class="text-xl font-serif font-bold text-text-primary mb-2">还没有旅行记忆</h3>
              <p class="text-text-secondary mb-6">快去打卡你的第一座城市吧</p>
              <button class="btn-primary" @click="emit('close')">知道啦</button>
            </div>

            <div v-else-if="!memory || isRevealing" class="blind-box-card">
              <div class="blind-box-inner" :class="{ 'is-revealing': isRevealing }">
                <div class="text-center py-12">
                  <div class="text-7xl mb-6 animate-bounce">🎁</div>
                  <h3 class="text-xl font-serif font-bold text-white mb-2">城市记忆盲盒</h3>
                  <p class="text-white/70 mb-6">随机翻开一段旅行回忆</p>
                  <button class="btn-primary bg-white text-primary hover:bg-white/90" @click="emit('draw')">
                    开启盲盒
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="memory-card">
              <div class="memory-card-header">
                <span class="text-2xl">✨</span>
                <span class="text-sm font-medium text-white/80">随机重逢</span>
              </div>

              <div class="memory-card-body">
                <h3 class="memory-title">{{ memory.memoryTitle }}</h3>

                <div class="memory-divider"></div>

                <div class="memory-info">
                  <div class="memory-info-item">
                    <span class="memory-info-icon">📍</span>
                    <div>
                      <p class="text-sm text-text-secondary">目的地</p>
                      <p class="font-medium text-text-primary">{{ memory.cityName }}</p>
                    </div>
                  </div>

                  <div class="memory-info-item">
                    <span class="memory-info-icon">🏞️</span>
                    <div>
                      <p class="text-sm text-text-secondary">地点</p>
                      <p class="font-medium text-text-primary">{{ memory.location }}</p>
                    </div>
                  </div>

                  <div class="memory-info-item">
                    <span class="memory-info-icon">📅</span>
                    <div>
                      <p class="text-sm text-text-secondary">日期</p>
                      <p class="font-medium text-text-primary">{{ memory.date }}</p>
                    </div>
                  </div>

                  <div v-if="travelMethodText" class="memory-info-item">
                    <span class="memory-info-icon">🚀</span>
                    <div>
                      <p class="text-sm text-text-secondary">出行方式</p>
                      <p class="font-medium text-text-primary">{{ travelMethodText }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="memory-card-footer">
                <button class="btn-outline flex-1" @click="emit('close')">收起回忆</button>
                <button class="btn-primary flex-1" @click="emit('draw')">
                  再抽一次
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.blind-box-card {
  background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F59E0B 100%);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.4);
}

.blind-box-inner {
  position: relative;
}

.blind-box-inner.is-revealing {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0) rotate(0); }
  25% { transform: translateX(-10px) rotate(-2deg); }
  75% { transform: translateX(10px) rotate(2deg); }
}

.memory-card {
  background: linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 100%);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.25);
}

.memory-card-header {
  background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.memory-card-body {
  padding: 28px 24px;
}

.memory-title {
  font-family: 'Georgia', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #581C87;
  text-align: center;
  line-height: 1.4;
  margin-bottom: 20px;
}

.memory-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, #C4B5FD, transparent);
  margin-bottom: 20px;
}

.memory-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.memory-info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.memory-info-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.memory-card-footer {
  padding: 16px 24px 24px;
  display: flex;
  gap: 12px;
}
</style>
