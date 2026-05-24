<p align="center">
  <img src="dashboard/dist/logo.png" alt="Reasonix-Solo" width="200">
</p>
<p align="center"><strong>Reasonix-Solo</strong> — AI Coding in a Single Web Page</p>

<p align="center">
  <img alt="Runtime" src="https://img.shields.io/badge/runtime-Node.js%2022%2B-brightgreen?style=flat-square" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
  <img alt="WebUI" src="https://img.shields.io/badge/WebUI-Single%20Page-brightgreen?style=flat-square" />
</p>

<p align="center">
  <a href="README.zh-CN.md">简体中文</a> | <a href="README.md">English</a>
</p>

---

## 🎯 Overview

**Reasonix-Solo** is a single-page AI coding assistant designed for **remote server deployment** and **browser-based programming**.

One web page. Full AI-powered coding. No local IDE, no plugins, no SSH needed.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🌐 **Single-Page WebUI** | One HTML page handles everything — chat, code, file tree, config |
| 🖥️ **Server-Side, Browser Access** | Deploy once on your server, code from any device with a browser |
| 🟢 **Pure Node.js** | No Bun, no Docker, no GPU — just `npm install` and go |
| 💻 **Old Hardware Compatible** | No AVX/AVX2 required, runs on 1-core 1GB RAM VPS |

---

## 🚀 Quick Start

### Requirements

- **Node.js** 22.0.0 or higher
- **npm** 10+

### Install & Run

```bash
git clone https://github.com/xusu-ai/reasonix-solo.git
cd reasonix-solo
npm install
npm run build

# Start the web server on port 9100
node dist/cli/index.js serve --port 9100 --hostname 0.0.0.0

# Open http://your-server-ip:9100 in your browser — start coding!
```

---

## 🌐 Single-Page WebUI

Everything in one page:

- 💬 **AI Chat + Code** — Chat on the left, code preview on the right
- 📝 **Built-in Editor** — Edit server files directly in the browser
- 🔄 **Streaming Output** — Real-time AI reasoning and code generation
- 📂 **File Tree** — Browse and manage server-side projects
- ⚙️ **One-Click Config** — Manage models, API keys, and providers online
- 📊 **Cache Monitor** — DeepSeek prompt cache hit rate at a glance

---

## 🏗️ Why Reasonix-Solo

| Aspect | Traditional Setup | Reasonix-Solo |
|--------|-----------------|---------------|
| Installation | IDE + plugins + runtimes | **Just Node.js** |
| Remote Work | SSH / VSCode Remote | **Any browser** |
| Client Setup | Install on every machine | **Zero install** |
| CPU Required | May need AVX/GPU | **Vintage CPUs work** |
| UI Complexity | Multi-window IDE | **Single page, clean** |

---

## 🔧 System Requirements

**Minimum:**
- CPU: Any processor supporting Node.js 22 (Intel Core 2 Duo and up)
- RAM: 512MB (1GB recommended)
- Disk: 200MB
- OS: Linux / macOS / Windows

---

## 📜 License

MIT License. See [LICENSE](LICENSE).

---

<p align="center">
  <a href="https://github.com/xusu-ai/reasonix-solo">GitHub Repository</a>
</p>
