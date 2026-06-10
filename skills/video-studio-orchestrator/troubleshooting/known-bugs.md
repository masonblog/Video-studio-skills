# Hermes 已知 Bug 与临时变通方案 (Known Bugs & Workarounds)

本文件汇总了在 Hermes Studio 多 Profile 和群聊模式下运行本视频创作管线时可能遇到的平台级 Bug 和临时变通方案。

---

## 1. 多 Profile 模式下 API Key 缺失问题

### 问题现象
在使用 Hermes Studio 进行多 Profile 群聊时，除 `default` 之外的 `video-*` 子 Profile 会报错：
`no API key configured` (未配置 API key)，即使全局/默认 Profile 运行正常。

### 根本原因
- 命令行模式下 (`hermes -p <name>`)，子 Profile 会继承当前 shell 的环境变量。
- 网关 (gateway) 或群聊模式下，各个 Profile Gateway 是独立进程启动的，它们不会继承 shell 环境变量，而是到各自的工作目录 `~/.hermes/profiles/<name>/.env` 中寻找 API 密钥和配置。

### 解决办法
将全局的 `.env` 文件复制（或软链接）到每个子 Profile 的目录下：
```bash
for p in video-director video-researcher video-writer video-editor \
         video-narrator video-renderer video-packager; do
  cp ~/.hermes/.env ~/.hermes/profiles/$p/.env
done
```
> ⚠️ **注意**：在多网关环境下，软链接可能导致写入冲突，因此推荐使用 **复制 (cp)** 而非软链接。

---

## 2. 虚无配置项 `gateway.skip_platforms` 的失效问题

### 问题现象
当 7 个 `video-*` 角色网关同时启动时，所有网关在启动后立即崩溃重启，日志中显示：
`Connecting to telegram...` → `Telegram bot token already in use` (Telegram Bot Token 已被占用) → `Gateway exiting cleanly`

即使在 `config.yaml` 中配置了 `gateway.skip_platforms: telegram`，依旧无法阻止网关尝试连接 Telegram。

### 根本原因
通过对 Hermes Agent 源码的检索发现，**`gateway.skip_platforms` 这一配置项在 Hermes 源码中完全不存在**。它是人为凭空想象的配置，即使通过 `hermes config set gateway.skip_platforms telegram` 成功写入了 YAML 文件，网关在运行时也根本不会去读取它。

网关自动发现并启用 Telegram 平台只基于一个硬性条件：
```python
# gateway/config.py
telegram_token = os.getenv("TELEGRAM_BOT_TOKEN")
if telegram_token:
    telegram_config = _enable_from_env(Platform.TELEGRAM)
    telegram_config.token = telegram_token
```
只要环境变量中存在非空的 `TELEGRAM_BOT_TOKEN`，网关就会强制启用并连接 Telegram。如果 7 个网关使用同一个 Token 启动，会导致竞争冲突引起 crash loop。

### 解决办法
从不需要连接 Telegram 的子 Profile 网关 `.env` 文件中，彻底移除（或注释掉）`TELEGRAM_BOT_TOKEN` 行：
```bash
# 修改各子 Profile 的 .env，注释掉 Token 变量
# #TELEGRAM_BOT_TOKEN=your_token_here
```
在 Studio 群聊模式下，网关与 Studio 之间使用的是 API Server 适配器进行通信，完全不需要 Telegram 介入。

---

## 3. 群聊 Agent-to-Agent @mention 接力失效 Bug (hermes-web-ui ≤ 0.6.10)

### 问题现象
在 Hermes Studio 群聊中，Agent 之间通过消息文本中的 `@video-researcher` 进行接力时，消息虽然成功存入数据库 (`gc_messages`)，但群聊服务器的 `processMentions` 逻辑不会唤醒并派发任务给被 @ 的下游 Agent。只有人类用户发送的 @mention 才能成功唤醒 Agent。

### 根本原因
在 `hermes-web-ui 0.6.10` 及以下版本中，群聊服务端 `rh` 类的 `handleMessage` 逻辑在处理由 `assistant`（即 Agent）发出的消息时，无法正确路由/派发二次 mentions。

### 变通方案
**使用 Director 主控委派 (delegate_task) + 群聊广播的混合模式：**
1. 依然在群聊中发送阶段性的完成报告（仅作人类可视化追踪之用）。
2. 在后台，Director 通过 `delegate_task` 函数顺序委派各子 Agent 的 Profile 执行。这样可以完全绕过群聊底层的 @mention 路由缺陷，同时保持群聊界面的进度可见度。
