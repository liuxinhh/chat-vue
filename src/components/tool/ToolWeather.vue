<script setup lang="ts">
import { computed } from 'vue'
import type { WeatherUIToolInvocation } from '../../utils/tools/weather'

/**
 * ToolWeather 组件
 * 用于显示天气数据的UI工具组件
 * 
 * 功能说明:
 * - 显示实时天气信息（温度、地点、湿度、风速等）
 * - 显示每日天气预报
 * - 根据加载状态显示不同的UI（加载中/已加载/错误）
 * - 支持深色/浅色主题
 */

const props = defineProps<{
  // invocation 对象包含：state 状态、input 输入参数、output 天气数据输出
  invocation: WeatherUIToolInvocation
}>()

/**
 * 根据加载状态计算卡片背景色
 * - 'output-available': 天气数据已加载，使用蓝色渐变背景
 * - 'output-error': 加载失败，使用灰色背景和红色文字
 * - 其他: 加载中，使用灰色背景
 */
const color = computed(() => {
  return ({
    'output-available': 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 dark:from-sky-500 dark:via-blue-600 dark:to-indigo-700 text-white',
    'output-error': 'bg-muted text-error'
  })[props.invocation.state as string] || 'bg-muted text-white'
})

/**
 * 根据加载状态计算显示的图标
 * - 'input-available': 云太阳图标（加载中）
 * - 'output-error': 警告三角形图标（错误）
 * - 其他: 加载中旋转图标
 */
const icon = computed(() => {
  return ({
    'input-available': 'i-lucide-cloud-sun',
    'output-error': 'i-lucide-triangle-alert'
  })[props.invocation.state as string] || 'i-lucide-loader-circle'
})

/**
 * 根据加载状态计算显示的提示文本
 */
const message = computed(() => {
  return ({
    'input-available': '正在加载天气数据...',
    'output-error': '无法获取天气数据，请稍后重试'
  })[props.invocation.state as string] || '正在加载天气数据...'
})
</script>

<template>
  <div
    class="rounded-xl px-5 py-4 my-5"
    :class="color"
  >
    <!-- 天气数据已加载 - 显示详细的天气信息 -->
    <template v-if="invocation.state === 'output-available'">
      <!-- 顶部：温度和地点信息 -->
      <div class="flex items-start justify-between mb-3">
        <!-- 显示当前温度（左侧） -->
        <div class="flex items-baseline">
          <span class="text-4xl font-bold">{{ invocation.output.temperature }}°</span>
          <span class="text-base text-white/80">℃</span>
        </div>
        <!-- 显示地点和高低温（右侧） -->
        <div class="text-right">
          <div class="text-base font-medium mb-1">
            {{ invocation.output.location }}
          </div>
          <div class="text-xs text-white/70">
            高:{{ invocation.output.temperatureHigh }}° 低:{{ invocation.output.temperatureLow }}°
          </div>
        </div>
      </div>

      <!-- 中部：天气条件、湿度、风速 -->
      <div class="flex items-center justify-between mb-4">
        <!-- 天气情况（左侧：图标+文字） -->
        <div class="flex items-center gap-2">
          <UIcon
            :name="invocation.output.condition.icon"
            class="size-6 text-white"
          />
          <div class="text-sm font-medium">
            {{ invocation.output.condition.text }}
          </div>
        </div>

        <!-- 湿度和风速（右侧） -->
        <div class="flex gap-3 text-xs">
          <!-- 湿度信息 -->
          <div class="flex items-center gap-1">
            <UIcon
              name="i-lucide-droplets"
              class="size-3 text-blue-200"
            />
            <span>湿度:{{ invocation.output.humidity }}%</span>
          </div>
          <!-- 风速信息 -->
          <div class="flex items-center gap-1">
            <UIcon
              name="i-lucide-wind"
              class="size-3 text-blue-200"
            />
            <span>风速:{{ invocation.output.windSpeed }} km/h</span>
          </div>
        </div>
      </div>

      <!-- 底部：7日天气预报 -->
      <div
        v-if="invocation.output.dailyForecast.length > 0"
        class="flex items-center justify-between"
      >
        <!-- 循环显示每日预报 -->
        <div
          v-for="(forecast, index) in invocation.output.dailyForecast"
          :key="index"
          class="flex flex-col items-center gap-1.5"
        >
          <!-- 日期 -->
          <div class="text-xs text-white/70 font-medium">
            {{ forecast.day }}
          </div>

          <!-- 天气图标 -->
          <UIcon
            :name="forecast.condition.icon"
            class="size-5 text-white"
          />
          <!-- 高低温 -->
          <div class="text-xs font-medium">
            <div>
              {{ forecast.high }}°
            </div>
            <div class="text-white/60">
              {{ forecast.low }}°
            </div>
          </div>
        </div>
      </div>

      <!-- 没有预报数据的提示 -->
      <div
        v-else
        class="flex items-center justify-center py-3"
      >
        <div class="text-xs">
          暂无预报数据
        </div>
      </div>
    </template>

    <!-- 加载中或错误状态 -->
    <div
      v-else
      class="flex items-center justify-center h-44"
    >
      <div class="text-center">
        <!-- 根据状态显示不同的图标，加载中时旋转 -->
        <UIcon
          :name="icon"
          class="size-8 mx-auto mb-2"
          :class="[invocation.state === 'input-streaming' && 'animate-spin']"
        />
        <!-- 显示提示文本 -->
        <div class="text-sm">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>
