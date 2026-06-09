# Hermes Studio Group Chat Visual Handoff

> ⚠️ **Agent-to-agent @mention dispatch is BROKEN in hermes-web-ui ≤ 0.6.10.**  
> The handoff chain described below (Director → Researcher → Writer → etc.) silently fails when agents @mention each other. See `references/hermes-web-ui-mention-bug.md` for the full investigation.  
> **Workaround:** Use `delegate_task` for stage dispatch + post progress summaries to group chat for visibility.

## Why Director may look like it is working alone

If Director uses `delegate_task`, the group room only sees Director's turn. Subagents run inside Director's tool loop and do not appear as separate Studio group-chat participants. For visible collaboration, every stage handoff must be expressed as a normal assistant message that includes an exact `@agent-name` mention.

## Required setup

### 1. Independent .env per profile (NOT symlinks)

Each profile needs its own `.env` file with API keys. Do NOT symlink to the global `.env` — writes to a symlink-polluted file will contaminate all profiles.

```bash
for p in video-director video-researcher video-writer video-editor video-narrator video-renderer video-packager; do
  cp ~/.hermes/.env ~/.hermes/profiles/$p/.env
  echo "GATEWAY_ALLOW_ALL_USERS=true" >> ~/.hermes/profiles/$p/.env
done
```

### 2. Remove Telegram bot token to avoid conflicts

All 7 gateways share one Telegram bot token. Running them simultaneously with Telegram enabled causes all gateways to crash-loop with "Telegram bot token already in use." Remove the token from each profile's `.env` — Studio group chat uses the API Server adapter, not Telegram:

```bash
for p in video-director video-researcher video-writer video-editor video-narrator video-renderer video-packager; do
  sed -i 's/^TELEGRAM_BOT_TOKEN=/#TELEGRAM_BOT_TOKEN=/' ~/.hermes/profiles/$p/.env
done
```

⚠️ `gateway.skip_platforms` does NOT exist in the Hermes codebase. Do not attempt to use `hermes config set gateway.skip_platforms telegram` — it will silently succeed (writes to config.yaml) but has no effect at runtime.

### 3. Install and start per-profile gateway services

```bash
for p in video-director video-researcher video-writer video-editor video-narrator video-renderer video-packager; do
  yes | hermes -p "$p" gateway install
done
```

Verify: `hermes profile list | grep video` — all should show `running`.

### 4. Add profiles to the Studio group room

Add all video profiles to the same Hermes Studio group room with display names exactly matching the mention names:
   - `video-director`
   - `video-researcher`
   - `video-writer`
   - `video-editor`
   - `video-narrator`
   - `video-renderer`
   - `video-packager`
4. For a full pipeline, raise recursive mention depth in the hermes-web-ui systemd service and restart:

```bash
# Add to /etc/systemd/system/hermes-web-ui.service in the [Service] section:
# Environment=HERMES_GROUP_CHAT_MAX_AGENT_MENTION_DEPTH=8
sudo sed -i '/^Environment=HERMES_BIN=/a Environment=HERMES_GROUP_CHAT_MAX_AGENT_MENTION_DEPTH=8' /etc/systemd/system/hermes-web-ui.service
sudo systemctl daemon-reload
sudo systemctl restart hermes-web-ui
```

Default depth is 4, which can stop a 6-stage chain before Packager. Set to 8 for a standard 7-agent pipeline, or 10 for longer review loops.

## Operating rule

In group-chat handoff mode, Director must not call `delegate_task` to run the pipeline privately. Director should:

1. Create `{VIDEO_PROJECTS_ROOT}/<project>/`.
2. Write/announce the project brief.
3. Publicly hand off to **only** `@video-researcher` with exact input/output paths. **Do NOT @mention Writer, Editor, or any other agent in the same message.** Mentioning multiple agents causes all of them to self-dispatch simultaneously, corrupting the sequential order.

Each downstream agent should complete one stage and then mention **exactly one** next Profile. The chain is strictly sequential:

```
@video-director      → ONLY @video-researcher
@video-researcher    → ONLY @video-writer
@video-writer        → ONLY @video-editor
@video-editor        → ONLY @video-narrator
@video-narrator      → ONLY @video-renderer
@video-renderer      → ONLY @video-packager
@video-packager      → ONLY @video-director  (for archival)
```

After Packager @mentions Director, Director performs final quality review.

## Handoff template

```markdown
## 阶段完成
- 阶段：<Research|Writing|Editing|Narration|Rendering|Packaging>
- 产物：{VIDEO_PROJECTS_ROOT}/<project>/<artifact>
- 摘要：<1-3 bullets>

## 下一步
@video-<next> 请完成：<specific task>。
输入路径：{VIDEO_PROJECTS_ROOT}/<project>/<input>
输出路径：{VIDEO_PROJECTS_ROOT}/<project>/<output>
关键要求：<quality gates / constraints>
```

## Recommended chain

```text
@video-director       (topic selection → only @video-researcher)
  → @video-researcher  (research → @video-writer)
  → @video-writer       (script → @video-editor)
  → @video-editor       (humanize → @video-narrator)
  → @video-narrator     (TTS → @video-renderer)
  → @video-renderer     (render → @video-packager)
  → @video-packager     (package → @video-director for archival)
```

**Critical rule:** Each agent @mentions EXACTLY ONE next agent. Never @mention multiple agents in one message. Director's topic selection message must contain only `@video-researcher` — not the full pipeline plan.

## Hybrid option

For long or failure-sensitive production, use Kanban as the durable state machine and group chat as the visibility layer:

- Kanban tracks dependencies, retries, and status.
- Group chat posts stage summaries and @mentions the next responsible Profile.
- Director coordinates exceptions rather than privately doing all work.
