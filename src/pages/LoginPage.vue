<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = '请填写完整信息'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.login({ email: email.value, password: password.value })
    const redirect = route.query.redirect as string || '/'
    router.push(redirect)
  } catch (e) {
    error.value = '邮箱或密码错误'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-warm-bg flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
          <span class="text-white text-3xl font-serif">履</span>
        </div>
        <h1 class="text-2xl font-serif font-semibold text-text-primary">欢迎回来</h1>
        <p class="text-text-secondary mt-2">登录您的旅行足迹账号</p>
      </div>

      <!-- 登录表单 -->
      <div class="card">
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">邮箱</label>
            <input
              v-model="email"
              type="email"
              placeholder="请输入邮箱"
              class="input-field"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">密码</label>
            <input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              class="input-field"
            />
          </div>

          <div v-if="error" class="text-red-500 text-sm text-center">
            {{ error }}
          </div>

          <button
            type="submit"
            class="btn-primary w-full"
            :disabled="loading"
          >
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <span class="text-text-secondary">还没有账号？</span>
          <router-link to="/register" class="link ml-1">立即注册</router-link>
        </div>
      </div>

      <!-- 演示账号提示 -->
      <div class="mt-6 p-4 bg-primary-50 rounded-xl text-center">
        <p class="text-primary-600 text-sm">
          演示模式：输入任意邮箱密码即可登录
        </p>
      </div>
    </div>
  </div>
</template>
