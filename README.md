# Inno Agent

沙箱管理器 UI，用于创建、启动和运行自主代理环境。使用 **Zitadel** 进行身份验证（BFF 模式），前端为 React/Vite，后端为 Express 5。

## 快速开始

### 前置条件

- Node.js ≥ 18
- pnpm
- Zitadel 实例（用于身份验证）

### 安装

```bash
# 安装所有依赖（workspace）
pnpm install

# 或单独安装后端依赖
cd auth-backend && npm install
```

### 环境变量

复制 `.env.example` 为 `.env` 并填写：

```bash
cp .env.example .env
```

| 变量 | 说明 |
|---|---|
| `ZITADEL_ISSUER` | Zitadel 地址（默认 `http://inno.localhost`） |
| `ZITADEL_CLIENT_ID` | OIDC 客户端 ID |
| `ZITADEL_LOGIN_REDIRECT_URI` | 后端 OIDC 回调地址 |
| `ZITADEL_SERVICE_PAT` | 服务账号 Personal Access Token |
| `AUTH_BACKEND_PORT` | 后端端口（默认 3000） |
| `VITE_API_BASE` | 前端 API 基础地址（空 = 同源代理） |
| `VITE_INNO_AGENT_WORKSPACE_URL_TEMPLATE` | 沙箱工作区 URL 模板（`{sandboxId}` 占位符） |

### 启动开发环境

```bash
# 同时启动前端和后端
pnpm dev:all

# 或分别启动
pnpm dev          # 前端 → http://localhost:3001
pnpm dev:server   # 后端 → http://localhost:3000
```

### 构建

```bash
pnpm build     # 生产构建
pnpm preview   # 预览构建产物
pnpm lint      # TypeScript 类型检查
```

## 项目结构

```
├── inno-agent-frontend/    # React/Vite 前端
│   ├── src/
│   │   ├── api/            # API 客户端（auth、innoAgent）
│   │   ├── components/     # 页面组件（Login、Register、Loading、ServiceMock）
│   │   ├── i18n/           # 国际化（i18next，默认中文）
│   │   ├── App.tsx         # 根组件，屏幕状态机
│   │   └── types.ts        # TypeScript 类型定义
│   ├── vite.config.ts      # Vite 配置（代理、路径别名）
│   └── package.json
├── auth-backend/           # Express 5 后端
│   └── src/
│       ├── routes/auth.ts  # 认证路由（登录/注册/登出）
│       ├── middleware/     # Bearer token 验证
│       └── services/      # Zitadel API 调用
└── pnpm-workspace.yaml    # monorepo workspace 配置
```

## 架构

### 认证流程（Zitadel BFF）

```
浏览器 → POST /auth/password → 后端 (:3000) → Zitadel Session API + OIDC → 返回 tokens
```

后端执行完整的 OIDC Authorization Code + PKCE 流程，返回 `access_token`、`refresh_token`、`id_token`。前端存储在 `localStorage`。

### 屏幕状态机

`App.tsx` 通过 `useState<Screen>` 驱动四个屏幕：

**LOGIN** → **LOADING** → **SERVICE**

- 登录/注册成功后进入加载页，启动沙箱
- 沙箱就绪后嵌入 iframe 工作区
- 每 60 秒发送 TTL 心跳保活

### 国际化

使用 `i18next` + `react-i18next`，默认中文，英文作为回退。翻译文件在 `src/i18n/locales/`。

切换语言：`i18n.changeLanguage('en')`
