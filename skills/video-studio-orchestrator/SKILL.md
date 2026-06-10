---
name: video-studio-orchestrator
description: "Multi-Agent video production pipeline: research → writing → editing → narration → rendering → packaging. 7 agents, 6 stages. Producer split into Narrator (TTS) + Renderer (Remotion) with timing.json handoff."
version: 2.3.0
metadata:
  hermes:
    tags: [video, remotion, react, multi-agent, pipeline, social-media, react-animation, tts]
    category: creative
    related_skills: [remotion, humanizer, arxiv, web-content-extraction, youtube-content, whisper, audiocraft-audio-generation]
---

# Video Pipeline Orchestrator

Orchestrate a multi-agent video production pipeline using Hermes profiles + `delegate_task` (interactive) or Kanban (batch/automated). Covers the full lifecycle: research → script writing → humanizing → Remotion production → packaging & SEO. Works for both AI/ReAct explainers and general educational topics (see `references/non-ai-topic-adaptation.md`).

## When to use

- User wants to create a social media video (YouTube, X/Twitter, vertical short)
- User asks to build a ReAct reasoning animation or educational explainer
- User wants a multi-agent workflow for content production
- User mentions "video pipeline", "AI video production", or "agent video workflow"
- Any educational video topic — the pipeline adapts via marker translation

## Architecture

7 agents, 6 stages. Producer split into Narrator (TTS voiceover) + Renderer (Remotion coding/rendering), connected by `timing.json`:

```
Director ── Stage 0: pipeline-plan.md (总体规划)
  ├── Researcher    (Stage 1: Deep research)
  ├── Writer         (Stage 2: Script creation)
  ├── Editor         (Stage 3: Humanizing)
  ├── Narrator       (Stage 4: TTS voiceover + timing.json)
  ├── Renderer       (Stage 5: Remotion scenes + MP4 output)
  └── Packager       (Stage 6: Titles, descriptions, SEO, thumbnails)
```

**Key design decision: Remotion, not Manim.** See `references/remotion-vs-manim.md`.

## Execution Modes

| Mode | Trigger | Best for |
|------|---------|----------|
| **delegate_task + chat broadcast (recommended)** | Director receives topic → sequential `delegate_task` calls, with progress announcements posted to group chat | Reliable, visible progress in group chat; no @mention dependency |
| **Hermes Studio Group Chat handoff** | User @mentions Director in a Studio group room; each agent @mentions the next profile when done | Visual agent-to-agent handoff — ⚠️ BROKEN in hermes-web-ui ≤ 0.6.10 (agent-to-agent @mentions silently fail). Use `delegate_task` + chat broadcast instead. |
| **Kanban** | Create dependency task chain → dispatcher auto-executes | Batch production, cron-triggered, long pipelines |

⚠️ **Agent-to-agent @mention dispatch is broken in hermes-web-ui ≤ 0.6.10** (root-cause analysis: `troubleshooting/known-bugs.md` §3). Recommended hybrid: Director receives the topic via `@video-director` in group chat, posts progress announcements to the room for human visibility, and dispatches each stage via `delegate_task` behind the scenes — same visual tracking, no broken @mention routing.

Mode setup guides (room membership, per-profile gateways, mention depth, handoff templates, sequential @mention rules):

- Group Chat handoff: `references/group-chat-visual-handoff.md`
- Group Chat diagnostics ("@profile not in room" etc.): `references/group-chat-diagnostics.md`
- Kanban (board setup, 7-task chain, dispatcher): `references/kanban-setup-guide.md`

## Startup Checklist

- [ ] 创建项目目录：`{VIDEO_PROJECTS_ROOT}/<项目名>/`
- [ ] 评估选题价值（有争议性 > 纯科普 > 新闻搬运）
- [ ] **Stage 0: 创建 `pipeline-plan.md`（7 章节规划文档 → 项目目录）** — 这是全管线基础
- [ ] 确定目标平台和视频规格
- [ ] 确定预期时长（默认 YouTube 8-12 分钟 / 短视频 1-3 分钟）
- [ ] 确认 7 个 Profile 状态正常（`hermes profile list`）
- [ ] 加载本 Skill 和 `react-animation-components` Skill

