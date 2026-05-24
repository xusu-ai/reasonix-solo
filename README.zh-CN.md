<p align="center">
  <img src="dashboard/dist/logo.png" alt="Reasonix logo" width="200">
</p>
<p align="center"><strong>Reasonix</strong> — DeepSeek 原生 AI 编程助手</p>

<p align="center">
  <img alt="Runtime" src="https://img.shields.io/badge/runtime-Node.js%2022%2B-brightgreen?style=flat-square" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
  <img alt="WebUI" src="https://img.shields.io/badge/WebUI-%E2%9C%93-brightgreen?style=flat-square" />
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a>
</p>

---

## 🎯 项目定位

**Reasonix** 是一个深度优化 DeepSeek 模型特性的 AI 编程助手，专为**服务器端远程运行**和**浏览器编程**场景设计。

| 特性 | 说明 |
|------|------|
| 🌐 **功能齐备的 WebUI** | 完整的 Web 管理界面，随时随地只要有浏览器就能编程 |
| 🖥️ **服务器端运行** | 部署在服务器上，本地无需任何安装，浏览器访问即可 |
| 🟢 **纯 Node.js** | 无需 Bun、无需 Docker，`npm install` 即用 |
| 💻 **老机器完美兼容** | 无 AVX/AVX2 要求，低内存占用，古董 CPU 也能跑 |

---

## 🚀 快速开始

### 环境要求

- **Node.js** 22.0.0 或更高版本
- **npm** 10+

### 安装

```bash
git clone https://gitee.com/xusuai/reasonix.git
cd reasonix
npm install
npm run build
```

### 运行

```bash
# Web 服务模式（推荐 — 远程访问）
node dist/cli/index.js serve --port 9100 --hostname 0.0.0.0

# 打开浏览器访问 http://你的服务器IP:9100 即可开始编程
```

### TUI 交互模式

```bash
npx tsx src/cli/index.ts
```

---

## 🌐 WebUI 界面

Reasonix 内置功能完备的 Web 管理界面，支持：

- 📝 **代码编辑与 AI 对话** — 在浏览器中直接与 AI 协作编程
- 🔄 **实时流式输出** — AI 思考过程和代码生成实时可见
- 📂 **文件浏览器** — 管理服务器上的项目文件
- ⚙️ **模型/Provider 配置** — 在线管理 API Key 和模型参数
- 📊 **缓存命中率监控** — 查看 DeepSeek prompt cache 利用情况

---

## 🏗️ 架构

```
src/
├── cli/         命令行入口（serve/chat/run）
├── core/        核心引擎（CacheFirstLoop、工具调用修复）
├── tools/       工具注册表（代码查询/文件操作/技能）
├── code-query/  代码理解（tree-sitter 符号提取）
├── index/       代码索引（语义分块）
├── memory/      记忆层（写入/召回/前缀组装）
├── tokenizer/   分词器（DeepSeek 原生 tokenizer）
├── react/       TUI 组件（Ink + React）
└── server/      Web 服务（Hono + WebSocket）

dashboard/       Web 管理界面（独立前端）
```

---

## 🔧 老机器兼容性

纯 Node.js 生态，无任何原生编译依赖：

- Intel Core 2 Duo / 旧款 CPU ✅
- 低配 VPS（1核 1G） ✅
- 树莓派 / ARM 设备 ✅
- OpenVZ / LXC 容器 ✅

---

## 📜 许可证

MIT License。详见 [LICENSE](LICENSE)。

---

<p align="center">
  <a href="https://gitee.com/xusuai/reasonix">Gitee 仓库</a>
</p>
