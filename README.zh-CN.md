<p align="center">
  <img src="dashboard/dist/logo.png" alt="Reasonix-Solo logo" width="200">
</p>
<p align="center"><strong>Reasonix-Solo</strong> — 单网页搞定 AI 编程</p>

<p align="center">
  <img alt="Runtime" src="https://img.shields.io/badge/runtime-Node.js%2022%2B-brightgreen?style=flat-square" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
  <img alt="WebUI" src="https://img.shields.io/badge/WebUI-%E5%8D%95%E7%BD%91%E9%A1%B5-brightgreen?style=flat-square" />
</p>

<p align="center">
  <a href="README.zh-CN.md">简体中文</a> | <a href="README.md">English</a>
</p>

---

## 🎯 项目定位

**Reasonix-Solo** 是一个单网页 AI 编程助手，专为**随时随地浏览器编程**和**服务器端远程运行**打造。

一个网页，搞定一切 —— 不需要安装任何本地工具，打开浏览器就能写代码。

---

## ✨ 核心亮点

| 特性 | 说明 |
|------|------|
| 🌐 **单网页 WebUI** | 一个 HTML 页面搞定全部 AI 编程交互，无需多页面跳转 |
| 🖥️ **服务器端运行，浏览器访问** | 部署在服务器，本地零安装，任何设备打开浏览器就能编程 |
| 🟢 **纯 Node.js 运行** | 无需 Bun、无需 Docker、无需 GPU，`npm install` 即用 |
| 💻 **老机器完美兼容** | 无 AVX/AVX2 要求，低内存占用，1核1G VPS 流畅运行 |

---

## 🚀 快速开始

```bash
git clone https://github.com/xusu-ai/reasonix-solo.git
cd reasonix-solo
npm install
npm run build
node dist/cli/index.js serve --port 9100 --hostname 0.0.0.0
# 浏览器访问 http://服务器IP:9100
```

---

## 🌐 单网页 WebUI 功能

所有功能集中在一个页面：

- 💬 **AI 对话编程** — 左侧对话，右侧代码实时预览
- 📝 **内嵌编辑器** — 直接修改服务器文件
- 🔄 **流式输出** — AI 思考过程实时可见
- 📂 **文件树** — 浏览管理服务器项目文件
- ⚙️ **一键配置** — 模型、API Key 在线管理

---

## 🏗️ 与传统方案对比

| 对比项 | 传统方案 | Reasonix-Solo |
|--------|---------|---------------|
| 安装 | 本地 IDE + 插件 | **一个 Node.js 搞定** |
| 远程编程 | SSH/VSCode Remote | **浏览器访问即可** |
| 客户端 | 每台机器都要装 | **零安装，有浏览器就行** |
| CPU 要求 | 可能需要 AVX/GPU | **老旧 CPU 也流畅** |
| 界面 | 复杂多窗口 | **单网页，清爽简洁** |

---

## 📜 许可证

MIT License。详见 [LICENSE](LICENSE)。

---

<p align="center">
  <a href="https://github.com/xusu-ai/reasonix-solo">GitHub 仓库</a>
</p>
