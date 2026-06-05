<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const nickname = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  if (!email.value || !password.value || !nickname.value) {
    error.value = '请填写完整信息'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = '两次密码输入不一致'
    return
  }

  if (password.value.length < 6) {
    error.value = '密码至少6位'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.register({
      email: email.value,
      password: password.value,
      nickname: nickname.value
    })
    router.push('/')
  } catch (e) {
    error.value = '注册失败，请重试'
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
        <h1 class="text-2xl font-serif font-semibold text-text-primary">创建账号</h1>
        <p class="text-text-secondary mt-2">开启您的旅行记录之旅</p>
      </div>

      <!-- 注册表单 -->
      <div class="card">
        <form @submit.prevent="handleRegister" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">昵称</label>
            <input
              v-model="nickname"
              type="text"
              placeholder="请输入昵称"
              class="input-field"
            />
          </div>

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
              placeholder="请输入密码（至少6位）"
              class="input-field"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">确认密码</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
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
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <span class="text-text-secondary">已有账号？</span>
          <router-link to="/login" class="link ml-1">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>