## Pipeline Stages

多 Agent 协作视频创作管线由 7 个 Agent 依次接力完成，划分为以下 6 个阶段（外加 Stage 0 总体规划）。有关各阶段的详细运行定义、输入输出协议及规范，请点击查看对应的子模块文档：

- **[Stage 0: Planning (总体规划)](stages/stage-0-planning.md)** (Director)
  - 收到选题后必须首先执行。产出 `pipeline-plan.md`（项目宪法），定义全管线选题角度、叙事及视觉基调。
- **[Stage 1: Research (深度调研)](stages/stage-1-research.md)** (Researcher)
  - 根据 Plan 策略检索 arXiv/Semantic Scholar/Web，产出结构化 `research-data.json`（提供 URL 出处与知识盲区）。
- **[Stage 2: Script Writing (故事脚本创作)](stages/stage-2-writing.md)** (Writer)
  - "小Lin说"式朋友聊天语气，故事推进。输出包含 VAS 视觉动画规格标签的 `script-draft.md`。
- **[Stage 3: Humanizing (脚本去 AI 化与口语润色)](stages/stage-3-humanizing.md)** (Editor)
  - 清除 29 项 AI 写作痕迹与翻译腔，进行朗读气口调整，**严格保护 VAS 标记不变**，输出 `script-final.md`。
- **[Stage 4: TTS Narration (旁白配音与时间生成)](stages/stage-4-narration.md)** (Narrator)
  - 提取纯旁白，应用行空停顿规则，通过 edge-tts 生成 `narration.mp3` 与 `narration.vtt`，输出时序桥接文件 `timing.json`。
- **[Stage 5: Remotion Rendering (Remotion 动效开发与渲染)](stages/stage-5-rendering.md)** (Renderer)
  - 依契约文件 `timing.json` 确定 Sequence 帧边界，使用 `react-animation-components` 组件库进行 VAS 参数至 Remotion 原语的映射开发，输出 youtube、vertical 视频，并无损截取 x-clip 精华。
- **[Stage 6: Packaging & SEO (分发渠道包装)](stages/stage-6-packaging.md)** (Packager)
  - 针对 YouTube (5维标题评分/章节/封面 brief)、B站 (互动弹幕引导)、X (Twitter thread) 生成最终的 `deliverables/` 分发包。

### Director Final Review

After Packager completes (or pipeline finishes in delegate_task mode), Director performs final quality review:

1. Verify `deliverables/` directory completeness (all platform packages present, metadata.json valid)
2. Announce completion in group chat with a checklist covering all 6 stages, their outputs, and a quality summary

### Rework Protocol & Version Control (返工协议与版本控制)

当 Director 在质量关卡发现产物不合格时，将触发返工流程以确保管线产出质量：

1. **返工判定与发起**：
   - **🟢 小修**：对于错别字或微调格式，由 Director 直接在执行中修复，不触发返工。
   - **🟡 中修**：逻辑漏洞、场景字数不足、缺少 VAS 参数等。由 Director 指示当前阶段 Agent 返工修改。
   - **🔴 大修**：完全跑题、风格严重偏离 Plan、捏造事实等。由 Director 判定退回到上游源头阶段重新制作。

2. **版本命名规范**：
   - 首次交付产物命名为规范原名，如 `script-draft.md`。
   - 返工时的历史版本将被移动至项目目录的 `.versions/` 子目录下进行归档，命名为 `[原文件名].v1.md`，`[原文件名].v2.md`，以此类推。
   - 最终通过质量关卡并供下游消费的文件，始终使用无版本号的规范原名。

3. **返工上限**：
   - 每个阶段最多允许自动返工 **2 次**。
   - 若第 3 次交付依旧不合格，Director 将暂停自动管线，发出警告请求人类介入干预。

