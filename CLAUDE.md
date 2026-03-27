# CLAUDE.md

该文件为 Claude Code（claude.ai/code）在此仓库中工作时提供指导。

## 构建、代码检查与开发命令

```bash
pnpm install        # 安装依赖
pnpm dev            # 在 http://localhost:3000 启动开发服务器
pnpm build          # 生产环境构建
pnpm build:prod     # 以生产模式构建
pnpm build:dev      # 以开发模式构建
pnpm preview        # 本地预览生产构建
pnpm run lint       # 运行 ESLint 检查
pnpm run typecheck  # 运行 TypeScript 类型检查
```

## 架构概览

### 技术栈
- **Vue 3 + Vite** 单页应用，使用 `vue-router` 自动路由 + `vite-plugin-vue-layouts` 进行布局组合
- **Nuxt UI** 仪表盘组件作为 UI 框架
- **AI SDK v5**（`@ai-sdk/vue`）处理 AI 流式消息
- **Vercel AI Gateway**（通过 `AI_GATEWAY_API_KEY`）统一访问各 AI 提供商

### 入口文件
`src/main.ts` 负责启动应用：创建路由（调用 `setupLayouts(routes)`）、注册 Nuxt UI 插件、处理路由热更新（HMR）。

### 布局
`src/layouts/default.vue` 定义应用外壳：
- 可折叠侧边栏，包含按日期分组的对话列表
- 搜索命令面板
- 登录弹窗 / 用户菜单
- 主题切换
- 嵌套 `<RouterView />` 渲染页面内容

### 页面
- `src/pages/index.vue` — 新建对话，包含提示词建议
- `src/pages/chat/[id].vue` — 对话详情：加载消息、流式 AI 响应、处理复制/重试/停止，渲染工具调用结果

### API 客户端（`src/api/client.ts`）
基于 `ofetch` 封装的后端请求工具：
- URL 解析：优先使用 `VITE_API_URL`，未设置时默认为 `http://localhost:8049`
- 开发服务器将 `/api` 代理到后端
- 自动注入 `Authorization: Bearer <token>` 请求头
- 处理 401 响应时使用刷新队列，防止并发刷新风暴

### Composables
- `useUserSession` — 登录/登出、会话状态、token 刷新（使用 `createSharedComposable` 实现全局单例）
- `useChats` — 获取、创建、删除对话；按日期分组（今天、昨天、上周、上月、年月）
- `useModels` — 选中的模型存储在 `localStorage` 的 `model` 键下，默认为 `openai/gpt-5-nano`
- `useToken` — 直接读写 `localStorage` 中的 `accessToken` 和 `refreshToken`

### AI 工具
`src/utils/tools/` 中的自定义工具 + `src/components/tool/` 中对应的 UI 组件：
- `weatherTool` + `ToolWeather` — 天气展示，含 5 天预报
- `chartTool` + `ToolChart` — 基于 @unovis/vue 的折线图可视化

### 安全性
- 助手消息通过 Markdown 渲染（XSS 安全）
- 用户消息以纯文本渲染（Vue 自动转义）
- 渲染工具 UI 前需检查 `invocation.state`（loading / content / error 三种状态）

### 类型安全
- `src/route-map.d.ts` 由 `vue-router/vite`（dts 选项）自动生成
- 使用类型化路由：`useRoute<'/chat/[id]'>()` 代替普通的 `useRoute()`
- 路由变更后重启开发服务器，生成文件会同步更新

### 环境变量
- `VITE_API_URL` — 后端 API 基础地址（可选，默认 `http://localhost:8049`）
- `AI_GATEWAY_API_KEY` — Vercel AI Gateway API 密钥（在后端配置）