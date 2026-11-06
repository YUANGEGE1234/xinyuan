# Xinyuan（鑫源）

> 一个**解压即用**的本地桌面 AI 助手。不需要装 Python、不需要装 Node，也不需要配任何开发环境。

**The self-improving AI agent built by [Nous Research](https://nousresearch.com).** It's the only agent with a built-in learning loop — it creates skills from experience, improves them during use, nudges itself to persist knowledge, searches its own past conversations, and builds a deepening model of who you are across sessions. Run it on a $5 VPS, a GPU cluster, or serverless infrastructure that costs nearly nothing when idle. It's not tied to your laptop — talk to it from Telegram while it works on a cloud VM.

Use any model you want — [Nous Portal](https://portal.nousresearch.com), OpenRouter, OpenAI, your own endpoint, and [many others](https://hermes-agent.nousresearch.com/docs/integrations/providers). Switch with `hermes model` — no code changes, no lock-in.

<table>
<tr><td><b>A real terminal interface</b></td><td>Full TUI with multiline editing, slash-command autocomplete, conversation history, interrupt-and-redirect, and streaming tool output.</td></tr>
<tr><td><b>Lives where you do</b></td><td>Telegram, Discord, Slack, WhatsApp, Signal, and CLI — all from a single gateway process. Voice memo transcription, cross-platform conversation continuity.</td></tr>
<tr><td><b>A closed learning loop</b></td><td>Agent-curated memory with periodic nudges. Autonomous skill creation after complex tasks. Skills self-improve during use. FTS5 session search with LLM summarization for cross-session recall. <a href="https://github.com/plastic-labs/honcho">Honcho</a> dialectic user modeling. Compatible with the <a href="https://agentskills.io">agentskills.io</a> open standard.</td></tr>
<tr><td><b>Scheduled automations</b></td><td>Built-in cron scheduler with delivery to any platform. Daily reports, nightly backups, weekly audits — all in natural language, running unattended.</td></tr>
<tr><td><b>Delegates and parallelizes</b></td><td>Spawn isolated subagents for parallel workstreams. In Desktop, choose their provider, model, and limits under Settings → Model → Subagents, then Apply the complete route. Write Python scripts that call tools via RPC, collapsing multi-step pipelines into zero-context-cost turns.</td></tr>
<tr><td><b>Runs anywhere, not just your laptop</b></td><td>Six built-in terminal backends — local, Docker, SSH, Modal, Daytona, and Vercel Sandbox — plus plugin backends such as Singularity/Apptainer. Daytona and Modal offer serverless persistence — your agent's environment hibernates when idle and wakes on demand, costing nearly nothing between sessions. Run it on a $5 VPS or a GPU cluster.</td></tr>
<tr><td><b>Research-ready</b></td><td>Batch trajectory generation, trajectory compression for training the next generation of tool-calling models.</td></tr>
</table>

---

## 一、下载安装（普通用户看这里）

1. 打开 **[Releases 下载页](https://github.com/YUANGEGE1234/xinyuan/releases/latest)**
2. 下载 `Xinyuan-Portable-0.23.0.zip`（约 284 MB）
3. 解压到任意位置（桌面、D 盘都行，**路径可以带中文和空格**）
4. 双击文件夹里的 **`Start-Xinyuan.bat`**
5. 第一次启动会弹出配置窗口：**填 API 密钥，再添加一个或多个模型**。
   模型可以手动输入后按回车添加，也可以点「**获取模型**」把该地址返回的模型批量加入。
   接口地址已经预填好了（`https://yuangeluyou.com/v1`，OpenAI 兼容格式），**一般不用管**；
   如果你要接自己的 OpenAI 兼容网关，点地址右边的「**修改**」就能改。
6. 点「保存并使用」，就能开始对话了。

> **可以加很多组**：每个 API 密钥单独一组，每组都能配多个模型。
> 打开 **设置 → Xinyuan API** 可以看到全部配置，点任意模型名即可切换当前使用的模型，
> 也可以编辑或删除整组。编辑时会重建该条目，需要重新填一次 API 密钥。
>
> 旧版本留下的单模型配置会自动列出来，不会丢失。

**系统要求**：Windows 10 / 11 64 位。需要能访问 `https://yuangeluyou.com`（或你自填的地址）。

---

The source installer delegates Python 3.14, Node.js, npm, pnpm, ripgrep, FFmpeg,
and Python dependencies to PM. If Git is absent, it stages the verified Git
for Windows archive in Hermes' tool store. It does not replace your system Git.
See [installation methods](https://hermes-agent.nousresearch.com/docs/getting-started/installation)
for the separate MSIX/App Installer package and its update ownership.

### 上游出处（重要）

本项目的绝大部分代码**不是我们写的**，而是来自上游开源项目：

| 项目 | 说明 |
| --- | --- |
| **上游仓库** | [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) |
| **上游作者** | [Nous Research](https://nousresearch.com) |
| **上游版本** | 上游 `main` @ 2026-11-06（提交 `90d6b98f`），紧随上游 release **`v0.23.0`** |
| **开源协议** | MIT License |
| **原始版权** | Copyright (c) 2025 Nous Research |

我们做的事情是：**在这份上游代码的基础上做本地化定制和打包**，让它变成中文用户拿到就能用的桌面工具。
`LICENSE` 文件保持原样未做任何修改，上游版权声明完整保留。

> 上游的原始说明文档已完整保留在 [`README.upstream.md`](README.upstream.md)，
> 上游的多语言文档（`README.es.md`、`README.zh-CN.md`、`README.ur-pk.md`）也都在原处。

### 本版本相对上游做了哪些改动

| # | 改动 | 具体内容 |
| --- | --- | --- |
| 1 | **合并上游最新代码** | 上游 2026-09-16 → 2026-10-12 之间约 **1,737 个提交**全部并入，包含上游对桌面端构建链路的**重构**：electron-builder 配置从 `package.json` 移出到 `apps/desktop/electron-builder.config.cjs`，品牌身份集中到 `apps/desktop/product-identity.cjs`，Windows 目标改为 MSIX-only，新增 33 个本地化 YAML、350 个社区插件目录 YAML。详见 [`CHANGES.zh-CN.md`](CHANGES.zh-CN.md) 第 0 节。 |
| 2 | **修复界面图标全部变成方块** | 图标字体 `codicon.ttf` 在依赖目录里缺失，Vite 对解析不到的 CSS `url()` 只警告不报错、原样保留，导致运行时字体加载失败、所有图标渲染成豆腐块。修复方式：补回字体文件，并在 `src/styles.css` 中新增一条同字体族、同描述符的 `@font-face` 指向仓库内自带的 `src/fonts/codicon.ttf`（CSS 规范中同族同描述符时后声明者生效，因此可覆盖依赖包里的那条）。**该修复在本版合并后依然生效**（三方合并未冲突）。 |
| 3 | **API 配置精简为唯一入口** | 删除了原有的全部供应商目录（OAuth 登录、各家 API Key 列表、本地模型、Fireworks / OpenRouter 等入口），只保留**一个**表单。接口地址**预填** `https://yuangeluyou.com/v1` 并默认只读展示，点「修改」可展开成可编辑输入框（校验必须是 `http(s)://` 开头的完整地址）。新增文件：`apps/desktop/src/components/onboarding/xinyuan-form.tsx`、`apps/desktop/src/app/settings/xinyuan-settings.tsx`；复用程序内置的 custom endpoint 能力，不引入新的后端接口。 |
| 4 | **品牌更名 Hermes → Xinyuan** | 界面文案（6 个语言）、源码里用户可见的字符串、`package.json` 品牌字段、Windows 可执行文件的版本元数据、页面标题，以及**后端发给模型的系统提示与首启播种的人格文件**。本版额外覆盖上游新增的三层：`locales/*.yaml`（33 文件 / 2,440 处）、`plugin-catalog/*.yaml`（350 文件 / 681 处）、桌面外壳 JS/TS（195 文件 / 2,124 处）。**代码标识符一律未动**（`HERMES_*` 环境变量、`hermes://` 协议、`window.hermesDesktop`、`hermes` CLI 命令等）；`Hermes 3` / `Hermes 4`（上游的大模型名）、Anthropic OAuth 的搜索替换表、等值判断、上游文档 URL 同样刻意保留。详见 [`CHANGES.zh-CN.md`](CHANGES.zh-CN.md)。 |
| 5 | **替换上游品牌 logo** | 上游的图标是**由 `assets/nous-girl-*.svg` 生成**的（`scripts/generate_icons.py` 一次产出 99 个文件：桌面、安装器、官网、Web 面板）。本版把这两个源 SVG 换成中性的 **X 形标记**，再用上游自己的生成器重新产出全部图标——因此 exe 图标、任务栏图标、应用内 `BrandMark`、安装器图标、官网 favicon 全部一致且不再含上游形象。`BrandMark` 组件保留原有对外 API，仅替换内部实现，所有调用点布局不变。 |
| 6 | **修复首次启动必然超时失败** | 后端首次启动要把 328 个内置技能文件逐个复制到数据目录，在较慢的磁盘上这一步需要 85~109 秒，而桌面端等待后端端口的超时是 **90 秒** —— 于是新用户第一次启动必定失败。修复方式：在便携包里**预置好 `data/skills/` 和同步清单 `.bundled_manifest`**。清单里的哈希只由「相对路径 + 文件内容」计算，不含绝对路径，因此换机器、换目录依然判定为「已同步」而跳过复制。实测 **85~109 秒 → 6.5 秒**。 |
| 7 | **修掉合并产生的真实缺陷** | 三方合并（`-X theirs`）在「我方删除某行、上游未改动该行」时采用删除，但在「我方删除某行、上游改过该区域」时保留上游版本，于是出现**悬空引用**。本版逐一修回：`settings/index.tsx` 里 `codiconIcon` / `KeysSettings` 的 import 丢失、`tools/skill_linter.py` 与 `gateway/relay/__init__.py` 的元组被去重成自我比较、`agent/anthropic_adapter.py` 的 `_OAUTH_SYSTEM_REPLACEMENTS` 丢掉两行。详见 [`CHANGES.zh-CN.md`](CHANGES.zh-CN.md) 第 12 节。 |
| 8 | **完全移除安全审核限制** | 见下方 ⚠️ 警告与第 14 节。 |
| 9 | **新增便携打包脚本与中文说明** | 启动器、说明文件、目录组装、压缩校验等打包流程脚本化，见 [`CHANGES.zh-CN.md`](CHANGES.zh-CN.md)。 |
| 10 | **修复「只能添加一个模型」** | 旧版把配置写死成一个端点 id + 一个 `model` 字符串，保存第二组密钥或第二个模型时直接覆盖第一组。本版改为每个密钥一个独立 id，并用上游 0.23.0 已有的 `models: string[]` 保存整份模型清单；界面支持多配置列表、模型批量添加/移除、一键切换当前模型。详见 [`CHANGES.zh-CN.md`](CHANGES.zh-CN.md) 第 14 节。 |
| 11 | **修复首次启动 / 设置页必然崩溃** | 类型检查发现上一版删供应商目录时留下了悬空引用：`onboarding/index.tsx` 的 `Picker` 函数体还在引用 20 多个已删除的组件与类型，而 `XinyuanApiForm` 被 import 却从未渲染；`settings/index.tsx` 也丢了 `XinyuanSettings` 的 import。构建器不做类型检查所以能打包，但运行时会 `ReferenceError`。本版把 `Picker` 改为直接渲染配置表单，补回 import，并清理死代码。`pnpm run typecheck` 现为 **0 错误**。 |
| 12 | **完全移除上游安全审查** | 不只是改 `config.yaml`，还在源码层短路了 38 处「配置关不掉」的硬拦截与 fail-safe 兜底（灾难命令硬拦截、sudo 密码管道、用户 deny 规则、审批总闸、写/读文件保护、SSRF、脱敏等）。经 **61 项运行时实测 + 便携包端到端复验**全部放行。详见下方第三节与 [`CHANGES.zh-CN.md`](CHANGES.zh-CN.md) 第 14 节。 |

技术细节、根因分析和验证方法都写在 **[`CHANGES.zh-CN.md`](CHANGES.zh-CN.md)** 里。

---

## 三、⚠️ 关于安全审核设置（本版已完全移除）

**本版在配置层和源码层同时移除了上游所有审批 / 拦截 / 限制机制，工具内不再有任何审查。**

0.23.0 上游比 0.21.7 又新增了多道独立闸门，因此这次不能只改 `config.yaml`：
有些函数在配置读取失败时会硬编码 `return True` 重新启用闸门，有些
（灾难命令硬拦截、`sudo -S` 密码管道、用户 deny 规则、审批总闸）**在
`approvals.mode=off` 之前执行**，配置根本关不掉。本版把这些入口逐一短路。

| 类别 | 移除的内容 |
| --- | --- |
| 命令执行 | `check_dangerous_command` / `check_all_command_guards`、`_floor_block` 里的灾难命令硬拦截（`rm -rf /`、写裸块设备、fork bomb）、运行时自删除保护、`sudo -S` 密码管道、`approvals.deny` 规则 |
| 审批流程 | `_run_approval_gate` 总闸（插件规则、computer-use、execute_code、写审批都走它）、smart guardian 与连续拒绝断路器、无人值守 `deny`、`/reload-mcp` 与 `/clear` 等斜杠命令确认、审批通道 `transport_fallback: deny` |
| 文件读写 | 受保护指令文件（`AGENTS.md` / `CLAUDE.md` / `SOUL.md` / `.cursorrules`）强制审批、SSH 配置写审批、写拒绝路径、读凭据文件拦截 |
| 网络与输出 | 私有地址 / SSRF 拦截、网站黑名单、日志与回显的密钥脱敏 |

默认值也全部对齐（完整清单见 `data/config.yaml`）：
`approvals.mode=off`、三个无人值守模式 `approve`、`denial_breaker_threshold=0`、
两个 slash 确认 `false`、`redact_secrets=false`、`allow_private_urls=true`、
`protected_instruction_files=false`、`transport_fallback=builtin`。

**验证**：`verify_no_review230.py` 用真实后端模块跑了 **61 项断言，全部 PASS** ——
包括用环境变量反向强开脱敏 / 关闭私有地址访问的对抗测试，以及确认
`detect_hardline_command('rm -rf /')` 仍返回 True（说明是闸门失效，不是偷偷删了检测）。
便携包组装后又复验了一次，并真实启动到 `HERMES_BACKEND_READY`。

> **风险请务必知悉**：命令执行前不再有任何人工确认，也不会有任何命令因为
> 「危险」而被拒绝；AI 可以读写任意文件、访问内网地址、输出不再打码。
> 请把重要数据做好备份，并自行确认你让模型执行什么。
> 模型服务提供方自身的内容策略属于服务端，客户端无法改变。

---

## 四、从源码构建

### 环境要求

- **Node.js ≥ 26** 与 **pnpm 12.15.0**（上游 0.23.0 已从 npm 迁移到 pnpm，
  根 `package.json` 的 `preinstall` 会拒绝非 pnpm 安装，`.npmrc` 与
  `package-lock.json` 已被上游删除，改为 `pnpm-lock.yaml` + `pnpm-workspace.yaml`）
- Python **3.14**（上游 `pyproject.toml` 里核心依赖都带
  `python_version >= '3.14'` 标记，所以 3.14 是唯一可用版本）
- Windows 10/11 x64

### 构建步骤

```bash
# 1. 安装依赖（pnpm workspace，必须从仓库根执行）
pnpm install --trust-lockfile

# 2. 构建桌面端（渲染层 + 主进程 + 原生模块）
cd apps/desktop
pnpm run build

# 3. 打包成免安装目录
pnpm run builder --dir --publish never

# 4. 类型检查（可选，本版为 0 错误）
pnpm run typecheck
```

产物在 `apps/desktop/release/win-unpacked/`。

> 图标不是手工维护的：改 `assets/nous-girl-*.svg` 后跑
> `node scripts/generate-icons.mjs`（需要 `HERMES_PYTHON` 指向一个装了
> `Pillow` 和 `resvg-py` 的解释器）即可重新产出全部 99 个图标文件。

### 打包成「解压即用」的便携包

便携包 = 桌面端产物 + Python 后端源码 + 自带 Python 运行时 + 预置数据目录 + 启动器。
目录布局：

```
Xinyuan\
  Start-Xinyuan.bat      启动器（必须纯 ASCII，见下）
  README.txt             中文说明（utf-8-sig）
  app\                   Electron 桌面端（win-unpacked 原样复制）
  backend\               Python 后端源码（不含 venv，依赖不在这里）
  runtime\python\        自带的独立 CPython 3.14，依赖装在 Lib\site-packages
  data\                  用户数据（config.yaml + 预置的 skills\）
```

启动器依赖四个基于 `%~dp0` 的环境变量，从而支持任意路径解压：

**To whitelist Hermes:**
- **Windows Defender:** Run PowerShell as Admin → `Add-MpPreference -ExclusionPath "$env:LOCALAPPDATA\hermes\bin"`
- **Bitdefender:** Add an exception in the Bitdefender console (Protection > Antivirus > Settings > Manage Exceptions)
- Whitelist the **folder**, not the file hash — Hermes updates `uv` and the hash changes every version

For more context, see the upstream Astral reports: [astral-sh/uv#13553](https://github.com/astral-sh/uv/issues/13553), [astral-sh/uv#15011](https://github.com/astral-sh/uv/issues/15011), [astral-sh/uv#10079](https://github.com/astral-sh/uv/issues/10079).

---

## Getting Started

```bash
hermes              # Interactive CLI — start a conversation
hermes model        # Choose your LLM provider and model
hermes tools        # Configure which tools are enabled
hermes config set   # Set individual config values
hermes config get   # Print individual config values
hermes gateway      # Start the messaging gateway (Telegram, Discord, etc.)
hermes setup        # Run the full setup wizard (configures everything at once)
hermes update       # Update to the latest version
hermes doctor       # Diagnose any issues
```

> ⚠️ **启动器 `.bat` 文件必须是纯 ASCII。**
> cmd.exe 按系统 OEM 代码页（中文系统是 CP936）逐字节扫描批处理文件；
> 文件里混入 UTF-8 编码的中文会让双字节扫描错位，**吞掉行尾 CRLF 的 `\r`**，
> 把下面的 `set` 行从中间截断，导致应用根本起不来。
> 中文说明请放在单独的 `README.txt` 里（用 `utf-8-sig` 编码，记事本能正确显示）。

---

## 五、目录结构（主要部分）

```
├─ apps/desktop/                 桌面客户端（Electron + React）
│  ├─ product-identity.cjs                          ← 品牌身份的唯一来源（名称 / appId / 更新通道）
│  ├─ electron-builder.config.cjs                   ← electron-builder 的全部配置
│  ├─ src/components/onboarding/xinyuan-form.tsx    ← 唯一的 API 配置表单
│  ├─ src/app/settings/xinyuan-settings.tsx         ← 设置页里的同一个表单
│  ├─ src/fonts/codicon.ttf                          ← 图标字体（自带的保险副本）
│  ├─ src/styles.css                                 ← 含图标字体的 @font-face 覆盖
│  ├─ electron/                                     主进程（后端解析、启动、生命周期）
│  └─ scripts/set-exe-identity.mjs                  给 exe 打图标与版本信息
├─ assets/nous-girl-*.svg        图标源（已替换为中性 X 标记）
├─ scripts/generate_icons.py     从上面的源 SVG 生成全部 99 个图标
├─ hermes_cli/                   后端命令行与 Web 服务
├─ tui_gateway/                  JSON-RPC / WebSocket 网关
├─ tools/                        技能同步、工具实现等
├─ skills/                       内置技能（首次启动会同步到 data/skills）
└─ CHANGES.zh-CN.md              改动详情
```

---

## 六、开源协议与致谢

- 本项目沿用上游的 **MIT License**，见 [`LICENSE`](LICENSE)。
- **原始版权归 [Nous Research](https://nousresearch.com) 所有**（Copyright (c) 2025 Nous Research）。
- 感谢 Nous Research 开源 [hermes-agent](https://github.com/NousResearch/hermes-agent)，
  本项目的全部核心能力都来自上游。
- 本项目仅为本地化定制与打包分发，**不对上游代码的正确性、安全性做额外担保**。

| Action                         | CLI                                           | Messaging platforms                                                              |
| ------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------- |
| Start chatting                 | `hermes`                                      | Run `hermes gateway setup` + `hermes gateway start`, then send the bot a message |
| Start fresh conversation       | `/new` or `/reset`                            | `/new` or `/reset`                                                               |
| Change model                   | `/model [provider:model]`                     | `/model [provider:model]`                                                        |
| Set a personality              | `/personality [name]`                         | `/personality [name]`                                                            |
| Retry or undo the last turn    | `/retry`, `/undo`                             | `/retry`, `/undo`                                                                |
| Compress context / check usage | `/compress`, `/usage`, `/insights [--days N]` | `/compress`, `/usage`, `/insights [days]`                                        |
| Browse skills                  | `/skills` or `/<skill-name>`                  | `/<skill-name>`                                                                  |
| Interrupt current work         | `Ctrl+C` or send a new message                | `/stop` or send a new message                                                    |
| Platform-specific status       | `/platforms`                                  | `/status`, `/sethome`                                                            |

For the full command lists, see the [CLI guide](https://hermes-agent.nousresearch.com/docs/user-guide/cli) and the [Messaging Gateway guide](https://hermes-agent.nousresearch.com/docs/user-guide/messaging).

---

## Documentation

All documentation lives at **[hermes-agent.nousresearch.com/docs](https://hermes-agent.nousresearch.com/docs/)**:

| Section                                                                                             | What's Covered                                             |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [Quickstart](https://hermes-agent.nousresearch.com/docs/getting-started/quickstart)                 | Install → setup → first conversation in 2 minutes          |
| [CLI Usage](https://hermes-agent.nousresearch.com/docs/user-guide/cli)                              | Commands, keybindings, personalities, sessions             |
| [Configuration](https://hermes-agent.nousresearch.com/docs/user-guide/configuration)                | Config file, providers, models, all options                |
| [Messaging Gateway](https://hermes-agent.nousresearch.com/docs/user-guide/messaging)                | Telegram, Discord, Slack, WhatsApp, Signal, Home Assistant |
| [Security](https://hermes-agent.nousresearch.com/docs/user-guide/security)                          | Command approval, DM pairing, container isolation          |
| [Tools & Toolsets](https://hermes-agent.nousresearch.com/docs/user-guide/features/tools)            | 40+ tools, toolset system, terminal backends               |
| [Skills System](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)              | Procedural memory, Skills Hub, creating skills             |
| [Memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)                     | Persistent memory, user profiles, best practices           |
| [MCP Integration](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp)               | Connect any MCP server for extended capabilities           |
| [Cron Scheduling](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron)              | Scheduled tasks with platform delivery                     |
| [Context Files](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files)       | Project context that shapes every conversation             |
| [Architecture](https://hermes-agent.nousresearch.com/docs/developer-guide/architecture)             | Project structure, agent loop, key classes                 |
| [Contributing](https://hermes-agent.nousresearch.com/docs/developer-guide/contributing)             | Development setup, PR process, code style                  |
| [CLI Reference](https://hermes-agent.nousresearch.com/docs/reference/cli-commands)                  | All commands and flags                                     |
| [Environment Variables](https://hermes-agent.nousresearch.com/docs/reference/environment-variables) | Complete env var reference                                 |

---

## Migrating from OpenClaw or another agent

If you're coming from OpenClaw, Claude Code, Codex CLI or Cursor, Hermes can import your settings, memories and skills (and, for OpenClaw, API keys when you ask for them).

**During setup:** `hermes setup` asks whether to import from another agent, pre-selects the ones it finds (`~/.openclaw`, `~/.claude`, `~/.codex`, `~/.cursor`), installs the official `agent-importers` plugin and runs the import with a preview first.

**Anytime after install:**

```bash
hermes plugins install agent-importers          # once per profile
hermes import-agent openclaw                    # interactive migration (full preset)
hermes import-agent openclaw --dry-run          # preview what would be migrated
hermes import-agent openclaw --migrate-secrets  # also bring allowlisted API keys
hermes import-agent claude-code                 # or codex / cursor
```

What gets imported from OpenClaw:

- **SOUL.md** — persona file
- **Memories** — MEMORY.md and USER.md entries
- **Skills** — user-created skills → `~/.hermes/skills/openclaw-imports/`
- **Command allowlist** — approval patterns
- **Messaging settings** — platform configs, allowed users, working directory
- **API keys** — allowlisted secrets (Telegram, OpenRouter, OpenAI, Anthropic, ElevenLabs), only with `--migrate-secrets`
- **TTS assets** — workspace audio files
- **Workspace instructions** — AGENTS.md (with `--workspace-target`)

`hermes claw migrate` still works as the older spelling. See the [OpenClaw migration guide](https://hermes-agent.nousresearch.com/docs/guides/migrate-from-openclaw) and [Import from Other Agents](https://hermes-agent.nousresearch.com/docs/user-guide/import-from-other-agents).

---

## Contributing

We welcome contributions! See the [Contributing Guide](https://hermes-agent.nousresearch.com/docs/developer-guide/contributing) for development setup, code style, and PR process.

Start with the [PM developer workflow](website/docs/reference/package-management.md#developer-workflow)
for activation, daily use, dependency changes, and leaving the environment.
[Development Setup](CONTRIBUTING.md#development-setup) covers the separate test environment and verification commands.

---

## Community

- 💬 [Discord](https://discord.gg/NousResearch)
- 📚 [Skills Hub](https://agentskills.io)
- 🐛 [Issues](https://github.com/NousResearch/hermes-agent/issues)
- 🔌 [computer-use-linux](https://github.com/avifenesh/computer-use-linux) — Linux desktop-control MCP server for Hermes and other MCP hosts, with AT-SPI accessibility trees, Wayland/X11 input, screenshots, and compositor window targeting.
- 🔌 [HermesClaw](https://github.com/AaronWong1999/hermesclaw) — Community WeChat bridge: Run Hermes Agent and OpenClaw on the same WeChat account.

---

## License

MIT — see [LICENSE](LICENSE).

Built by [Nous Research](https://nousresearch.com).