## Quality Gates

| Gate | Check |
|------|-------|
| Planning → Research | pipeline-plan.md 是否覆盖全部 7 章节？叙事策略是否明确？研究关键词是否精准？ |
| Research → Writing | Information density? Competing views? Missing papers? |
| Writing → Editing | 叙事弧线完整？Hook是否制造了好奇心？场景粒度合适（10-15场景）？每场景 ≥80字旁白？是否有类比/案例支撑？ |
| Editing → Narration | Read-aloud passed? AI-trace report clean? |
| Narration → Rendering | timing.json complete? VTT cue count matches? Pauses natural? |
| Rendering → Packaging | All versions rendered? Subtitles synced? BGM -18dB? |
| Packaging → Delivery | ≥3 titles with scores? Keywords cover primary+long-tail? Thumbnail prompt usable? |

## Delegate Prompt Templates

在 `delegate_task` 交互委派模式下，Director 发起子任务委派所使用的标准提示词 (Prompt) 模板已整理归纳至对应的子模块文件中。你可以点击查看并加载具体的委派提示词：

- **[Delegate Researcher (调研员委派)](delegates/delegate-researcher.md)**：包含 arXiv 检索、对立观点与事实出处要求。
- **[Delegate Writer (编剧委派)](delegates/delegate-writer.md)**：包含"小Lin说"风格叙事指南与 VAS 规格要求。
- **[Delegate Editor (润色师委派)](delegates/delegate-editor.md)**：包含 29 条 AI 痕迹排查、中文口语化调整及 VAS 标记强制保护要求。
- **[Delegate Narrator (配音委派)](delegates/delegate-narrator.md)**：包含旁白提取、停顿控制、edge-tts 参数及 timing.json 结构要求。
- **[Delegate Renderer (渲染器委派)](delegates/delegate-renderer.md)**：包含 Remotion 项目结构、外挂字幕政策、VAS→Remotion 映射表及 ffmpeg 裁剪 x-clip 规范。
- **[Delegate Packager (包装师委派)](delegates/delegate-packager.md)**：包含 5 维度标题评分、YouTube 章节与 descriptions、B站/X包装规范。

## Model Recommendations

### Tier 1: Balanced (recommended)

| Profile | Model | Provider | Why |
|---------|-------|----------|-----|
| Director | `deepseek-v4-pro` | deepseek | Strong reasoning, low token burn |
| Researcher | `deepseek-v4-pro` | deepseek | Web synthesis, high-context |
| Writer | `qwen3.7-max` | openrouter | Best Chinese creative prose |
| Editor | `deepseek-v4-flash` | deepseek | Pattern matching, cheap |
| Narrator | `deepseek-v4-flash` | deepseek | Text formatting + TTS cmd, cheap |
| Renderer | `deepseek-v4-pro` | deepseek | React/TSX code generation |
| Packager | `deepseek-v4-flash` | deepseek | Light copywriting, cheap |

### Tier 2: Single-provider (deepseek only)

Director/Researcher/Writer/Renderer → `deepseek-v4-pro`; Editor/Narrator/Packager → `deepseek-v4-flash`.

### Cost (per ~9 min video)

| Profile | Tokens | Cost |
|---------|--------|------|
| Director | ~5K | negligible |
| Researcher | ~50K | ~$0.15 |
| Writer | ~30K | ~$0.10 |
| Editor | ~80K | ~$0.01 |
| Narrator | ~10K | ~$0.002 |
| Renderer | ~90K | ~$0.27 |
| Packager | ~20K | ~$0.003 |
| **Total** | **~285K** | **~$0.53** |

Tier 2 (all deepseek) drops to ~$0.35.

## Non-AI Topic Adaptation

For non-AI topics, translate markers to domain cues. Full guide: `references/non-ai-topic-adaptation.md`.

