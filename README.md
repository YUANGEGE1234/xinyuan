# Xinyuan（鑫源）

> 一个**解压即用**的本地桌面 AI 助手。不需要装 Python、不需要装 Node，也不需要配任何开发环境。

本仓库是基于上游开源项目 **Hermes Agent** 改造而来的定制版本，包含完整源码、改造说明和打包脚本。

---

## 一、下载安装（普通用户看这里）

1. 打开 **[Releases 下载页](https://github.com/YUANGEGE1234/xinyuan/releases/latest)**
2. 下载 `Xinyuan-Portable-0.17.3.zip`（约 234 MB）
3. 解压到任意位置（桌面、D 盘都行，**路径可以带中文和空格**）
4. 双击文件夹里的 **`Start-Xinyuan.bat`**
5. 第一次启动会弹出配置窗口，只需要填两样东西：

   | 字段 | 填什么 |
   | --- | --- |
   | **API 密钥** | 你自己的 API Key |
   | **模型名称** | 例如 `gpt-4o-mini`、`claude-sonnet-4` 等 |

   接口地址已经固定好了（`https://yuangeluyou.com/v1`，OpenAI 兼容格式），**不用管也不用改**。
6. 点「保存并使用」，就能开始对话了。

> 想换密钥或换模型：应用里打开 **设置 → Xinyuan API**，同一个表单改一下即可。

**系统要求**：Windows 10 / 11 64 位。需要能访问 `https://yuangeluyou.com`。

---

## 二、这是什么，改动来自哪里

### 上游出处（重要）

本项目的绝大部分代码**不是我们写的**，而是来自上游开源项目：

| 项目 | 说明 |
| --- | --- |
| **上游仓库** | [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) |
| **上游作者** | [Nous Research](https://nousresearch.com) |
| **上游版本** | 桌面端 `0.17.3` |
| **开源协议** | MIT License |
| **原始版权** | Copyright (c) 2025 Nous Research |

我们做的事情是：**在这份上游代码的基础上做本地化定制和打包**，让它变成中文用户拿到就能用的桌面工具。
`LICENSE` 文件保持原样未做任何修改，上游版权声明完整保留。

> 上游的原始说明文档已完整保留在 [`README.upstream.md`](README.upstream.md)，
> 上游的多语言文档（`README.es.md`、`README.zh-CN.md`、`README.ur-pk.md`）也都在原处。

### 本仓库相对上游做了哪些改动

| # | 改动 | 具体内容 |
| --- | --- | --- |
| 1 | **修复界面图标全部变成方块** | 图标字体 `codicon.ttf` 在依赖目录里缺失，Vite 对解析不到的 CSS `url()` 只警告不报错、原样保留，导致运行时字体加载失败、所有图标渲染成豆腐块。修复方式：补回字体文件，并在 `src/styles.css` 中新增一条同字体族、同描述符的 `@font-face` 指向仓库内自带的 `src/fonts/codicon.ttf`（CSS 规范中同族同描述符时后声明者生效，因此可覆盖依赖包里的那条）。 |
| 2 | **API 配置精简为唯一入口** | 删除了原有的全部供应商目录（OAuth 登录、各家 API Key 列表、本地模型、Fireworks / OpenRouter 等入口），只保留**一个**表单。接口地址固定为 `https://yuangeluyou.com/v1`（只读，用户改不了），用户只需填 API 密钥和模型名称。新增文件：`apps/desktop/src/components/onboarding/xinyuan-form.tsx`、`apps/desktop/src/app/settings/xinyuan-settings.tsx`；复用程序内置的 custom endpoint 能力，不引入新的后端接口。 |
| 3 | **品牌更名 Hermes → Xinyuan** | 覆盖 6 个语言的界面文案（共 1037 处）、`src/` 与 `electron/` 下的用户可见字符串（101 个文件、212 处）、`package.json` 的品牌字段、Windows 可执行文件的版本元数据、页面标题，以及**后端发给模型的系统提示与首启播种的人格文件**（`agent/prompt_builder.py`、`hermes_cli/default_soul.py`、`SOUL.md`，合计 2,086 处 / 656 个文件）。**代码标识符一律未动**（`HERMES_*` 环境变量、`hermes://` 协议、`window.hermesDesktop`、`hermes` CLI 命令等），保证功能不受影响；`Hermes 3` / `Hermes 4`（上游的大模型名）、Anthropic OAuth 的搜索替换表、等值判断、上游文档 URL 同样刻意保留。详见 [`CHANGES.zh-CN.md`](CHANGES.zh-CN.md) 第 3、9、10 节。 |
| 4 | **移除上游品牌 logo** | 删除了上游的 logo / 插画 / 精灵图等品牌资源，并用程序生成的中性图标（靛蓝→紫罗兰渐变 + 白色 X）替换应用图标（`icon.png`、`icon.ico`、`apple-touch-icon.png`）与启动动画贴图。`BrandMark` 组件保留了原有的对外 API，仅替换内部实现，因此所有调用点的布局不受影响。 |
| 5 | **修复首次启动必然超时失败** | 后端首次启动要把 328 个内置技能文件逐个复制到数据目录，在较慢的磁盘上这一步需要 85~109 秒，而桌面端等待后端端口的超时是 **90 秒** —— 于是新用户第一次启动必定失败。修复方式：在便携包里**预置好 `data/skills/` 和同步清单 `.bundled_manifest`**。清单里的哈希只由「相对路径 + 文件内容」计算，不含绝对路径，因此换机器、换目录依然判定为「已同步」而跳过复制。实测 **85~109 秒 → 6.5 秒**。 |
| 6 | **新增便携打包脚本与中文说明** | 启动器、说明文件、目录组装、压缩校验等打包流程脚本化，见 [`CHANGES.zh-CN.md`](CHANGES.zh-CN.md)。 |
| 7 | **放宽安全审核限制** | 见下方 ⚠️ 警告。 |

技术细节、根因分析和验证方法都写在 **[`CHANGES.zh-CN.md`](CHANGES.zh-CN.md)** 里。

---

## 三、⚠️ 关于安全审核设置

本版本为了让桌面端能顺畅地在本机执行命令和读写文件，**默认放宽了上游的几项安全限制**
（配置项写在用户数据目录的 `config.yaml` 中）：

| 配置项 | 上游默认 | 本版本 | 影响 |
| --- | --- | --- | --- |
| `approvals.mode` | 需要人工审批 | `'off'` | **执行命令不再询问**，AI 可直接运行 shell 命令 |
| `security.redact_secrets` | `true` | `false` | 日志/回显中**不再自动打码**密钥等敏感串 |
| `security.tirith_enabled` | `true` | `false` | 关闭内置的提示注入检测 |
| `security.allow_private_urls` | `false` | `true` | 允许访问内网 / 私有地址 |

**这意味着 AI 可以在你的电脑上直接执行命令、读写文件，而不会弹窗征求同意。**
如果你在意这一点，请自行编辑 `data/config.yaml` 把 `approvals.mode` 改回 `'ask'`，
或把 `security.*` 那几项恢复成上游默认值。

这是**刻意的取舍**（为了「解压即用」不打扰用户），但请务必知悉风险后再使用。

---

## 四、从源码构建

### 环境要求

- Node.js 22+
- Python 3.11 ~ 3.13（3.14 暂不支持，部分依赖还没出 wheel）
- Windows 10/11 x64

### 构建步骤

```bash
# 1. 安装依赖（npm workspaces，依赖装在仓库根）
npm install

# 2. 构建桌面端（渲染层 + 主进程 + 原生模块）
cd apps/desktop
npm run build

# 3. 打包成免安装目录
npm run builder -- --dir -c.directories.output=release-xinyuan
```

产物在 `apps/desktop/release-xinyuan/win-unpacked/`。

### 打包成「解压即用」的便携包

便携包 = 桌面端产物 + Python 后端源码 + 自带 Python 运行时 + 预置数据目录 + 启动器。
目录布局：

```
Xinyuan\
  Start-Xinyuan.bat      启动器（必须纯 ASCII，见下）
  README.txt             中文说明（utf-8-sig）
  app\                   Electron 桌面端（win-unpacked 原样复制）
  backend\               Python 后端源码 + venv/Lib/site-packages
  runtime\python\        自带的独立 CPython 3.11
  data\                  用户数据（config.yaml + 预置的 skills\）
```

启动器依赖四个基于 `%~dp0` 的环境变量，从而支持任意路径解压：

```
HERMES_HOME                    data\
HERMES_DESKTOP_HERMES_ROOT     backend\
HERMES_DESKTOP_PYTHON          runtime\python\python.exe
HERMES_DESKTOP_USER_DATA_DIR   data\desktop
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
│  ├─ src/components/onboarding/xinyuan-form.tsx    ← 唯一的 API 配置表单
│  ├─ src/app/settings/xinyuan-settings.tsx         ← 设置页里的同一个表单
│  ├─ src/fonts/codicon.ttf                          ← 图标字体（自带的保险副本）
│  ├─ src/styles.css                                 ← 含图标字体的 @font-face 覆盖
│  ├─ electron/                                     主进程（后端解析、启动、生命周期）
│  └─ scripts/set-exe-identity.mjs                  给 exe 打图标与版本信息
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

如果你要基于本项目继续开发，请同样保留 `LICENSE` 与上述版权声明。
