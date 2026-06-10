# Pipeline Troubleshooting & Pitfalls

各阶段常见问题速查表与管线运营 Pitfalls 全集。平台级 Bug（API Key、Telegram 冲突、@mention 路由失效）见 `known-bugs.md`。

## 阶段问题速查

| Problem | Fix |
|---------|-----|
| Researcher: too few papers | Broaden to web, add tech blogs |
| Writer: wrong length | ~100汉字 ≈ 30秒口播。8-10分钟视频 ≈ 10-15场景，每场景80-200字。检查叙事弧线是否完整。 |
| Writer: script too fragmented | Writer 写了一句一画面（50+微场景）。修复：要求每场景是一个完整故事节拍（80-200字），减少场景数到 10-15。在 Delegate prompt 中强调场景粒度。 |
| Writer: script lacks storytelling | 脚本像维基百科条目，缺乏叙事张力。修复：在 prompt 中要求制造 Hook 冲突、用类比推进、避免教科书式罗列。 |
| Editor: over-editing | Remove AI traces only, preserve facts |
| Narrator: VTT incomplete | Re-generate with --write-subtitles flag; verify last cue |
| Narrator: pauses unnatural | Adjust \n\n spacing; test with shorter paragraph groups |
| Renderer: render fails | node ≥18, ffmpeg ≥4.4, clear cache |
| Renderer: staticFile 404 | Check public/narration.mp3 exists; use staticFile() not bare string |
| Renderer: can't parse VAS visual descriptions | 脚本中的 [画面]/[图表]/[动画] 标签缺少 entrance/dur 参数，或使用了旧格式的模糊描述。修复：(1) 让 Writer 按 VAS 规格重新生成；(2) Renderer 自行加载 `references/writer-visual-animation-guide.md` 做兜底映射推断。 |
| Renderer: animation timing doesn't match narration | VAS 中的 dur 参数是元素动画时长，不是场景总时长。场景总时长始终从 timing.json 取——检查 Sequence 是否正确使用了 timing.json 值，而非 VAS dur。 |
| Writer: visual descriptions too vague | ✅ VAS 已实施。Writer 用了"弹出""飘出""对比动画"等模糊词说明 SOUL.md 或 Delegate prompt 未生效。修复：确保 `video-writer/SOUL.md` 和 Delegate Writer prompt 都包含了 VAS 规格要求（每个标签必带 entrance + dur）。参考：`references/writer-visual-animation-guide.md`。 |
| Writer: script lacks VAS animation parameters | Writer 输出了旧格式的 `[画面]` 标签（无 entrance/dur）。修复：SOUL.md 和 prompt 强调 `entrance=...` 和 `dur=Nf` 必填。检查 Delegate Writer 是否加载了 `writer-visual-animation-guide.md`。 |
| TTS unnatural | Switch voice, adjust rate ±5% |
| BGM fails | Fallback: Pixabay/YouTube Audio Library |
| Skill not found | `hermes skills list \| grep <name>` |
| Packager: weak titles | Feed back scoring dimensions; Director writes 1 example |
| Writer: script contains timecodes | Writer wrote estimated timestamps instead of scene names. Fix: Use Markdown section format `## {场景名} — {概括}`. Scene names (Hook, Act1_A...) are mapped to real timing by Narrator's timing.json. |
| Writer: script uses old table format | Writer 用了旧的三栏表格格式。修复：输出必须是 Markdown section 格式——`## {场景名} — {概括}` + 旁白段落 + `[画面]` 标签。不要表格。 |
| Gateway crash-loop: "Telegram bot token already in use" | **Remove** `TELEGRAM_BOT_TOKEN` from each video profile's `.env` (comment it out or delete the line). Do NOT use `gateway.skip_platforms` — this config key does not exist in Hermes and has no effect. Studio group chat uses the API Server adapter, not Telegram. |
| Group chat: agent behavior change not taking effect | 只修改了 SKILL.md 的 Delegate prompt，但群聊模式下 Agent 用的是自己的 `SOUL.md`。修复：同步修改 `~/.hermes/profiles/video-<role>/SOUL.md`。SKILL.md 的 delegate prompt 仅在 `delegate_task` 子代理模式生效。详见下方 Pitfalls 中的 SOUL.md 二元性条目。 |
| Group chat: delegate_task uses old SKILL.md | 修改了 canonical SKILL.md 但 profile 本地副本未同步。修复：同步 canonical SKILL.md 到所有 `~/.hermes/profiles/video-*/skills/creative/video-studio-orchestrator/SKILL.md`。详见下方 Pitfalls 中的 profile 同步条目。 |
| Studio: "@profile not in room" | **Most common cause: profile not added as an agent in the Hermes Studio room** (Web UI operation). Prerequisites to verify: (1) Each profile has its own gateway service installed+started. (2) `TELEGRAM_BOT_TOKEN` removed from each video profile's `.env`. (3) Each profile has independent `.env` (not symlink) with `GATEWAY_ALLOW_ALL_USERS=true`. (4) `HERMES_GROUP_CHAT_MAX_AGENT_MENTION_DEPTH=8` set. (5) Verify with `hermes profile list`. **If all green, the fix is: open Hermes Studio → add each video-* profile as an agent in the group chat room.** Full setup: `references/group-chat-visual-handoff.md`. Diagnostic checklist: `references/group-chat-diagnostics.md`. |

