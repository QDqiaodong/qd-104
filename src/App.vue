<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.isLoggedIn && !authStore.user) {
    await authStore.fetchCurrentUser()
  }
})

const showNav = computed(() => route.name !== 'login' && route.name !== 'register')

function goToLogin() {
  router.push('/login')
}

function goToHome() {
  router.push('/')
}

function goToPublish() {
  router.push('/publish')
}

function goToCheckin() {
  router.push('/checkin')
}

function goToProfile() {
  router.push('/profile')
}

function goToCollection() {
  router.push('/collection')
}

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-warm-bg">
    <!-- 顶部导航 -->
    <header v-if="showNav" class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-warm-border">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center cursor-pointer" @click="goToHome">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span class="text-white text-xl font-serif">履</span>
            </div>
            <span class="ml-3 text-xl font-serif font-semibold text-text-primary">旅行足迹</span>
          </div>

          <!-- 导航链接 -->
          <nav class="hidden md:flex items-center space-x-6">
            <router-link to="/" class="text-text-secondary hover:text-primary transition-colors">
              发现
            </router-link>
            <router-link to="/checkin" class="text-text-secondary hover:text-primary transition-colors">
              打卡
            </router-link>
            <router-link to="/collection" class="text-text-secondary hover:text-primary transition-colors">
              收藏
            </router-link>
          </nav>

          <!-- 用户操作 -->
          <div class="flex items-center space-x-4">
            <template v-if="authStore.isLoggedIn">
              <button @click="goToPublish" class="btn-primary text-sm">
                发布游记
              </button>
              <div class="relative group">
                <button class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <span class="text-primary font-medium">{{ authStore.user?.nickname?.[0] || 'U' }}</span>
                </button>
                <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card border border-warm-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div class="p-3 border-b border-warm-border">
                    <p class="font-medium text-text-primary">{{ authStore.user?.nickname }}</p>
                    <p class="text-sm text-text-muted">{{ authStore.user?.email }}</p>
                  </div>
                  <div class="p-2">
                    <button @click="goToProfile" class="w-full text-left px-3 py-2 text-text-secondary hover:text-primary hover:bg-primary-50 rounded-lg transition-colors">
                      个人档案
                    </button>
                    <button @click="handleLogout" class="w-full text-left px-3 py-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <button @click="goToLogin" class="text-text-secondary hover:text-primary transition-colors">
                登录
              </button>
              <button @click="goToHome" class="btn-primary text-sm">
                开始探索
              </button>
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main>
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 底部 -->
    <footer class="mt-20 py-8 bg-white border-t border-warm-border">
      <div class="container mx-auto px-4 text-center">
        <p class="text-text-muted text-sm">
          旅行足迹 - 记录你的每一步 · 纯离线运行 · 守护你的旅行记忆
        </p>
      </div>
    </footer>
  </div>
</template>
