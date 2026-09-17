# 改动详情（相对上游）

本文记录 **Xinyuan** 相对上游 [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) 的全部改动，
包含每一项的**现象、根因、修法、验证方式**。按改动发生的顺序排列。

- 上游基线：桌面端 `0.17.3`
- 上游协议：MIT，Copyright (c) 2025 Nous Research（`LICENSE` 未做任何修改）

---

## 1. 修复：界面图标全部变成方块

### 现象
所有图标（侧栏、按钮、状态栏）都渲染成豆腐块 `□`，但界面其余部分正常。

### 根因
图标系统用的是**字体图标**（`@vscode/codicons`，通过 `<i class="codicon codicon-xxx">` 使用），
字体经 `src/styles.css` 的 `@import '@vscode/codicons/dist/codicon.css'` 引入。

问题出在 Vite 对 CSS 的处理上：

- `@import` 进来的 CSS 里若有**相对 `url()` 解析不到**，Vite **只发 warning、原样保留**该 URL（不重写、不加哈希）；
- 这与 JS `import` 的行为不同（后者会直接报错），所以构建**能成功**，问题被完全掩盖；
- 本机依赖目录里 `@vscode/codicons/dist/codicon.ttf` 恰好缺失（安装被中断），
  于是产物 CSS 仍指向 `node_modules` 下的路径 → 运行时字体加载 404 → 所有字形回退成豆腐块。

### 修法（双保险）
1. **补回字体**：从 npm 镜像重新拉取 `@vscode/codicons` 的 tarball，恢复 `codicon.ttf`（125,828 字节，magic `00010000`）。
2. **源码自带一份**：把字体复制到 `apps/desktop/src/fonts/codicon.ttf`，并在 `src/styles.css` 中新增：

```css
/* 与依赖包内那条同字体族、同描述符，因此按 CSS 规范后者生效，可覆盖它 */
@font-face {
  font-family: 'codicon';
  font-display: block;
  src: url('./fonts/codicon.ttf') format('truetype');
}
```

关键点：**描述符必须与包内那条完全一致**（只写 `font-display: block`，
**不要**额外写 `font-style` / `font-weight`）。CSS Fonts 规范中，同 `font-family` 且描述符完全相同的
`@font-face` 由**后声明者**胜出；一旦描述符多出一个，就会变成两个独立字体集参与匹配，
反而可能盖掉 `.codicon { font: normal normal normal 16px/1 codicon }` 的简写设置。

### 验证
- 产物中出现 `dist/assets/codicon-<hash>.ttf`；
- 构建后扫描产物 CSS，**未解析的 `@font-face` URL 数量 = 0**；
- 两条 `codicon` 的 `@font-face` 都指向该文件。

---

## 2. 精简：API 配置只保留一个入口

### 改动前
首启向导是一个「供应商目录」：OAuth 登录、各家 API Key 列表、本地模型、Fireworks / OpenRouter 等多个入口。

### 改动后
全应用**只有一个**模型配置表单，出现在两处（首启遮罩 + 设置页），共用同一个组件：

| 字段 | 行为 |
| --- | --- |
| 接口地址 | **固定** `https://yuangeluyou.com/v1`，只读展示，用户改不了 |
| API 密钥 | 用户填写（密码框） |
| 模型名称 | 用户填写，带「获取模型」按钮（可选，探测失败也不阻塞提交） |

### 实现
新增两个文件：

- `apps/desktop/src/components/onboarding/xinyuan-form.tsx` —— 表单本体
- `apps/desktop/src/app/settings/xinyuan-settings.tsx` —— 设置页外壳

复用程序**内置的 custom endpoint 能力**，没有新增任何后端接口：

```
validateProviderCredential('OPENAI_BASE_URL', baseUrl, apiKey)   // 探测模型列表
  → saveCustomEndpoint({ id, name, base_url, model, api_key, discover_models: false, make_default: true })
  → activateCustomEndpoint(id)
  → ctx.requestGateway('reload.env')
  → completeDesktopOnboarding()
```

