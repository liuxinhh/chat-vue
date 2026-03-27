<script setup lang="ts">
import * as z from 'zod'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { ref } from 'vue'
import { useUserSession } from '../composables/useUserSession'

const emit = defineEmits<{
  success: []
}>()

const { login } = useUserSession()

const error = ref('')
const toast = useToast()

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

const schema = z.object({
  username: z.string('请输入用户名'),
  password: z.string('请输入密码').min(8, '密码长度至少为 8 个字符')
})

type Schema = z.output<typeof schema>

async function handleLogin(payload: FormSubmitEvent<Schema>) {
  error.value = ''

  const success = await login(payload.data.username, payload.data.password)
  if (!success) {
    error.value = '用户名或密码错误'
    return
  }

  toast.add({
    title: '登录成功',
    description: '欢迎回来',
    icon: 'i-lucide-check-circle',
    color: 'success'
  })
  emit('success')
}
</script>

<template>
  <UAuthForm
    :schema="schema"
    loading-auto
    description="输入用户名和密码登录"
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
