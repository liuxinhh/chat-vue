import { isToday, isYesterday, subMonths } from 'date-fns'
import { computed, ref } from 'vue'
import { apiClient } from '../api/client'

interface Chat {
  id: string
  label: string
  icon: string
  createdAt: string
  to?: string
}

export const useChats = () => {
  const chats = ref<Chat[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchChats = async () => {
    loading.value = true
    error.value = null

    try {
      const data = await apiClient.get<any[]>('/api/chats')
      chats.value = data.map((chat: any) => ({
        id: chat.id,
        label: chat.title || '未命名对话',
        to: `/chat/${chat.id}`,
        icon: 'i-lucide-message-circle',
        createdAt: chat.createdAt || new Date().toISOString()
      }))
    } catch (err) {
      console.error('获取聊天列表失败:', err)
      error.value = '获取聊天列表失败'
      chats.value = []
    } finally {
      loading.value = false
    }
  }

  const groups = computed(() => {
    // Group chats by date
    const today: Chat[] = []
    const yesterday: Chat[] = []
    const lastWeek: Chat[] = []
    const lastMonth: Chat[] = []
    const older: Record<string, Chat[]> = {}

    const oneWeekAgo = subMonths(new Date(), 0.25) // ~7 days ago
    const oneMonthAgo = subMonths(new Date(), 1)

    chats.value?.forEach((chat) => {
      const chatDate = new Date(chat.createdAt)

      if (isToday(chatDate)) {
        today.push(chat)
      } else if (isYesterday(chatDate)) {
        yesterday.push(chat)
      } else if (chatDate >= oneWeekAgo) {
        lastWeek.push(chat)
      } else if (chatDate >= oneMonthAgo) {
        lastMonth.push(chat)
      } else {
        // Format: "January 2023", "February 2023", etc.
        const monthYear = chatDate.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        })

        if (!older[monthYear]) {
          older[monthYear] = []
        }

        older[monthYear].push(chat)
      }
    })

    // Sort older chats by month-year in descending order (newest first)
    const sortedMonthYears = Object.keys(older).sort((a, b) => {
      const dateA = new Date(a)
      const dateB = new Date(b)
      return dateB.getTime() - dateA.getTime()
    })

    // Create formatted groups for navigation
    const formattedGroups = [] as Array<{
      id: string
      label: string
      items: Array<Chat>
    }>

    // Add groups that have chats
    if (today.length) {
      formattedGroups.push({
        id: 'today',
        label: 'Today',
        items: today
      })
    }

    if (yesterday.length) {
      formattedGroups.push({
        id: 'yesterday',
        label: 'Yesterday',
        items: yesterday
      })
    }

    if (lastWeek.length) {
      formattedGroups.push({
        id: 'last-week',
        label: 'Last week',
        items: lastWeek
      })
    }

    if (lastMonth.length) {
      formattedGroups.push({
        id: 'last-month',
        label: 'Last month',
        items: lastMonth
      })
    }

    // Add each month-year group
    sortedMonthYears.forEach((monthYear) => {
      if (older[monthYear]?.length) {
        formattedGroups.push({
          id: monthYear,
          label: monthYear,
          items: older[monthYear]
        })
      }
    })

    return formattedGroups
  })

  const createChat = async (input: string) => {
    try {
      const response = await apiClient.post('/api/chats', { input })
      await fetchChats()
      return response.id
    } catch (err) {
      console.error('创建聊天失败:', err)
      throw err
    }
  }

  const deleteChat = async (id: string) => {
    try {
      await apiClient.delete(`/api/chats/${id}`)
      chats.value = chats.value.filter(chat => chat.id !== id)
    } catch (err) {
      console.error('删除聊天失败:', err)
      throw err
    }
  }

  const getChat = async (id: string) => {
    const response = await apiClient.get(`/api/chats/${id}`)
    return response
  }

  return {
    groups,
    chats,
    loading,
    error,
    fetchChats,
    createChat,
    deleteChat,
    getChat
  }
}
