# Kanban Setup Guide

Setting up the 7-profile video pipeline in Kanban mode.

## Prerequisites

1. Default gateway running (`hermes gateway status` — hosts the embedded dispatcher)
2. All 7 profiles created with models configured
3. API keys inherited from shell environment (or configured per-profile)

## Profile Model Configuration (Tier 2: single-provider)

```bash
# Pro models (strong reasoning / code generation)
for p in video-director video-researcher video-writer video-renderer; do
  hermes -p "$p" config set model.default deepseek-v4-pro
  hermes -p "$p" config set model.provider deepseek
done

# Flash models (pattern matching / light tasks)
for p in video-editor video-narrator video-packager; do
  hermes -p "$p" config set model.default deepseek-v4-flash
  hermes -p "$p" config set model.provider deepseek
done
```

## Board Setup

```bash
hermes kanban boards create video-pipeline --name "视频管线"
hermes kanban boards switch video-pipeline
```

## 6-Task Pipeline (v2.0 with Narrator + Renderer)

```bash
T1=$(hermes kanban create --assignee video-researcher --skill arxiv "调研：{topic}" --json | jq -r .id)
T2=$(hermes kanban create --assignee video-writer --parent $T1 "脚本：{topic}" --json | jq -r .id)
T3=$(hermes kanban create --assignee video-editor --parent $T2 --skill humanizer "润色：{topic}" --json | jq -r .id)
T4=$(hermes kanban create --assignee video-narrator --parent $T3 "配音：{topic}" --json | jq -r .id)
T5=$(hermes kanban create --assignee video-renderer --parent $T4 --skill remotion "渲染：{topic}" --json | jq -r .id)
T6=$(hermes kanban create --assignee video-packager --parent $T5 "包装：{topic}" --json | jq -r .id)
```

## Verification

```bash
hermes kanban list                    # T1 should be "ready", T2-T6 "todo"
hermes kanban show $T1                # Check task details
hermes kanban daemon --interval 60    # Optional: dedicated dispatcher daemon
```

## Execution

Dispatcher (in default gateway, 60s tick) auto-promotes dependents as parents complete. No manual intervention needed for sequential pipeline.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Tasks stuck in `ready` | Check default gateway is running: `hermes gateway status` |
| Profiles not discovered | Run `hermes kanban init` to refresh profile discovery |
| Worker fails | Use `hermes kanban reclaim <task_id>` then check profile model config |
| model.default not set | `hermes -p <profile> config set model.default <model>` |
| Profile not discovered by dispatcher | Run `hermes kanban init` to refresh; verify profile has model + .env |
| Gateway crash-loop (Telegram conflict) | **Remove** `TELEGRAM_BOT_TOKEN` from each video profile's `.env` (comment out with `#` prefix or delete the line). ⚠️ `gateway.skip_platforms` does NOT exist in Hermes codebase. |
| Profile .env symlink pollution | Replace symlink with `cp ~/.hermes/.env ~/.hermes/profiles/<name>/.env` |

## Group Chat Multi-Gateway Setup

For Hermes Studio group chat mode, each profile needs its own running gateway. See `references/group-chat-visual-handoff.md` for the full setup, including:
- Independent `.env` per profile (no symlinks)
- Remove `TELEGRAM_BOT_TOKEN` from each video profile's `.env` to avoid token conflict
- `yes | hermes -p <profile> gateway install` per profile
- `HERMES_GROUP_CHAT_MAX_AGENT_MENTION_DEPTH=8` for full pipeline