设计取舍：
- `discover_models: false` + 模型名必填 —— 避免「探测不到模型列表就无法提交」把用户卡死；
- 不调用 `setMainModelAssignment`，保持改动面最小。

配套清理：
- `onboarding/index.tsx` 里删掉供应商目录相关的行组件与「显示全部 / 稍后再说」开关（对单入口已无意义）；
- `app/settings/index.tsx` 删除 Keys / Providers 子导航与整套 subview 机制，导航项合并为单项「Xinyuan API」；
- 保留 `'keys'` 作为历史别名并加重定向（路由参数枚举会把不在枚举里的 `?tab=` 值**静默改写**成默认值，
  直接删会导致旧链接行为异常）。

### 验证
- ESLint 全量 `0 error`；
- 产物 JS 中确认包含 `yuangeluyou.com/v1`，且「稍后再说」文案出现次数归零。

---

## 3. 更名：Hermes → Xinyuan

### 覆盖范围

| 范围 | 处数 | 说明 |
| --- | --- | --- |
| 界面文案（6 个语言：en / zh / zh-hant / ja / ru / ar） | 1,037 | `src/i18n/*.ts` |
| `src/` + `electron/` 下的用户可见字符串 | 212（101 个文件） | 只替换字符串字面量 |
| `apps/desktop/package.json` | 8 处 | `productName` / `appId` / `executableName` / `artifactName` / NSIS 名称 / mac 的 `CFBundle*` 等 |
| Windows exe 版本元数据 | 4 项 | 由 `scripts/set-exe-identity.mjs` 在打包后写入 |
| `index.html` 标题 | 1 | |

### 刻意**不改**的东西

- **代码标识符**：`HERMES_*` 环境变量、`hermes://` 协议、`window.hermesDesktop`、`HermesApiRequest` 等
  —— 改动它们会破坏功能，且与用户可见文案无关。
- **i18n 的对象键**：只改值不改键（例如 `restartHermes: 'Restart Xinyuan'`）。
- workspace 包名 `name: 'hermes'`（改了会连带影响构建脚本与依赖解析）。

### 替换方式（避免误伤）
用带边界的正则，只替换「引号开头且后面不是标识符字符」的出现：

