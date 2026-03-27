<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useRouter, useRoute } from 'vue-router'
import ModalConfirm from '../components/ModalConfirm.vue'
import LoginModal from '../components/LoginModal.vue'
import { useChats } from '../composables/useChats'
import { useUserSession } from '../composables/useUserSession'

const router = useRouter()
const route = useRoute<'/chat/[id]' | '/'>()
const toast = useToast()
const overlay = useOverlay()
const { loggedIn, restoreSession } = useUserSession()
const { chats, fetchChats, deleteChat } = useChats()
const initialized = ref(false)

const openModal = ref(false)

onMounted(async () => {
  await restoreSession()
  await fetchChats()
  initialized.value = true // 标记初始化完成，避免 watch 在首屏重复请求
})

const open = ref(false)

const deleteModal = overlay.create(ModalConfirm, {
  props: {
    title: 'Delete chat',
    description: 'Are you sure you want to delete this chat? This cannot be undone.'
  }
})

function openLoginModal() {
  openModal.value = true
}

watch(loggedIn, async () => {
  // 仅在完成首屏初始化后，再根据登录状态变化刷新列表
  if (!initialized.value) {
    return
  }
  await fetchChats()
})

const items = computed(() => chats.value.map((chat: any) => ({
  label: chat.label,
  to: `/chat/${chat.id}`,
  slot: 'chat' as const,
  id: chat.id,
  class: chat.label === 'Untitled' ? 'text-muted' : ''
})))

async function handleDeleteChat(id: string) {
  const instance = deleteModal.open()
  const result = await instance.result
  if (!result) {
    return
  }

  await deleteChat(id)

  toast.add({
    title: 'Chat deleted',
    description: 'Your chat has been deleted',
    icon: 'i-lucide-trash'
  })

  if ((route as RouteLocationNormalizedLoaded<'/chat/[id]'>).params?.id === id) {
    router.push('/')
  }
}

defineShortcuts({
  c: () => {
    router.push('/')
  }
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      :min-size="12"
      collapsible
      resizable
      class="border-r-0 py-4"
    >
      <template #header="{ collapsed }">
        <ULink
          to="/"
          class="flex items-center gap-0.5"
        >
          <UIcon
            name="i-logos-vue"
            class="h-5 w-auto shrink-0"
          />
          <span
            v-if="!collapsed"
            class="text-xl font-bold text-highlighted"
          >Chat</span>
        </ULink>

        <div
          v-if="!collapsed"
          class="flex items-center gap-1.5 ms-auto"
        >
          <UDashboardSearchButton collapsed />
        </div>
      </template>

      <template #default="{ collapsed }">
        <div class="flex flex-col gap-1.5">
          <UButton
            v-bind="collapsed ? { icon: 'i-lucide-plus' } : { label: 'New chat' }"
            variant="soft"
            block
            to="/"
            @click="open = false"
          />

          <template v-if="collapsed">
            <UDashboardSearchButton collapsed />
          </template>
        </div>

        <UNavigationMenu
          v-if="!collapsed"
          :items="items"
          :collapsed="collapsed"
          orientation="vertical"
          :ui="{ link: 'overflow-hidden' }"
        >
          <template #chat-trailing="{ item }">
            <div class="flex -mr-1.25 translate-x-full group-hover:translate-x-0 transition-transform">
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                class="text-muted hover:text-primary hover:bg-accented/50 focus-visible:bg-accented/50 p-0.5"
                tabindex="-1"
                @click.stop.prevent="handleDeleteChat((item as any).id)"
              />
            </div>
          </template>
        </UNavigationMenu>
      </template>

      <template #footer="{ collapsed }">
        <UModal
          v-model:open="openModal"
          size="md"
          title="登录"
        >
          <UserMenu
            v-if="loggedIn"
            :collapsed="collapsed"
          />
          <UButton
            v-else
            :label="collapsed ? '' : 'Login'"
            icon="i-lucide-log-in"
            color="neutral"
            variant="ghost"
            class="w-full"
            @click="openLoginModal()"
          />
          <template #body>
            <LoginModal @success="openModal = false" />
          </template>
        </UModal>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch
      placeholder="Search chats..."
      :groups="[{
        id: 'links',
        items: [{
          label: 'New chat',
          to: '/',
          icon: 'i-lucide-square-pen'
        }]
      }]"
    />

    <div class="flex-1 flex m-4 lg:ml-0 rounded-lg ring ring-default bg-default/75 shadow min-w-0">
      <RouterView :key="route.path" />
    </div>
  </UDashboardGroup>
</template>