| AI/ReAct | → | Financial |
|----------|---|-----------|
| `[REACT_ANIM_CUE]` | → | `[PAYOFF_CHART]` |
| `[REACT_ANIM_CUE:thought]` | → | `[STRATEGY_DIAGRAM]` |
| `[REACT_ANIM_CUE:action]` | → | `[BREAKEVEN_CALC]` |
| `[REACT_ANIM_CUE:obs]` | → | `[RISK_REWARD_SCALE]` |

## ReAct Animation Standards

```css
--bg-primary: #1a1a2e; --color-agent: #58C4DD; --color-env: #F39C12;
--color-thought: #2ECC71; --color-action: #E74C3C; --color-obs: #9B59B6;
```

Core components in `react-animation-components` skill. TTS voice selection and pause rules: `references/tts-first-narration-guide.md`.

## Non-Negotiables

完整 Pitfalls 列表与各阶段问题速查表：`troubleshooting/pipeline-troubleshooting.md`。其中四条铁律必须始终遵守：

1. **Stage 0 不能跳过** — Director 必须先产出 `pipeline-plan.md`，下游 Agent 对缺失的 plan 文件优雅降级。
2. **TTS-First** — 动画时序永远来自 TTS 实录的 VTT/timing.json，绝不使用脚本里的估算时间戳。完整流程：`references/tts-first-narration-guide.md`。
3. **修改 Agent 行为必须同时改 Delegate prompt 和对应 profile 的 `SOUL.md`** — 两种运行模式各读一处，漏改即静默失效。流程：`references/multi-agent-change-workflow.md`。
4. **修改 canonical skill 后必须同步 profile 本地副本** — profile 下的 SKILL.md 是复制而非软链接。

## Project Archive

```
{VIDEO_PROJECTS_ROOT}/{project}/
├── pipeline-plan.md      ← Stage 0 总体规划（全管线基础）
├── research-data.json, script-draft.md, script-final.md, edit-report.md
├── remotion-project/  (source + out/*.mp4)
├── deliverables/      (metadata.json + youtube/ x-twitter/ bilibili/)
└── README.md
```

## Scripts

| Script | Usage |
|--------|-------|
| `scripts/extract_narration.py` | Extract narration from Markdown section scripts (cross-platform Python) |
| `scripts/vtt_to_subtitles.py` | Convert edge-tts VTT to Remotion `subtitles.ts` with frame-accurate timing |

## Reference Files

| File | Content |
|------|---------|
| `references/pipeline-plan-template.md` | Stage 0 规划模板 — 7 章节 pipeline-plan.md，Director 创建后作为全管线基础 |
| `references/multi-agent-change-workflow.md` | **修改多 Agent Skill 的标准流程** — Plan → canonical SKILL.md → 7 SOUL.md → references → sync profile copies → verify。含优雅降级模式 |
| `references/tts-first-narration-guide.md` | Full TTS-First workflow with pause techniques and voice selection |
| `references/non-ai-topic-adaptation.md` | Marker translation for non-AI topics (financial, medical, etc.) |
| `references/remotion-vs-manim.md` | Why Remotion over Manim for this pipeline |
| `references/kanban-setup-guide.md` | Profile model config + gateway setup + 7-task chain for Kanban mode |
| `references/group-chat-visual-handoff.md` | Hermes Studio group-chat mode: exact @mentions, visible handoff chain, handoff templates, mention-depth setting |
| `references/group-chat-diagnostics.md` | Diagnostic checklist for "not in room" — gateway state, .env, API server ports, Web UI room membership |
| `references/writer-visual-animation-guide.md` | **VAS 视觉动画规格指南** — Writer ↔ Renderer 共享词汇。完整参数表、组件映射、前后对比示例、自检清单。 |
| `troubleshooting/pipeline-troubleshooting.md` | **阶段问题速查表 + Pitfalls 全集** — Writer 碎片化、VAS 参数缺失、群聊派发、profile 同步等 |
| `troubleshooting/known-bugs.md` | **已知 Bug 与临时变通方案** — 汇总多 Profile API Key、Telegram 端口冲突及 @mention 路由失效等问题的处理指南 |
