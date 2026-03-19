<script setup lang="ts">
import { computed } from 'vue'
import type { BulletLegendItemInterface } from 'vue-chrts'
import { CurveType, LegendPosition } from 'vue-chrts'
import type { ChartUIToolInvocation } from '../../utils/tools/chart'
import { LineChart } from 'vue-chrts'

/**
 * ToolChart 组件
 * 用于显示图表数据的UI工具组件
 * 
 * 功能说明:
 * - 使用 vue-chrts 库渲染线性图表
 * - 显示多条数据序列（可对比多个数据）
 * - 支持交互式 tooltip（悬停显示详细数据）
 * - 根据加载状态显示不同的UI（加载中/已加载/错误）
 */

const props = defineProps<{
  // invocation 对象包含：state 状态、input 输入参数、output 图表数据输出
  invocation: ChartUIToolInvocation
}>()

/**
 * 根据加载状态计算背景色
 * - 'output-error': 加载失败，使用灰色背景和红色文字
 * - 其他: 加载中或已加载，使用灰色背景
 */
const color = computed(() => {
  return ({
    'output-error': 'bg-muted text-error'
  })[props.invocation.state as string] || 'bg-muted text-white'
})

/**
 * 根据加载状态计算显示的图标
 * - 'input-available': 线性图表图标（加载中）
 * - 'output-error': 警告三角形图标（错误）
 * - 其他: 加载中旋转图标
 */
const icon = computed(() => {
  return ({
    'input-available': 'i-lucide-line-chart',
    'output-error': 'i-lucide-triangle-alert'
  })[props.invocation.state as string] || 'i-lucide-loader-circle'
})

/**
 * 根据加载状态计算显示的提示文本
 */
const message = computed(() => {
  return ({
    'input-available': '正在生成图表...',
    'output-error': '无法生成图表，请重试'
  })[props.invocation.state as string] || '正在加载图表数据...'
})

/**
 * X 轴标签格式化函数
 * 用于将数据中的 X 轴值转换为可读的字符串显示
 * @param invocation - 图表数据对象
 * @returns 格式化函数，接收 tick 索引，返回格式化后的标签
 */
const xFormatter = (invocation: ChartUIToolInvocation) => {
  return (tick: number): string => {
    if (!invocation.output?.data[tick]) return ''
    return String(invocation.output.data[tick][invocation.output.xKey] ?? '')
  }
}

/**
 * 获取图表数据序列的类别配置
 * 用于图表图例显示每条数据线的名称和颜色
 * @param invocation - 图表数据对象
 * @returns 键值对对象，每个序列有名称和颜色配置
 */
const categories = (invocation: ChartUIToolInvocation): Record<string, BulletLegendItemInterface> => {
  if (!invocation.output?.series) return {}
  return invocation.output.series.reduce((acc: Record<string, BulletLegendItemInterface>, serie: { key: string, name: string, color: string }) => {
    acc[serie.key] = {
      name: serie.name,
      color: serie.color
    }
    return acc
  }, {} as Record<string, BulletLegendItemInterface>)
}

/**
 * 格式化数值显示
 * 用于在 tooltip 中以可读的格式显示数据
 * - 整数添加千位分隔符
 * - 小数保留最多2位
 * @param value - 待格式化的值
 * @returns 格式化后的字符串
 */
const formatValue = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '暂无数据'
  if (typeof value === 'string') return value

  if (Number.isInteger(value)) {
    return value.toLocaleString()
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}
</script>

<template>
  <!-- 数据已加载 - 显示图表 -->
  <div
    v-if="invocation.state === 'output-available'"
    class="my-5"
  >
    <!-- 图表标题（可选） -->
    <div
      v-if="invocation.output.title"
      class="flex items-center gap-2 mb-2"
    >
      <!-- 图表标题图标 -->
      <UIcon
        name="i-lucide-line-chart"
        class="size-5 text-primary shrink-0"
      />
      <div class="min-w-0">
        <h3 class="text-lg font-semibold truncate">
          {{ invocation.output.title }}
        </h3>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="relative overflow-hidden">
      <!-- 背景装饰（点阵图案） -->
      <div class="dot-pattern h-full -top-5 left-0 right-0" />

      <!-- 线性图表主体 -->
      <LineChart
        :height="300"
        :data="invocation.output.data"
        :categories="categories(invocation)"
        :x-formatter="xFormatter(invocation)"
        :x-label="invocation.output.xLabel"
        :y-label="invocation.output.yLabel"
        :y-grid-line="true"
        :curve-type="CurveType.MonotoneX"
        :legend-position="LegendPosition.TopRight"
        :hide-legend="false"
        :x-num-ticks="Math.min(6, invocation.output.data.length)"
        :y-num-ticks="5"
        :show-tooltip="true"
      >
        <!-- 自定义 tooltip 显示 - 悬停时显示详细数据 -->
        <template #tooltip="{ values }">
          <div class="bg-muted/50 rounded-sm px-2 py-1 shadow-lg backdrop-blur-sm max-w-xs ring ring-offset-2 ring-offset-(--ui-bg) ring-default border border-default">
            <!-- X轴标签 -->
            <div
              v-if="values && values[invocation.output.xKey]"
              class="text-sm font-semibold text-highlighted mb-2"
            >
              {{ values[invocation.output.xKey] }}
            </div>
            <!-- 数据序列列表 -->
            <div class="space-y-1.5">
              <div
                v-for="serie in invocation.output.series"
                :key="serie.key"
                class="flex items-center justify-between gap-3"
              >
                <!-- 序列名称和颜色指示器 -->
                <div class="flex items-center gap-2 min-w-0">
                  <div
                    class="size-2.5 rounded-full shrink-0"
                    :style="{ backgroundColor: serie.color }"
                  />
                  <span class="text-sm text-muted truncate">{{ serie.name }}</span>
                </div>
                <!-- 格式化后的数值 -->
                <span class="text-sm font-semibold text-highlighted shrink-0">
                  {{ formatValue(values?.[serie.key]) }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </LineChart>
    </div>
  </div>

  <!-- 加载中或错误状态 -->
  <div
    v-else
    class="rounded-xl px-5 py-4 my-5"
    :class="color"
  >
    <div class="flex items-center justify-center h-44">
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

<style>
:root {
  --vis-tooltip-padding: 0 !important;
  --vis-tooltip-background-color: transparent !important;
  --vis-tooltip-border-color: transparent !important;

  --vis-axis-grid-color: rgba(255, 255, 255, 0) !important;
  --vis-axis-tick-label-color: var(--ui-text-muted) !important;
  --vis-axis-label-color: var(--ui-text-toned) !important;
  --vis-legend-label-color: var(--ui-text-muted) !important;

  --dot-pattern-color: #111827;
}

.dark {
  --dot-pattern-color: #9ca3af;
}

.dot-pattern {
  position: absolute;
  background-image: radial-gradient(var(--dot-pattern-color) 1px, transparent 1px);
  background-size: 7px 7px;
  background-position: -8.5px -8.5px;
  opacity: 20%;
  mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 1), transparent 75%);
}
</style>