## Pitfalls

- **⚠️ Stage 0 is mandatory — 不能跳过规划。** Director 收到选题后必须先创建 pipeline-plan.md。直接派发调研任务会导致后续 Agent 缺乏全局策略指导，各阶段输出风格不一致。如果用户跳过 Director 直接调用其他 Agent，Agent 会优雅降级（检测 plan 文件不存在时按通用模式工作并注明）。
- **⚠️ Graceful-degradation pattern for optional artifacts:** When an agent depends on an upstream artifact (like `pipeline-plan.md`) that may not exist in ad-hoc usage, use a conditional check: 「先检查 `X` 是否存在 → 存在则读取并遵循 → 不存在则按通用模式工作 + 标注 '⚠️ 未检测到 X'」。Never use unconditional `read_file` that fails and wastes tokens when users invoke agents directly outside the pipeline. This pattern applies to any optional pipeline artifact — not just plan files.
- **⚠️ TTS-First is NON-NEGOTIABLE.** Script timestamps are estimates. Actual speech speed varies per sentence. The pipeline MUST: (1) format narration text with natural pause markers (double/triple newlines, ellipses), (2) generate TTS with `--write-subtitles narration.vtt`, (3) parse VTT for actual timestamps, (4) build Remotion scene timing from VTT, not from the script's timestamp column. Building animation before recording narration guarantees audio-video desync. Full workflow: `references/tts-first-narration-guide.md`.
- **Natural pauses make TTS sound human:** Between paragraphs use `\n\n` (~500ms pause), between sections use `\n\n\n` (~800ms), for emphasis use `...` (~300ms). Without these, TTS reads like a robot on fast-forward.
- **Remotion `<Audio>` uses `staticFile()`**: `import { staticFile } from 'remotion'` then `<Audio src={staticFile("narration.mp3")} />`. Bare strings fail in render mode.
- **Renderer delegate_task may timeout**: 9 min video = ~35 min render. Split: Renderer builds the project, Director runs the final render.
- **Remotion render syntax**: `npx remotion render <CompositionId> out/file.mp4` — CompositionId first, output second.
- **BGM volume**: -18dB below narration.
- **`delegate_task` context loss**: Pass full context in each delegation.
- **Group Chat visual handoff vs delegate_task**: If the user expects to see multiple Profiles handing work to each other in Hermes Studio, do not have Director use `delegate_task` internally. Agent-to-agent visibility requires each assistant message to include an exact `@agent-name` mention so the group-chat mention router triggers the next Profile.
- **Group Chat mention depth**: Studio group chat limits recursive agent mentions to prevent loops (default is 4). A full video pipeline can exceed this (`Director → Researcher → Writer → Editor → Narrator → Renderer → Packager`). Set `HERMES_GROUP_CHAT_MAX_AGENT_MENTION_DEPTH=8` or `10` and restart Studio/Web UI for visual handoff rooms.
- **Group Chat name mismatch**: Mentions match the room agent display name. Standardize room names to profile names (`video-researcher`, etc.) or the chain may silently stop after the first agent.
- **Profile model config**: New profiles have no model. Set via `hermes -p <profile> config set model.default <model>`.
- **`hermes config show` does NOT accept arguments**: `hermes config show gateway.skip_platforms` produces `error: unrecognized arguments`. Use `hermes config show` (no args) to see the full config, then read or grep for specific keys. Alternatively, read the raw YAML: `cat ~/.hermes/profiles/<profile>/config.yaml`.
- **Kanban prerequisites**: Default gateway must be running. Profiles need models + API keys.
- **⚠️ Multi-gateway Telegram conflict**: Running 7 profile gateways with the same Telegram bot token causes all to crash-loop. Fix: Remove `TELEGRAM_BOT_TOKEN` from each video profile's `.env` — comment it out with `#` prefix or delete the line entirely. Studio group chat uses the API Server adapter, which does not require Telegram. ⚠️ `gateway.skip_platforms` does NOT exist in Hermes — do not use it.
- **⚠️ Multi-gateway API Server requirement**: For Studio group chat to dispatch @mentions to a profile, each profile's gateway MUST have `API_SERVER_ENABLED=true` and `API_SERVER_KEY=<unique_key>` in its `.env` file, plus a unique `API_SERVER_PORT` (default 8642 — assign unique ports like 8650-8656). Without this, the gateway shows "No messaging platforms enabled" and group chat @mentions won't reach the profile. The API server is the transport layer that Studio uses to communicate with profile gateways; it is separate from messaging platforms (Telegram/Discord/etc.).
- **⚠️ Profile .env files must be copies, not symlinks**: Symlinking `~/.hermes/profiles/<name>/.env → ~/.hermes/.env` causes writes to pollute the global config. Always `cp` the global `.env` to each profile directory.
- **⚠️ Director must NOT @mention multiple agents in one message**: In group-chat @mention mode, the Director's topic selection message must contain ONLY `@video-researcher`. Mentioning `@video-writer` or listing the full pipeline plan in the same message causes all mentioned agents to self-dispatch simultaneously, corrupting the sequential pipeline order. The chain is: each agent @mentions exactly one next agent when done.
- **⚠️ Writer 脚本碎片化：** 最常见问题——一句一画面，50+ 微场景。根因是"≤25字"旧约束或 Writer 没有收到叙事指导。修复：(1) 明确要求每场景 80-200字，(2) 要求"一个场景 = 一个故事节拍"而非一句话，(3) 规定 8-10分钟视频 = 10-15场景。见 Delegate Writer prompt 的完整方法论。
- **⚠️ Writer 产物像教学课件：** 罗列要点、教科书语调、缺乏个性和张力。修复：在 prompt 中注入小Lin说风格引导——用类比和比喻、朋友聊天感、具体案例、偶尔反问。禁止"大家好欢迎"、"第一点...第二点..."等套话。
- **⚠️ Writer must NOT write timecodes in scripts**: Use Markdown section format: `## {场景名} — {概括}`. Scene names (Hook, Act1_A, Act1_B...) are mapped to real timing by Narrator's TTS recording → VTT parsing → timing.json. Writer-estimated timecodes are misleading and will be overwritten. See Stage 2 for the correct format and example.
- **⚠️ Modifying agent behavior requires BOTH SKILL.md + SOUL.md**: The Delegate prompt templates in this skill only apply when Director uses `delegate_task` to spawn subagents. In **Kanban group chat mode** (the user's preferred mode), each agent runs with its own profile's `SOUL.md` as its persona — the delegate_task prompts are never seen. Any behavioral change (e.g., new output format, new constraints, new animation specs) MUST be written into both places: (1) the Delegate prompt template in this skill, and (2) the corresponding profile's `SOUL.md` file (`~/.hermes/profiles/video-<role>/SOUL.md`). Failing to update SOUL.md means the change silently does nothing in group chat mode.
- **⚠️ Profile-local SKILL.md copies must be synced after modifying the canonical skill**: Each video-* profile has its own copy of this SKILL.md under `~/.hermes/profiles/video-<role>/skills/creative/video-studio-orchestrator/SKILL.md` — they are NOT symlinks. Full workflow for multi-agent skill changes (plan → canonical → SOULs → sync → verify): `references/multi-agent-change-workflow.md`. Quick sync:
  ```bash
  SRC=~/.hermes/skills/creative/video-studio-orchestrator/SKILL.md
  for dir in video-director video-editor video-narrator video-packager video-renderer video-researcher video-writer; do
    cp "$SRC" ~/.hermes/profiles/$dir/skills/creative/video-studio-orchestrator/SKILL.md
  done
  ```
  Same for any new reference files added under `references/`. Failing to sync means the profiles load stale copies with old Delegate prompts and missing VAS specs, silently producing incorrect behavior in delegate_task mode.
- **⚠️ Writer visual descriptions are too vague for Renderer**: ✅ **已修复 (VAS 已实施)**。Writer 现在输出 VAS 规格化视觉描述（每个标签携带 `entrance=` + `dur=Nf` 参数）。Writer 加载 `references/writer-visual-animation-guide.md` 获取完整参数表。Renderer 将 VAS 参数直接映射到 Remotion 动画原语。若出现问题，检查 Delegate Writer/Renderer prompt 和 `video-writer/SOUL.md`、`video-renderer/SOUL.md` 是否已更新。
