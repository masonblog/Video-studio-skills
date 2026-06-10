1|---
2|name: video-studio-orchestrator
3|description: "Multi-Agent video production pipeline: research → writing → editing → narration → rendering → packaging. 7 agents, 6 stages. Producer split into Narrator (TTS) + Renderer (Remotion) with timing.json handoff."
4|version: 2.2.0
5|metadata:
6|  hermes:
7|    tags: [video, remotion, react, multi-agent, pipeline, social-media, react-animation, tts]
8|    category: creative
9|    related_skills: [remotion, humanizer, arxiv, web-content-extraction, youtube-content, whisper, audiocraft-audio-generation]
10|---
11|
12|# Video Pipeline Orchestrator
13|
14|Orchestrate a multi-agent video production pipeline using Hermes profiles + `delegate_task` (interactive) or Kanban (batch/automated). Covers the full lifecycle: research → script writing → humanizing → Remotion production → packaging & SEO. Works for both AI/ReAct explainers and general educational topics (see `references/non-ai-topic-adaptation.md`).
15|
16|## When to use
17|
18|- User wants to create a social media video (YouTube, X/Twitter, vertical short)
19|- User asks to build a ReAct reasoning animation or educational explainer
20|- User wants a multi-agent workflow for content production
21|- User mentions "video pipeline", "AI video production", or "agent video workflow"
22|- Any educational video topic — the pipeline adapts via marker translation
23|
24|## Architecture
25|
26|7 agents, 6 stages. Producer split into Narrator (TTS voiceover) + Renderer (Remotion coding/rendering), connected by `timing.json`:
27|
28|```
29|Director ── Stage 0: pipeline-plan.md (总体规划)
30|  ├── Researcher    (Stage 1: Deep research)
31|  ├── Writer         (Stage 2: Script creation)
32|  ├── Editor         (Stage 3: Humanizing)
33|  ├── Narrator       (Stage 4: TTS voiceover + timing.json)
34|  ├── Renderer       (Stage 5: Remotion scenes + MP4 output)
35|  └── Packager       (Stage 6: Titles, descriptions, SEO, thumbnails)
36|```
37|
38|**Key design decision: Remotion, not Manim.** See `references/remotion-vs-manim.md`.
39|
40|## Execution Modes
41|
42|| Mode | Trigger | Best for |
43||------|---------|----------|
44|| **delegate_task + chat broadcast (recommended)** | Director receives topic → sequential `delegate_task` calls, with progress announcements posted to group chat | Reliable, visible progress in group chat; no @mention dependency |
45|| **Hermes Studio Group Chat handoff** | User @mentions Director in a Studio group room; each agent @mentions the next profile when done | Visual agent-to-agent handoff — ⚠️ BROKEN in hermes-web-ui ≤ 0.6.10 (agent-to-agent @mentions silently fail). Use `delegate_task` + chat broadcast instead. |
46|| **Kanban** | Create dependency task chain → dispatcher auto-executes | Batch production, cron-triggered, long pipelines |
47|
48|Full Kanban setup: `references/kanban-setup-guide.md`.
49|Group Chat handoff setup: `references/group-chat-visual-handoff.md`.
50|
51|### Hermes Studio Group Chat: ⚠️ agent-to-agent @mention broken in ≤ 0.6.10
52|
53|**Do not rely on @mention handoff between agents in hermes-web-ui 0.6.10.** Testing confirmed: Director's messages containing `@video-researcher` are saved to the database and all agents are in the same room, but `processMentions` in the group chat server never dispatches to the next agent. This is a hermes-web-ui internal bug (all conditions in the `handleMessage` → `processMentions` chain appear to be met but no dispatch occurs).
54|
55|**Use the hybrid `delegate_task` + chat broadcast approach instead:**
56|
57|Director receives the topic via `@video-director` in the group chat, then:
58|1. Posts progress announcements to the group chat (for human visibility)
59|2. Uses `delegate_task` to dispatch each stage to the appropriate profile
60|3. After each delegate_task completes, posts a stage-completion summary to the group chat
61|
62|This gives the same visual progress tracking while avoiding the broken @mention mechanism.
63|
64|If you want visual agent-to-agent handoff in the future, check if a newer hermes-web-ui version has fixed the `processMentions` dispatch bug. The infrastructure (API servers, gateways, room setup) is all correct — only the Node.js @mention dispatch code is failing.
65|
66|Recommended room agent names must exactly match the @mentions:
67|
68|```
69|video-director → video-researcher → video-writer → video-editor → video-narrator → video-renderer → video-packager
70|```
71|
72|Handoff rules:
73|1. Each agent completes only its own stage, writes artifacts to `{VIDEO_PROJECTS_ROOT}/<project>/`, then posts a concise completion note.
74|2. The completion note must include: stage name, artifact absolute paths, short summary, next agent @mention, next input path, next output path, and quality requirements.
75|3. Use exact group-chat display names, e.g. `@video-researcher`; profile names and display names can differ, so standardize them when creating the room.
76|4. Avoid `@all` except for explicit review/checkpoint moments.
77|5. For pipelines longer than 4 agent-to-agent hops, raise `HERMES_GROUP_CHAT_MAX_AGENT_MENTION_DEPTH` to 8–10 and restart Hermes Studio/Web UI.
78|6. **Director selection phase: ONLY @video-researcher.** Do NOT @mention Writer, Editor, or any downstream agent in the topic-selection message. The chain is strictly sequential — each agent @mentions exactly the next one. Listing multiple agents or the full pipeline plan in one message causes all mentioned agents to self-dispatch simultaneously, corrupting the pipeline order.
79|
80|Full sequential chain:
81|```
82|@video-director  (topic selection → only @video-researcher)
83|  → @video-researcher  (research → @video-writer)
84|  → @video-writer       (script → @video-editor)
85|  → @video-editor       (humanize → @video-narrator)
86|  → @video-narrator     (TTS → @video-renderer)
87|  → @video-renderer     (render → @video-packager)
88|  → @video-packager     (package → @video-director for archival)
89|```
90|
91|Handoff template:
92|
93|```markdown
94|## 阶段完成
95|- 阶段：Research
96|- 产物：{VIDEO_PROJECTS_ROOT}/<project>/research-data.json
97|- 摘要：……
98|
99|## 下一步
100|@video-writer 请基于 research-data.json 创作 script-draft.md。
101|输入路径：{VIDEO_PROJECTS_ROOT}/<project>/research-data.json
102|输出路径：{VIDEO_PROJECTS_ROOT}/<project>/script-draft.md
103|关键要求：三栏格式、中文旁白、保留引用来源。
104|```
105|
106|### Kanban Quick Start
107|
108|```bash
109|hermes kanban boards create video-pipeline --name "视频管线"
110|hermes kanban boards switch video-pipeline
111|
112|T0=$(hermes kanban create --assignee video-director --skill plan "规划：{topic}" --json | jq -r .id)
113|T1=$(hermes kanban create --assignee video-researcher --parent $T0 --skill arxiv "调研：{topic}" --json | jq -r .id)
114|T2=$(hermes kanban create --assignee video-writer --parent $T1 "脚本：{topic}" --json | jq -r .id)
115|T3=$(hermes kanban create --assignee video-editor --parent $T2 --skill humanizer "润色：{topic}" --json | jq -r .id)
116|T4=$(hermes kanban create --assignee video-narrator --parent $T3 "配音：{topic}" --json | jq -r .id)
117|T5=$(hermes kanban create --assignee video-renderer --parent $T4 --skill remotion "渲染：{topic}" --json | jq -r .id)
118|T6=$(hermes kanban create --assignee video-packager --parent $T5 "包装：{topic}" --json | jq -r .id)
119|```
120|
121|Dispatcher (in default gateway, 60s tick) auto-promotes dependents `todo` → `ready`.
122|
123|## Startup Checklist
124|
125|- [ ] 创建项目目录：`{VIDEO_PROJECTS_ROOT}/<项目名>/`
126|- [ ] 评估选题价值（有争议性 > 纯科普 > 新闻搬运）
127|- [ ] **Stage 0: 创建 `pipeline-plan.md`（7 章节规划文档 → 项目目录）** — 这是全管线基础
128|- [ ] 确定目标平台和视频规格
129|- [ ] 确定预期时长（默认 YouTube 8-12 分钟 / 短视频 1-3 分钟）
130|- [ ] 确认 7 个 Profile 状态正常（`hermes profile list`）
131|- [ ] 加载本 Skill 和 `react-animation-components` Skill
132|
133|## Pipeline Stages
134|
135|多 Agent 协作视频创作管线由 7 个 Agent 依次接力完成，划分为以下 6 个阶段（外加 Stage 0 总体规划）。有关各阶段的详细运行定义、输入输出协议及规范，请点击查看对应的子模块文档：
136|
137|- **[Stage 0: Planning (总体规划)](stages/stage-0-planning.md)** (Director)
138|  - 收到选题后必须首先执行。产出 `pipeline-plan.md`（项目宪法），定义全管线选题角度、叙事及视觉基调。
139|- **[Stage 1: Research (深度调研)](stages/stage-1-research.md)** (Researcher)
140|  - 根据 Plan 策略检索 arXiv/Semantic Scholar/Web，产出结构化 `research-data.json`（提供 URL 出处与知识盲区）。
141|- **[Stage 2: Script Writing (故事脚本创作)](stages/stage-2-writing.md)** (Writer)
142|  - “小Lin说”式朋友聊天语气，故事推进。输出包含 VAS 视觉动画规格标签的 `script-draft.md`。
143|- **[Stage 3: Humanizing (脚本去 AI 化与口语润色)](stages/stage-3-humanizing.md)** (Editor)
144|  - 清除 29 项 AI 写作痕迹与翻译腔，进行朗读气口调整，**严格保护 VAS 标记不变**，输出 `script-final.md`。
145|- **[Stage 4: TTS Narration (旁白配音与时间生成)](stages/stage-4-narration.md)** (Narrator)
146|  - 提取纯旁白，应用行空停顿规则，通过 edge-tts 生成 `narration.mp3` 与 `narration.vtt`，输出时序桥接文件 `timing.json`。
147|- **[Stage 5: Remotion Rendering (Remotion 动效开发与渲染)](stages/stage-5-rendering.md)** (Renderer)
148|  - 依契约文件 `timing.json` 确定 Sequence 帧边界，使用 `react-animation-components` 组件库进行 VAS 参数至 Remotion 原语的映射开发，输出 youtube、vertical 视频，并无损截取 x-clip 精华。
149|- **[Stage 6: Packaging & SEO (分发渠道包装)](stages/stage-6-packaging.md)** (Packager)
150|  - 针对 YouTube (5维标题评分/章节/封面 brief)、B站 (互动弹幕引导)、X (Twitter thread) 生成最终的 `deliverables/` 分发包。
151|
152|### Director Final Review
153|
154|After Packager completes (or pipeline finishes in delegate_task mode), Director performs final quality review:
155|
156|1. Verify `deliverables/` directory completeness (all platform packages present, metadata.json valid)
157|2. Announce completion in group chat with a checklist covering all 6 stages, their outputs, and a quality summary
158|
279|### Rework Protocol & Version Control (返工协议与版本控制)
280|
281|当 Director 在质量关卡发现产物不合格时，将触发返工流程以确保管线产出质量：
282|
283|1. **返工判定与发起**：
284|   - **🟢 小修**：对于错别字或微调格式，由 Director 直接在执行中修复，不触发返工。
285|   - **🟡 中修**：逻辑漏洞、场景字数不足、缺少 VAS 参数等。由 Director 指示当前阶段 Agent 返工修改。
286|   - **🔴 大修**：完全跑题、风格严重偏离 Plan、捏造事实等。由 Director 判定退回到上游源头阶段重新制作。
287|
288|2. **版本命名规范**：
289|   - 首次交付产物命名为规范原名，如 `script-draft.md`。
290|   - 返工时的历史版本将被移动至项目目录的 `.versions/` 子目录下进行归档，命名为 `[原文件名].v1.md`，`[原文件名].v2.md`，以此类推。
291|   - 最终通过质量关卡并供下游消费的文件，始终使用无版本号的规范原名。
292|
293|3. **返工上限**：
294|   - 每个阶段最多允许自动返工 **2 次**。
295|   - 若第 3 次交付依旧不合格，Director 将暂停自动管线，发出警告请求人类介入干预。
296|
297|## Quality Gates
280|
281|| Gate | Check |
282||------|-------|
283|| Planning → Research | pipeline-plan.md 是否覆盖全部 7 章节？叙事策略是否明确？研究关键词是否精准？ |
284|| Research → Writing | Information density? Competing views? Missing papers? |
285|| Writing → Editing | 叙事弧线完整？Hook是否制造了好奇心？场景粒度合适（10-15场景）？每场景 ≥80字旁白？是否有类比/案例支撑？ |
286|| Editing → Narration | Read-aloud passed? AI-trace report clean? |
287|| Narration → Rendering | timing.json complete? VTT cue count matches? Pauses natural? |
288|| Rendering → Packaging | All versions rendered? Subtitles synced? BGM -18dB? |
289|| Packaging → Delivery | ≥3 titles with scores? Keywords cover primary+long-tail? Thumbnail prompt usable? |
290|
291|## Delegate Prompt Templates
292|
293|在 `delegate_task` 交互委派模式下，Director 发起子任务委派所使用的标准提示词 (Prompt) 模板已整理归纳至对应的子模块文件中。你可以点击查看并加载具体的委派提示词：
294|
295|- **[Delegate Researcher (调研员委派)](delegates/delegate-researcher.md)**：包含 arXiv 检索、对立观点与事实出处要求。
296|- **[Delegate Writer (编剧委派)](delegates/delegate-writer.md)**：包含“小Lin说”风格叙事指南与 VAS 规格要求。
297|- **[Delegate Editor (润色师委派)](delegates/delegate-editor.md)**：包含 29 条 AI 痕迹排查、中文口语化调整及 VAS 标记强制保护要求。
298|- **[Delegate Narrator (配音委派)](delegates/delegate-narrator.md)**：包含旁白提取、停顿控制、edge-tts 参数及 timing.json 结构要求。
299|- **[Delegate Renderer (渲染器委派)](delegates/delegate-renderer.md)**：包含 Remotion 项目结构、外挂字幕政策、VAS→Remotion 映射表及 ffmpeg 裁剪 x-clip 规范。
300|- **[Delegate Packager (包装师委派)](delegates/delegate-packager.md)**：包含 5 维度标题评分、YouTube 章节与 descriptions、B站/X包装规范。
301|
414|## Model Recommendations
415|
416|### Tier 1: Balanced (recommended)
417|
418|| Profile | Model | Provider | Why |
419||---------|-------|----------|-----|
420|| Director | `deepseek-v4-pro` | deepseek | Strong reasoning, low token burn |
421|| Researcher | `deepseek-v4-pro` | deepseek | Web synthesis, high-context |
422|| Writer | `qwen3.7-max` | openrouter | Best Chinese creative prose |
423|| Editor | `deepseek-v4-flash` | deepseek | Pattern matching, cheap |
424|| Narrator | `deepseek-v4-flash` | deepseek | Text formatting + TTS cmd, cheap |
425|| Renderer | `deepseek-v4-pro` | deepseek | React/TSX code generation |
426|| Packager | `deepseek-v4-flash` | deepseek | Light copywriting, cheap |
427|
428|### Tier 2: Single-provider (deepseek only)
429|
430|Director/Researcher/Writer/Renderer → `deepseek-v4-pro`; Editor/Narrator/Packager → `deepseek-v4-flash`.
431|
432|### Cost (per ~9 min video)
433|
434|| Profile | Tokens | Cost |
435||---------|--------|------|
436|| Director | ~5K | negligible |
437|| Researcher | ~50K | ~$0.15 |
438|| Writer | ~30K | ~$0.10 |
439|| Editor | ~80K | ~$0.01 |
440|| Narrator | ~10K | ~$0.002 |
441|| Renderer | ~90K | ~$0.27 |
442|| Packager | ~20K | ~$0.003 |
443|| **Total** | **~285K** | **~$0.53** |
444|
445|Tier 2 (all deepseek) drops to ~$0.35.
446|
447|## Non-AI Topic Adaptation
448|
449|For non-AI topics, translate markers to domain cues. Full guide: `references/non-ai-topic-adaptation.md`.
450|
451|| AI/ReAct | → | Financial |
452||----------|---|-----------|
453|| `[REACT_ANIM_CUE]` | → | `[PAYOFF_CHART]` |
454|| `[REACT_ANIM_CUE:thought]` | → | `[STRATEGY_DIAGRAM]` |
455|| `[REACT_ANIM_CUE:action]` | → | `[BREAKEVEN_CALC]` |
456|| `[REACT_ANIM_CUE:obs]` | → | `[RISK_REWARD_SCALE]` |
457|
458|## ReAct Animation Standards
459|
460|```css
461|--bg-primary: #1a1a2e; --color-agent: #58C4DD; --color-env: #F39C12;
462|--color-thought: #2ECC71; --color-action: #E74C3C; --color-obs: #9B59B6;
463|```
464|
465|Core components in `react-animation-components` skill.
466|
467|## TTS Voice Selection (Chinese)
468|
469|| Voice | Style | Use |
470||-------|-------|-----|
471|| `zh-CN-YunxiNeural` | Lively, sunshine | **Primary** |
472|| `zh-CN-YunyangNeural` | Professional | Formal topics |
473|| `zh-CN-YunjianNeural` | Passionate | High-energy |
474|
475|## Troubleshooting
476|
477|| Problem | Fix |
478||---------|-----|
479|| Researcher: too few papers | Broaden to web, add tech blogs |
480|| Writer: wrong length | ~100汉字 ≈ 30秒口播。8-10分钟视频 ≈ 10-15场景，每场景80-200字。检查叙事弧线是否完整。 |
481|| Writer: script too fragmented | Writer 写了一句一画面（50+微场景）。修复：要求每场景是一个完整故事节拍（80-200字），减少场景数到 10-15。在 Delegate prompt 中强调场景粒度。 |
482|| Writer: script lacks storytelling | 脚本像维基百科条目，缺乏叙事张力。修复：在 prompt 中要求制造 Hook 冲突、用类比推进、避免教科书式罗列。 |
483|| Editor: over-editing | Remove AI traces only, preserve facts |
484|| Narrator: VTT incomplete | Re-generate with --write-subtitles flag; verify last cue |
485|| Narrator: pauses unnatural | Adjust \n\n spacing; test with shorter paragraph groups |
486|| Renderer: render fails | node ≥18, ffmpeg ≥4.4, clear cache |
487|| Renderer: staticFile 404 | Check public/narration.mp3 exists; use staticFile() not bare string |
488|| Renderer: can't parse VAS visual descriptions | 脚本中的 [画面]/[图表]/[动画] 标签缺少 entrance/dur 参数，或使用了旧格式的模糊描述。修复：(1) 让 Writer 按 VAS 规格重新生成；(2) Renderer 自行加载 `references/writer-visual-animation-guide.md` 做兜底映射推断。 |
489|| Renderer: animation timing doesn't match narration | VAS 中的 dur 参数是元素动画时长，不是场景总时长。场景总时长始终从 timing.json 取——检查 Sequence 是否正确使用了 timing.json 值，而非 VAS dur。 |
490|| Writer: visual descriptions too vague | ✅ VAS 已实施。Writer 用了"弹出""飘出""对比动画"等模糊词说明 SOUL.md 或 Delegate prompt 未生效。修复：确保 `video-writer/SOUL.md` 和 Delegate Writer prompt 都包含了 VAS 规格要求（每个标签必带 entrance + dur）。参考：`references/writer-visual-animation-guide.md`。 |
491|| Writer: script lacks VAS animation parameters | Writer 输出了旧格式的 `[画面]` 标签（无 entrance/dur）。修复：SOUL.md 和 prompt 强调 `entrance=...` 和 `dur=Nf` 必填。检查 Delegate Writer 是否加载了 `writer-visual-animation-guide.md`。 |
492|| TTS unnatural | Switch voice, adjust rate ±5% |
493|| BGM fails | Fallback: Pixabay/YouTube Audio Library |
494|| Skill not found | `hermes skills list \| grep <name>` |
495|| Packager: weak titles | Feed back scoring dimensions; Director writes 1 example |
496|| Writer: script contains timecodes | Writer wrote estimated timestamps instead of scene names. Fix: Use Markdown section format `## {场景名} — {概括}`. Scene names (Hook, Act1_A...) are mapped to real timing by Narrator's timing.json. |
497|| Writer: script uses old table format | Writer 用了旧的三栏表格格式。修复：输出必须是 Markdown section 格式——`## {场景名} — {概括}` + 旁白段落 + `[画面]` 标签。不要表格。 |
498|| Gateway crash-loop: "Telegram bot token already in use" | **Remove** `TELEGRAM_BOT_TOKEN` from each video profile's `.env` (comment it out or delete the line). Do NOT use `gateway.skip_platforms` — this config key does not exist in Hermes and has no effect. Studio group chat uses the API Server adapter, not Telegram. |
501|| Group chat: agent behavior change not taking effect | 只修改了 SKILL.md 的 Delegate prompt，但群聊模式下 Agent 用的是自己的 `SOUL.md`。修复：同步修改 `~/.hermes/profiles/video-<role>/SOUL.md`。SKILL.md 的 delegate prompt 仅在 `delegate_task` 子代理模式生效。详见 Pitfalls 中的 SOUL.md 二元性条目。 |
502|| Group chat: delegate_task uses old SKILL.md | 修改了 canonical SKILL.md 但 profile 本地副本未同步。修复：同步 canonical SKILL.md 到所有 `~/.hermes/profiles/video-*/skills/creative/video-studio-orchestrator/SKILL.md`。详见 Pitfalls 中的 profile 同步条目。 |
503|| Studio: "@profile not in room" | **Most common cause: profile not added as an agent in the Hermes Studio room** (Web UI operation). Prerequisites to verify: (1) Each profile has its own gateway service installed+started. (2) `TELEGRAM_BOT_TOKEN` removed from each video profile's `.env`. (3) Each profile has independent `.env` (not symlink) with `GATEWAY_ALLOW_ALL_USERS=true`. (4) `HERMES_GROUP_CHAT_MAX_AGENT_MENTION_DEPTH=8` set. (5) Verify with `hermes profile list`. **If all green, the fix is: open Hermes Studio → add each video-* profile as an agent in the group chat room.** Full setup: `references/group-chat-visual-handoff.md`. Diagnostic checklist: `references/group-chat-diagnostics.md`. |
504|
505|## Project Archive
506|
507|```
508|{VIDEO_PROJECTS_ROOT}/{project}/
509|├── pipeline-plan.md      ← Stage 0 总体规划（全管线基础）
510|├── research-data.json, script-draft.md, script-final.md, edit-report.md
511|├── remotion-project/  (source + out/*.mp4)
512|├── deliverables/      (metadata.json + youtube/ x-twitter/ bilibili/)
513|└── README.md
514|```
515|
516|## Pitfalls
517|
518|- **⚠️ Stage 0 is mandatory — 不能跳过规划。** Director 收到选题后必须先创建 pipeline-plan.md。直接派发调研任务会导致后续 Agent 缺乏全局策略指导，各阶段输出风格不一致。如果用户跳过 Director 直接调用其他 Agent，Agent 会优雅降级（检测 plan 文件不存在时按通用模式工作并注明）。
519|- **⚠️ Graceful-degradation pattern for optional artifacts:** When an agent depends on an upstream artifact (like `pipeline-plan.md`) that may not exist in ad-hoc usage, use a conditional check: 「先检查 `X` 是否存在 → 存在则读取并遵循 → 不存在则按通用模式工作 + 标注 '⚠️ 未检测到 X'」。Never use unconditional `read_file` that fails and wastes tokens when users invoke agents directly outside the pipeline. This pattern applies to any optional pipeline artifact — not just plan files.
520|- **⚠️ TTS-First is NON-NEGOTIABLE.** Script timestamps are estimates. Actual speech speed varies per sentence. The pipeline MUST: (1) format narration text with natural pause markers (double/triple newlines, ellipses), (2) generate TTS with `--write-subtitles narration.vtt`, (3) parse VTT for actual timestamps, (4) build Remotion scene timing from VTT, not from the script's timestamp column. Building animation before recording narration guarantees audio-video desync.
521|- **Natural pauses make TTS sound human:** Between paragraphs use `\n\n` (~500ms pause), between sections use `\n\n\n` (~800ms), for emphasis use `...` (~300ms). Without these, TTS reads like a robot on fast-forward.
522|- **Remotion `<Audio>` uses `staticFile()`**: `import { staticFile } from 'remotion'` then `<Audio src={staticFile("narration.mp3")} />`. Bare strings fail in render mode.
523|- **Renderer delegate_task may timeout**: 9 min video = ~35 min render. Split: Renderer builds the project, Director runs the final render.
524|- **Remotion render syntax**: `npx remotion render <CompositionId> out/file.mp4` — CompositionId first, output second.
525|- **BGM volume**: -18dB below narration.
526|- **`delegate_task` context loss**: Pass full context in each delegation.
527|- **Group Chat visual handoff vs delegate_task**: If the user expects to see multiple Profiles handing work to each other in Hermes Studio, do not have Director use `delegate_task` internally. Agent-to-agent visibility requires each assistant message to include an exact `@agent-name` mention so the group-chat mention router triggers the next Profile.
528|- **Group Chat mention depth**: Studio group chat limits recursive agent mentions to prevent loops (default is 4). A full video pipeline can exceed this (`Director → Researcher → Writer → Editor → Narrator → Renderer → Packager`). Set `HERMES_GROUP_CHAT_MAX_AGENT_MENTION_DEPTH=8` or `10` and restart Studio/Web UI for visual handoff rooms.
529|- **Group Chat name mismatch**: Mentions match the room agent display name. Standardize room names to profile names (`video-researcher`, etc.) or the chain may silently stop after the first agent.
530|- **Profile model config**: New profiles have no model. Set via `hermes -p <profile> config set model.default <model>`.
531|- **`hermes config show` does NOT accept arguments**: `hermes config show gateway.skip_platforms` produces `error: unrecognized arguments`. Use `hermes config show` (no args) to see the full config, then read or grep for specific keys. Alternatively, read the raw YAML: `cat ~/.hermes/profiles/<profile>/config.yaml`.
532|- **Kanban prerequisites**: Default gateway must be running. Profiles need models + API keys.
533|- **⚠️ Multi-gateway Telegram conflict**: Running 7 profile gateways with the same Telegram bot token causes all to crash-loop. Fix: Remove `TELEGRAM_BOT_TOKEN` from each video profile's `.env` — comment it out with `#` prefix or delete the line entirely. Studio group chat uses the API Server adapter, which does not require Telegram. ⚠️ `gateway.skip_platforms` does NOT exist in Hermes — do not use it.
534|- **⚠️ Multi-gateway API Server requirement**: For Studio group chat to dispatch @mentions to a profile, each profile's gateway MUST have `API_SERVER_ENABLED=true` and `API_SERVER_KEY=<unique_key>` in its `.env` file, plus a unique `API_SERVER_PORT` (default 8642 — assign unique ports like 8650-8656). Without this, the gateway shows "No messaging platforms enabled" and group chat @mentions won't reach the profile. The API server is the transport layer that Studio uses to communicate with profile gateways; it is separate from messaging platforms (Telegram/Discord/etc.).
535|- **⚠️ Profile .env files must be copies, not symlinks**: Symlinking `~/.hermes/profiles/<name>/.env → ~/.hermes/.env` causes writes to pollute the global config. Always `cp` the global `.env` to each profile directory.
536|- **⚠️ Director must NOT @mention multiple agents in one message**: In group-chat @mention mode, the Director's topic selection message must contain ONLY `@video-researcher`. Mentioning `@video-writer` or listing the full pipeline plan in the same message causes all mentioned agents to self-dispatch simultaneously, corrupting the sequential pipeline order. The chain is: each agent @mentions exactly one next agent when done.
537|- **⚠️ Writer 脚本碎片化：** 最常见问题——一句一画面，50+ 微场景。根因是"≤25字"旧约束或 Writer 没有收到叙事指导。修复：(1) 明确要求每场景 80-200字，(2) 要求"一个场景 = 一个故事节拍"而非一句话，(3) 规定 8-10分钟视频 = 10-15场景。见 Delegate Writer prompt 的完整方法论。
538|- **⚠️ Writer 产物像教学课件：** 罗列要点、教科书语调、缺乏个性和张力。修复：在 prompt 中注入小Lin说风格引导——用类比和比喻、朋友聊天感、具体案例、偶尔反问。禁止"大家好欢迎"、"第一点...第二点..."等套话。
539|- **⚠️ Writer must NOT write timecodes in scripts**: Use Markdown section format: `## {场景名} — {概括}`. Scene names (Hook, Act1_A, Act1_B...) are mapped to real timing by Narrator's TTS recording → VTT parsing → timing.json. Writer-estimated timecodes are misleading and will be overwritten. See Stage 2 for the correct format and example.
540|- **⚠️ Modifying agent behavior requires BOTH SKILL.md + SOUL.md**: The Delegate prompt templates in this SKILL.md only apply when Director uses `delegate_task` to spawn subagents. In **Kanban group chat mode** (the user's preferred mode), each agent runs with its own profile's `SOUL.md` as its persona — the delegate_task prompts are never seen. Any behavioral change (e.g., new output format, new constraints, new animation specs) MUST be written into both places: (1) the Delegate prompt template in this SKILL.md, and (2) the corresponding profile's `SOUL.md` file (`~/.hermes/profiles/video-<role>/SOUL.md`). Failing to update SOUL.md means the change silently does nothing in group chat mode.
541|- **⚠️ Profile-local SKILL.md copies must be synced after modifying the canonical skill**: Each video-* profile has its own copy of this SKILL.md under `~/.hermes/profiles/video-<role>/skills/creative/video-studio-orchestrator/SKILL.md` — they are NOT symlinks. Full workflow for multi-agent skill changes (plan → canonical → SOULs → sync → verify): `references/multi-agent-change-workflow.md`. Quick sync:
542|  ```bash
543|  SRC=~/.hermes/skills/creative/video-studio-orchestrator/SKILL.md
544|  for dir in video-director video-editor video-narrator video-packager video-renderer video-researcher video-writer; do
545|    cp "$SRC" ~/.hermes/profiles/$dir/skills/creative/video-studio-orchestrator/SKILL.md
546|  done
547|  ```
548|  Same for any new reference files added under `references/`. Failing to sync means the profiles load stale copies with old Delegate prompts and missing VAS specs, silently producing incorrect behavior in delegate_task mode.
549|- **⚠️ Writer visual descriptions are too vague for Renderer**: ✅ **已修复 (VAS 已实施)**。Writer 现在输出 VAS 规格化视觉描述（每个标签携带 `entrance=` + `dur=Nf` 参数）。Writer 加载 `references/writer-visual-animation-guide.md` 获取完整参数表。Renderer 将 VAS 参数直接映射到 Remotion 动画原语。若出现问题，检查 Delegate Writer/Renderer prompt 和 `video-writer/SOUL.md`、`video-renderer/SOUL.md` 是否已更新。
550|
551|## Scripts
552|
553|| Script | Usage |
554||--------|-------|
555|| `scripts/extract_narration.py` | Extract narration from Markdown section scripts (cross-platform Python) |
556|| `scripts/vtt_to_subtitles.py` | Convert edge-tts VTT to Remotion `subtitles.ts` with frame-accurate timing |
557|
558|## Reference Files
559|
560|| File | Content |
561||------|---------|
562|| `references/pipeline-plan-template.md` | Stage 0 规划模板 — 7 章节 pipeline-plan.md，Director 创建后作为全管线基础 |
563|| `references/multi-agent-change-workflow.md` | **修改多 Agent Skill 的标准流程** — Plan → canonical SKILL.md → 7 SOUL.md → references → sync profile copies → verify。含优雅降级模式 |
564|| `references/tts-first-narration-guide.md` | Full TTS-First workflow with pause techniques and voice selection |
565|| `references/non-ai-topic-adaptation.md` | Marker translation for non-AI topics (financial, medical, etc.) |
566|| `references/remotion-vs-manim.md` | Why Remotion over Manim for this pipeline |
567|| `references/kanban-setup-guide.md` | Profile model config + gateway setup for Kanban mode |
568|| `references/group-chat-visual-handoff.md` | Hermes Studio group-chat mode: exact @mentions, visible handoff chain, mention-depth setting |
569|| `references/group-chat-diagnostics.md` | Diagnostic checklist for "not in room" — gateway state, .env, API server ports, Web UI room membership |
570|| `troubleshooting/known-bugs.md` | **已知 Bug 与临时变通方案** — 汇总多 Profile API Key、Telegram 端口冲突及 @mention 路由失效等问题的处理指南 |
571|| `references/writer-visual-animation-guide.md` | **VAS 视觉动画规格指南** — Writer ↔ Renderer 共享词汇。完整参数表、组件映射、前后对比示例、自检清单。 |
572|