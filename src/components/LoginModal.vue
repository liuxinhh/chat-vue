<script setup lang="ts">
import * as z from 'zod'
import { useUserSession } from '../composables/useUserSession'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { ref } from 'vue';

const emit = defineEmits<{
  success: []
}>()

const { login } = useUserSession()

// 控制 validation 插槽是否显示
const error = ref('')
const toast = useToast()

// 1. 定义字段
const fields: AuthFormField[] = [{
  name: 'username',
  type: 'input',
  label: '用户名',
  placeholder: '请输入用户名',
  required: true
}, {
  name: 'password',
  type: 'password',
  label: '密码',
  placeholder: '请输入密码',
  required: true
}, {
  name: 'remember',
  type: 'checkbox',
  label: '记住我'
}]

// 3. Zod 校验 schema
const schema = z.object({
  username: z.string('请输入用户名'),
  password: z.string('请输入密码').min(8, '密码长度至少为 8 个字符')
})

type Schema = z.output<typeof schema>

// 4. 提交处理
async function handleLogin(payload: FormSubmitEvent<Schema>) {
  error.value = ''
  try {
    const success = await login(payload.data.username, payload.data.password)
    if (success) {
      // 等待一下让状态更新
            toast.add({
        title: '登录成功',
        description: '欢迎回来',
        icon: 'i-lucide-check-circle',
        color: 'green'
      })
      await new Promise(resolve => setTimeout(resolve, 500))
      emit('success')
    } else {
      error.value = '用户名或密码错误'
    }
  } catch (err) {
    console.error(err)
    error.value = '用户名或密码错误'
  }
}
</script>

<template>
  <UAuthForm
    :schema="schema"
    loading-auto
    description="输入邮箱和密码登录"
    :fields="fields"
    @submit="handleLogin"
  >
    <template
      v-if="error"
      #validation
    >
      <UAlert
        color="error"
        icon="i-lucide-circle-x"
        :title="error"
      />
    </template>
  </UAuthForm>
</template>