```python
PAT = re.compile(r"(['\"`])Hermes(?![A-Za-z0-9_$])")
new, n = PAT.subn(r"\1Xinyuan", text)
```

替换后自查 `[A-Za-z0-9_$]Xinyuan` 形式的粘连，确认为 0。

### 容易漏的一处
exe 的图标与版本信息**不是** electron-builder 写的 —— 配置里 `signAndEditExecutable: false`
会连带跳过 rcedit，改由项目自己的 `afterPack` 钩子 `scripts/set-exe-identity.mjs` 补。
该脚本里 `ProductName` / `CompanyName` 等是**硬编码**的，改名时必须一起改，否则属性面板仍显示旧品牌。

验证方式：把 exe 按 UTF-16LE 统计字符串出现次数 ——
`Xinyuan` 出现 4 次、`Nous Research` 0 次、`Hermes` 0 次。

---

## 4. 移除上游品牌 logo

### 删除的资源
上游的 logo、插画、精灵图与启动动画帧，共 7 组（删除前已备份到仓库外，未随仓库发布）。

### 替换为中性图标
用程序生成「靛蓝 → 紫罗兰圆角渐变 + 白色 X」，替换：

| 文件 | 用途 |
| --- | --- |
| `apps/desktop/assets/icon.png` | 应用图标源图（1024×1024） |
| `apps/desktop/assets/icon.ico` | Windows 图标（7 个尺寸：16/24/32/48/64/128/256） |
| `apps/desktop/public/apple-touch-icon.png` | 窗口图标（**保留原文件名换内容**，主进程按文件名引用） |
| `apps/desktop/public/intro-mark.png` | 启动动画立方体贴图 |

### 组件层面
`BrandMark` 组件**保留对外 API**（同样的 `className` 驱动尺寸），只把内部实现换成中性 SVG。
这样 5 个调用点的布局完全不用动。

---

## 5. 🔴 修复：首次启动必然超时失败（最关键的一项）

### 现象
便携包解压后双击启动器：

- 窗口能出来，`data\`、`data\desktop\` 都正常创建，`data\logs\desktop.log` 也写了；
- 但日志最后是：

```
Ignoring stale Hermes backend exit (1)
[boot] Desktop boot failed: Timed out waiting for Hermes backend port announcement (90000ms)
```

### 排查过程（都不属于「读代码能看出来」的类型）

1. **手动复现后端**：带正确的 `PYTHONPATH` 直接跑
   `python -m hermes_cli.main serve --host 127.0.0.1 --port 0`，
   秒级打印 `HERMES_BACKEND_READY port=…` → 排除 Python 环境问题。
2. **发现日志看不到后端输出**：超时抛的错（`backend-ready.ts`）**不带输出尾巴**，
   而子进程 `stdout/stderr` 的转发是在 `claimBackendChild()` **之后**才挂上的，
   早期崩溃的 traceback 只进了一个临时缓冲区然后被丢弃。→ 必须自己手动复现。
3. **主线程栈采样**：起一个线程每 2 秒 dump `sys._current_frames()`，用
   `runpy.run_module("hermes_cli.main", run_name="__main__")` 跑起来。卡点以重复的顶帧暴露：
   ```
   hermes_cli/main.py  _dashboard_prepare_runtime
     → main_tui_launch.py:850  _sync_bundled_skills_quietly
       → tools/skills_sync.py:397  sync_skills
         → _install_new_skill → _copy_dir → shutil.copytree
   ```
4. **目录轮询**：每秒 diff 数据目录整棵树，新文件带时间戳打印。确认
   **0 → 96 秒全在写 `skills\**`**，之后到 READY 只用 12 秒。

### 根因
后端 `serve` 在绑定端口**之前**，要把 `backend/skills` 下的内置技能同步进 `HERMES_HOME/skills`。
判断「是否已同步」的依据是同步清单 `skills/.bundled_manifest`（v2 格式，每行 `name:origin_hash`）。
清单不存在 → 每个技能都算新技能 → 全量 `copytree`。

在慢盘上，**328 个技能文件逐个复制需要 85~109 秒**，而桌面端等待后端端口公告的超时是 **90000 ms**。
新用户第一次启动必然踩线失败。

### 修法
打包时把一次**成功启动后**的 `HERMES_HOME/skills`（含 `.bundled_manifest`）预置进便携包的 `data/skills`。

**为什么可以随包分发到任意机器**：清单里的哈希由 `_dir_hash()` 计算，
它只把 **相对路径**（`str(fpath.relative_to(directory))`）+ **文件内容** 喂给 MD5，
**不含任何绝对路径**。所以换机器、换解压目录后哈希依然相等，首启直接走 skip 分支。

> 注意：`str(Path)` 在 Windows 产出反斜杠、在 POSIX 产出正斜杠，
> 因此该清单**不能跨平台复用**（Windows → Windows 没问题）。

### 效果

| 场景 | 到 `HERMES_BACKEND_READY` |
| --- | --- |
| 全新数据目录（现场播种 328 个文件） | **85 ~ 109 秒**（超过 90 秒超时，失败） |
| 预置 `skills/` + `.bundled_manifest` | **6.5 秒** |

端到端（双击启动器 → `Xinyuan backend is ready. Finalizing desktop startup`）：**12.6 秒**。

### 预置时**不要**带的东西
`state.db*`、`shared-state.db*`、`spawn-ledger.json`、`logs/`、`sessions/`、`memories/`、
`pairing/`、`SOUL.md`、`.update_check`、`data/desktop/`（Electron userData，内含按构建路径缓存的 Cache）。
这些是**机器状态**而不是内容，带上会引入陈旧的锁与绝对路径。

最终 `data/` 只有 `config.yaml` + `skills/`。

---

## 6. 便携打包与启动器编码

### 启动器 `.bat` 必须纯 ASCII
这是本轮踩到的最隐蔽的坑。启动器里原本写了中文注释，结果：

- cmd.exe 按系统 **OEM 代码页**（中文系统是 CP936）**逐字节**扫描批处理文件；
- 文件里混入 UTF-8 编码的中文（3 字节、首字节 ≥ 0xE0）后，双字节扫描器错位，
  **吞掉行尾 CRLF 的 `\r`** 或吞掉 `)`；
- 结果把 `set "HERMES_DESKTOP_HERMES_ROOT=…"` 这类行**从中间截断**，
  报出 `'SKTOP_HERMES_ROOT' 不是内部或外部命令` —— 应用根本起不来。

修法：启动器**全部改英文注释**，用 `encoding="ascii"` 写出；中文说明移到单独的 `README.txt`
（文件名也保持 ASCII，内容用 `utf-8-sig`，记事本能正确显示中文）。

验证：`Start-Xinyuan.bat` 2030 字节、**非 ASCII 字节数 = 0**、CRLF 59 个、孤立 LF 0 个。

### 其他打包要点
- **`app\` 必须原样整树复制**。用全局忽略规则（含 `node_modules`）去剪 `app\`，
  会误剪 `resources\app.asar.unpacked\dist\node_modules\`（`get-windows`、`node-pty` 等原生模块），
  导致 Electron 主进程加载失败后**静默回落**到 `default_app.asar`：不出窗口、stdout 一行都没有、不写日志。
  因此 `app\` 用「什么都不剪」的复制函数，复制后做全量树比对。
- **`backend\venv\Scripts\python.exe` 必须不存在**，否则桌面端会优先选它而不是包内自带的解释器。
- **必须删掉 editable 安装痕迹**（`__editable___*_finder.py` 里含硬编码绝对路径）。

---

## 7. 放宽安全审核限制

见 README 的「⚠️ 关于安全审核设置」一节。配置文件为便携包内的 `data/config.yaml`：

| 配置项 | 上游默认 | 本版本 |
| --- | --- | --- |
| `approvals.mode` | 需人工审批 | `'off'` |
| `security.redact_secrets` | `true` | `false` |
| `security.tirith_enabled` | `true` | `false` |
| `security.allow_private_urls` | `false` | `true` |

这是为了让「解压即用」不打扰用户而做的**刻意取舍**，风险已在 README 中明确标注。

---

## 8. 交付物验证记录

对最终发布的 `Xinyuan-Portable-0.17.3.zip`：

| 检查项 | 结果 |
| --- | --- |
| 全量 CRC 校验（`ZipFile.testzip()`） | 零损坏 |
| 与构建目录清单比对 | 13,279 文件 / **0 缺失 / 0 多余 / 0 大小不符** |
| 启动关键文件 | `Xinyuan.exe`、`app.asar`、`codicon-*.ttf`、`node-pty/.../pty.node`、`get-windows/*`、`yaml/__init__.py`、`data/skills/.bundled_manifest` 全部在位 |
| 启动器编码 | 2030 字节 / 非 ASCII 0 / CRLF 59 / 孤立 LF 0 |
| `README.txt` | UTF-8 BOM = True |
| 数据目录内容 | 仅 `config.yaml` + `skills/`，无机器状态残留 |
| 最长条目路径 | 128 字符（Windows 资源管理器 260 限制有充足余量） |
| 绝对路径 / `..` 条目 | 无 |
| 端到端启动 | 双击 `Start-Xinyuan.bat` → `Xinyuan backend is ready`，耗时 12.6 秒 |

---

## 9. 补漏（第二版）：AI 的「自我认知」漏改名

### 现象

界面文案已经全部改成 Xinyuan 了，但**一对话就露馅**：AI 会自称
「Hermes Agent, built by Nous Research」，并把界面称作 "the Hermes desktop app"。

### 根因

第一版的改名正则只匹配**紧跟引号的** `Hermes`：

```python
re.compile(r"(['\"`])Hermes(?![A-Za-z0-9_$])")
```

它只能命中 `"Hermes"` 这种独立字符串字面量。而系统提示里写的是
`"You are Hermes Agent, ..."` —— `Hermes` 前面是**空格**，永远匹配不到。
于是 UI 改到位了，**发给模型的系统提示**和**首启播种的人格文件**全漏了。

### 影响面

| 文件 | 作用 |
| --- | --- |
| `agent/prompt_builder.py` | **每一轮对话**都会发给模型的系统提示 |
| `hermes_cli/default_soul.py` | 首启播种 `data/SOUL.md` 的模板 |
| `backend/SOUL.md` | 随包分发的人格文件 |

交付包内用户可见的 `Hermes` 文案合计 **2,086 处 / 656 个文件**。

### 修法

用 Python `tokenize` **只对 STRING / COMMENT token** 做替换。
这样从构造上就不可能碰到代码标识符 —— `hermes_cli`、`HERMES_HOME`、
`hermes_state_*` 这些必须原样保留，改了应用直接崩。

### 刻意**不改**的三类（关键）

机械改名不只是「有风险」，而是会**改错**：

| 类型 | 例子 | 为什么不能改 |
| --- | --- | --- |
| 模型名 | `Hermes 3` / `Hermes 4` | 这是 Nous Research 的**大模型名**，不是本 agent |
| 搜索替换表 | `_OAUTH_SYSTEM_REPLACEMENTS` 里的 `("Hermes Agent", "Claude Code")` | 左值是**被匹配的原文**，改了 Anthropic OAuth 的伪装就失效 |
| 等值判断 | `value == "Hermes Agent"`、`author != "Hermes Agent"` | 比较用，不是展示用 |

另外三类同样保持原样：

- **URL** —— `https://hermes-agent.nousresearch.com/docs`、`HTTP-Referer`，指向真实上游文档
- **CLI 命令** —— 控制台脚本仍然是 `hermes`（`pyproject.toml` 里 `hermes = "hermes_cli.main:main"`），
  技能里写的 `hermes config` / `hermes doctor` 都是**正确的**，不能改
- **第三方真实页面** —— `the portal's Hermes Agent page`（Nous Portal 的页面）

### 两处必须回退的改动

1. **`hermes_cli/default_soul.py` 的 `_SCAFFOLD_HEAD` / `_LEGACY_TEMPLATE_SOULS`**
   这两个常量是**用来识别**用户磁盘上旧版 `SOUL.md`（内容是 "Hermes Agent"）以便原地升级的。
   改名会让老安装不再被识别 → 已强制保留原文，只改 `DEFAULT_SOUL_MD`。

2. **`backend/skills/` 与 `backend/optional-skills/` 下的文件一律不动**
   它们的内容哈希通过 `data/skills/.bundled_manifest` 决定 `skills_sync` 是否跳过同步。
   改了会让清单失效，下次启动就重新全量 `copytree` 播种 —— 正是那个 **85~109 秒、
   会撞爆桌面端 90 秒启动超时**的路径。实测：改了 → 启动直接失败。

### 验证

| 项 | 结果 |
| --- | --- |
| 改动文件语法校验（656 个 `.py`） | **0 失败** |
| 端到端启动 | **18.0 秒** → `Xinyuan backend is ready. Finalizing desktop startup` |
| 系统提示 | `You are Xinyuan（鑫源）, a local desktop AI assistant built on Hermes Agent by Nous Research.` |

---

## 10. 已知限制

- 仅提供 **Windows x64** 便携包。macOS / Linux 需自行从源码构建。
- 需要能访问 `https://yuangeluyou.com`；离线环境无法使用。
- 便携包体积约 234 MB（含自带 Python 运行时与全部依赖），首次启动约 13 秒（之后更快）。
- 上游 3.14 支持尚未跟进（部分依赖未发布 wheel），请使用 Python 3.11 ~ 3.13。
