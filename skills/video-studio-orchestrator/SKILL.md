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
135|### Stage 0: Planning (Director — 必须先执行)
136|
137|**Input:** Topic from user | **Output:** `pipeline-plan.md`
138|
139|Director 收到选题后，不能直接派发任务。必须先加载 `plan` skill 方法论，创建 7 章节规划文档。这是全管线的"宪法"——每个 Agent 在开始自己的阶段前，必须先读 pipeline-plan.md 对齐全局策略。
140|
141|**Plan 7 章节：**
142|1. **选题评估**：话题价值、目标观众、差异化角度、风险
143|2. **叙事策略**：核心故事线（一句话）、Hook 策略、Aha 时刻分布、情感曲线、参照风格
144|3. **研究策略**：核心搜索关键词（中/英文）、必查来源、对立观点要求
145|4. **视觉风格**：配色方案、动画风格、参考视觉
146|5. **管线分工**：6 个 Stage 的输入→输出→质量标准表
147|6. **质量红线**：不可接受的底线
148|7. **风险与预案**：概率评估 + 应急预案
149|
150|Plan 模板见 `references/pipeline-plan-template.md`。
151|
152|**Plan 在两种模式中的传递：**
153|- **delegate_task 模式：** 每个 delegate 的 `context` 首行 = `pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md`
154|- **Kanban 模式：** T0 任务产出 pipeline-plan.md，后续任务的 body 中引用路径
155|- **群聊 @mention 模式：** Director 创建 plan 后在 @researcher 消息中注明 plan 路径
156|
157|### Stage 1: Research (Director → Researcher)
158|
159|**Input:** Topic keywords | **Output:** `research-data.json`
160|
161|Researcher uses `arxiv`, `web-content-extraction`, `youtube-content`, Semantic Scholar. Output JSON with: `core_papers`, `key_facts` (with source URLs), `competing_views`, `knowledge_gaps`, `timeline`.
162|
163|### Stage 2: Script Writing (Director → Writer)
164|
165|**Input:** `research-data.json` | **Output:** `script-draft.md` (three-column format)
166|
167|**风格：小Lin说式故事叙述** — 用类比、比喻和具体案例讲述复杂概念。口播语调像朋友聊天，而非教学课件。每段旁白应有完整的起承转合，而非一句一个画面。
168|
169|结构：Hook（制造好奇/冲突, ~30s）→ 铺垫（引入背景/问题, ~20%）→ 核心展开（层层深入, ~50%）→ 总结/延伸（联系现实, ~30%）
170|
171|**场景粒度：** 8-10分钟视频 ≈ 10-15个场景。每个场景是一个"故事节拍"——一个完整的概念、一组数据对比、或一段因果推演。旁白 80-200字/场景，自然段落。
172|
173|动画标记：AI主题用 `[REACT_ANIM_CUE:*]`；其他领域用 `references/non-ai-topic-adaptation.md` 的领域标记。
174|
175|**输出格式：Markdown Section 脚本**（非表格）。每个 `## {场景名} — {概括}` 是一个场景，内含旁白段落 + `[画面]`/`[图表]`/`[动画]` 视觉标签。
176|
177|```markdown
178|## Hook — 比特币的疯狂
179|
180|你有没有想过，如果你在 2009 年买了 100 块钱比特币，今天你有 3 个亿。但如果你在 2011 年买了——对不起，你大概率在 2013 年就卖了。
181|
182|[画面:entrance=fade-in,dur=30f,pos=center]
183|  - 比特币价格曲线暴涨 | animate=line-draw, color=#F7931A, dur=25f
184|  - "¥100 → ¥300,000,000" | entrance=char-pop(60px), stagger=4f, color=#FFD700, delay=35f
185|[图表:entrance=slide-up(50px),dur=20f]
186|  - 早期比特币交易量 vs 价格对比 | animate=bars-grow, color=#F7931A
187|
188|## Act1_A — 为什么是 2009 年
189|
190|2009 年，金融危机刚结束。雷曼兄弟倒掉一年后，全世界对银行系统失去了信任。就在这个时候，一个叫中本聪的人在密码学邮件列表里发了一篇只有 9 页的论文...
191|
192|[画面:entrance=fade-in,dur=40f,pos=fullscreen]
193|  - 2008-2009 金融危机新闻标题蒙太奇 | entrance=fade-in, stagger=8f
194|[动画:entrance=slide-up(80px),dur=30f]
195|  - 密码学邮件列表界面 | entrance=fade-in, dur=15f
196|  - 比特币白皮书飞出 | entrance=slide-up(100px), delay=20f, dur=20f
197|```
198|
199|**视觉标签规范 (VAS)：**
200|
201|每个标签必须包含 `entrance`（入场动画类型）和 `dur`（持续帧数，30fps）。详细参数表见 `references/writer-visual-animation-guide.md`。
202|
203|```
204|基本格式：[TYPE:entrance=动画类型,dur=Nf,pos=位置]
205|```
206|
207|| 标签 | 用途 | 常用 entrance |
208||------|------|--------------|
209|| `[画面:entrance=fade-in,dur=30f]` | 一般场景/背景画面 | fade-in, slide-up(Npx) |
210|| `[图表:entrance=slide-up(60px),dur=25f]` | 数据可视化 | slide-up, fade-in, spring-scale |
211|| `[动画:entrance=spring-scale,dur=20f]` | 复杂动效元素 | spring-scale, char-pop(Npx) |
212|| `[转场:type=crossfade,dur=30f]` | 场景间过渡 | crossfade, slide-push-left, zoom-in |
213|| `[REACT_ANIM_CUE:*]` | AI 推理动画标记 | 保持原有格式不变 |
214|
215|**元素级规格：** 一个标签下可用缩进列表逐元素描述，格式 `"文本" | 参数列表`：
216|```markdown
217|[画面:entrance=fade-in,dur=30f,pos=center]
218|  - "$5,000,000,000,000" | entrance=char-pop(80px), stagger=4f, color=#76B900
219|  - "全球首家五万亿美元公司" | entrance=fade-in, delay=90f, color=#999
220|```
221|
222|⚠️ **禁止笼统描述：** 不得写出「数字弹出」「画面倒带」「对比动画」等无参数的模糊描述。必须用 VAS 参数指定具体动画类型。
223|
224|详细参数词汇表、组件映射、完整示例 → 加载 `references/writer-visual-animation-guide.md`。
225|
226|> ⚠️ 场景名用 Hook, Act1_A, Act1_B... 不要写时间码。实际时长由 Narrator TTS → timing.json（TTS-First）决定。
227|
228|### Stage 3: Humanizing (Director → Editor)
229|
230|**Input:** `script-draft.md` | **Output:** `script-final.md` + change report
231|### Stage 4: TTS Narration (Director → Narrator)
232|
233|**Input:** `script-final.md` | **Output:** `narration.mp3` + `narration.vtt` + `timing.json`
234|
235|Narrator extracts narration text, formats with natural pauses (`\n\n` between paragraphs, `\n\n\n` between sections), generates edge-tts voiceover, then parses VTT to produce `timing.json` — the bridge file that maps scene names to exact frame ranges. This is the TTS-First handoff: Renderer consumes `timing.json` directly, no need to compute timing.
236|
237|**timing.json format:**
238|```json
239|{
240|  "total_duration_seconds": 458.9,
241|  "total_frames_30fps": 13767,
242|  "scenes": [
243|    {"name": "Hook", "cue_start": 1, "cue_end": 8, "start_frame": 3, "end_frame": 417}
244|  ],
245|  "voice_profile": "zh-CN-YunxiNeural", "rate": "+10%"
246|}
247|```
248|
249|### Stage 5: Remotion Rendering (Director → Renderer)
250|
251|**Input:** `narration.mp3` + `narration.vtt` + `timing.json` + `script-final.md` | **Output:** MP4 + Remotion project
252|
253|Renderer creates the Remotion project, builds scene components matched to the topic's visual vocabulary, and renders multi-platform MP4s. Scene timing comes EXCLUSIVELY from `timing.json`. **Subtitles are external VTT, not burned-in** — each MP4 has a same-named `.vtt` file that players (YouTube, VLC, IINA) auto-load. This avoids re-rendering for subtitle edits.
254|
255|Workflow: `npx create-video` → copy `narration.mp3` + `narration.vtt` to `public/` → build scenes (NO `<Subtitles>` component) → `<Sequence>` with timing.json → preview → still check → render MP4 → `cp narration.vtt out/youtube.vtt` → multi-platform.
256|
257|### Stage 6: Packaging & SEO (Director → Packager)
258|
259|**Input:** MP4 + script + research | **Output:** `deliverables/`
260|
261|```
262|deliverables/
263|├── metadata.json
264|├── youtube/  (title-candidates with scores, description with chapters, tags, thumbnail-brief)
265|├── x-twitter/ (thread, clip-spec)
266|├── bilibili/  (titles, description with danmaku guidance)
267|└── README.md
268|```
269|
270|Title scoring: curiosity gap(30%) + search match(25%) + emotion(20%) + brevity(15%) + honesty(10%). No clickbait. Thumbnail brief includes ready-to-use `image_generate` prompt.
271|
272|### Director Final Review
273|
274|After Packager completes (or pipeline finishes in delegate_task mode), Director performs final quality review:
275|
276|1. Verify `deliverables/` directory completeness (all platform packages present, metadata.json valid)
277|2. Announce completion in group chat with a checklist covering all 6 stages, their outputs, and a quality summary
278|
279|## Quality Gates
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
293|### Delegate Researcher
294|```
295|Goal: 深度调研「{topic}」，输出结构化 research-data.json
296|Context: pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md
297|  项目路径 {VIDEO_PROJECTS_ROOT}/{project}/，输出 research-data.json
298|  搜索：arXiv + Semantic Scholar + web。中文资料优先知乎/微信公众号
299|  至少 3 篇论文(标注引用)、5 条事实(出处URL)、1 个对立观点、标注知识盲区
300|  **先读取 pipeline-plan.md，严格遵循其中的研究策略和关键词**
301|Tools: web, terminal, file | Skills: arxiv, web-content-extraction, youtube-content
302|```
303|
304|### Delegate Writer
305|```
306|Goal: 基于 research-data.json 创作"小Lin说"风格的视频脚本
307|
308|Context: 
309|  pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md（先读取，遵循叙事策略和视觉风格）
310|  目标风格：故事驱动的中等深度讲解。用类比和比喻让复杂概念好懂。
311|  口播语调：像朋友聊天——自然、有节奏、偶尔反问或感叹。不是教学课件。
312|  
313|  叙事结构：
314|  1. Hook（~30s）：制造好奇或冲突——抛出一个反直觉的问题/现象/数据。不要"大家好我是xxx"。
315|  2. 铺垫（~20%）：引入背景、定义关键概念、建立"为什么这很重要"。
316|  3. 核心展开（~50%）：层层深入。每层一个"故事节拍"——用案例、数据对比、因果推演推进。
317|  4. 总结/延伸（~30%）：联系现实、给出"takeaway"、或留一个开放性问题。
318|  
319|  场景粒度：8-10分钟视频 ≈ 10-15个场景。每个场景 80-200字中文旁白，是一个完整的故事节拍。
320|  Aha 时刻：每 90 秒左右安排一个"原来如此"的转折或洞察。
321|  
322|  输出格式：Markdown section 脚本（非表格）。每个 `## {场景名} — {一句话概括}` 是一个场景区块：
323|
324|## {场景名} — {一句话概括}
325|
326|{80-200字旁白，自然段落，像朋友聊天}
327|
328|[画面:entrance=fade-in,dur=30f,pos=center]
329|  - "关键数字/文字" | entrance=char-pop(80px), stagger=4f, color=#FFD700
330|
331|  场景名用 Hook, Act1_A, Act1_B...（不要时间码）
332|
333|  视觉动画规格 (VAS) — 必须遵守：
334|  - 每个 [画面]/[动画]/[图表] 标签必须携带 entrance= 和 dur=Nf 参数
335|  - 完整参数词汇表见 references/writer-visual-animation-guide.md（加载此文档获取）
336|  - 常用 entrance：fade-in, slide-up(Npx), char-pop(Npx), spring-scale, typewriter
337|  - 常用 animate：bars-grow, line-draw, count-up, pulse, float
338|  - 转场用 [转场:type=crossfade,dur=30f]
339|  
340|  元素级规格：画面内多个元素用缩进列表逐行描述
341|  格式："文本内容" | entrance=动画, delay=Nf, color=#xxx, size=XXpx
342|  
343|  常用参数速查：
344|  entrance=fade-in | slide-up(60px) | char-pop(80px) | spring-scale | typewriter
345|  dur=30f | delay=40f | stagger=4f | color=#FFD700 | size=48px
346|  animate=bars-grow | line-draw | count-up | pulse
347|  
348|  ⚠️ 绝对禁止：
349|  - 不要写笼统的"画面倒带""数字弹出""对比动画"——必须指定 entrance 类型
350|  - 不要写"大家好欢迎来到xx频道"
351|  - 不要每句话一个独立场景（碎片化）
352|  - 不要用教科书式的"第一点...第二点..."罗列
353|  - 不要写时间码
354|  
355|Tools: file, terminal | Skills: baoyu-comic, songwriting-and-ai-music
356|```
357|
358|### Delegate Editor
359|```
360|Goal: 去 AI 化润色 script-draft.md
361|Context: 输出 script-final.md + 修改报告。humanizer 29 条全扫描
362|  中文专项：成语滥用/翻译腔/过度正式。朗读测试。每条修改标注原因
363|Tools: file | Skills: humanizer
364|```
365|
366|### Delegate Narrator
367|```
368|Goal: 提取脚本旁白 → 生成 TTS 配音 + timing.json
369|Context: pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md（先读取，了解预期时长和场景结构）
370|  脚本为 Markdown section 格式（`## 场景名 — 概括` + 旁白段落 + `[画面]`/`[图表]` 标签）
371|  提取方法：用 `bash scripts/extract-narration.sh script-final.md` 提取纯旁白（自动过滤 ## 标题和视觉标签）
372|  按停顿规则加空行(\n\n段落间/\n\n\n场景间)
373|  生成: edge-tts --voice zh-CN-YunxiNeural --rate=+10% -f narration.txt
374|        --write-media narration.mp3 --write-subtitles narration.vtt
375|  解析VTT → timing.json（映射cue索引到场景名+帧范围）
376|  注意：脚本旁白每场景 80-200字（故事体），TTS朗读会更自然流畅。用 \n\n 断句，用 \n\n\n 断场景。
377|Tools: terminal, file
378|```
379|
380|### Delegate Renderer
381|```
382|Goal: 基于 narration.mp3 + timing.json 创建 Remotion 项目 → 渲染 MP4
383|Context: pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md（先读取，遵循视觉风格）
384|  读取 timing.json → 场景帧范围。npx create-video。复制narration.mp3+narration.vtt到public/
385|  脚本为 Markdown section 格式，视觉指令在 `[画面]`/`[图表]`/`[动画]`/`[REACT_ANIM_CUE:*]`/`[转场]` 标签中
386|  ⚠️ 脚本使用 VAS (Visual Animation Spec) 视觉动画规格语言——每个标签携带 entrance=, dur=Nf 等参数
387|  参数直接映射到 Remotion 动画原语：
388|  - entrance=fade-in → interpolate(f, [start, start+dur], [0,1], {extrapolateRight:'clamp'})
389|  - entrance=slide-up(N) → translateY: interpolate(f, [start, start+dur], [N, 0]) + opacity fade
390|  - entrance=char-pop(N) → 逐字符 stagger translateY + opacity, delay=charIndex*stagger
391|  - entrance=spring-scale → spring({frame: f-start, fps: 30, config: {damping:12, stiffness:100}})
392|  - animate=bars-grow → scaleY: interpolate(f, [start, start+dur], [0, 1])
393|  - animate=line-draw → SVG strokeDashoffset interpolate
394|  - stagger=Nf → const delay = index * N
395|  - pos=center → flex center | pos=bottom-right → position:absolute, bottom:0, right:0
396|  完整参数映射见 references/writer-visual-animation-guide.md（加载此文档获取映射表）
397|  ⚠️ VAS 中的 dur 是元素动画时长，场景总时长始终从 timing.json 取——不改不算不质疑
398|  字幕不烧录——cp narration.vtt out/youtube.vtt 外挂字幕，播放器自动识别
399|  开发场景组件（不引入<Subtitles>组件）。Sequence用timing.json值
400|  先预览(npx remotion studio)→抽帧→渲染(1920×1080+竖屏+X精华)
401|  ⚠️ Audio必须用staticFile("narration.mp3")
402|Tools: terminal, file | Skills: remotion, react-animation-components
403|```
404|
405|### Delegate Packager
406|```
407|Goal: 为成品视频创建社交媒体包装
408|Context: pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md（先读取，了解目标平台和受众定位）
409|  输出 deliverables/。YouTube: ≥3标题(5维评分)+描述(章节)+关键词
410|  X/Twitter: thread+精华片段。Bilibili: 标题+弹幕引导。缩略图简报(含AI prompt)
411|Tools: file
412|```
413|
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
499|| Renderer: can't parse VAS visual descriptions | 脚本中的 `[画面]`/`[图表]`/`[动画]` 标签缺少 entrance/dur 参数，或使用了旧格式的模糊描述。修复：(1) 让 Writer 按 VAS 规格重新生成；(2) Renderer 自行加载 `references/writer-visual-animation-guide.md` 做兜底映射推断。 |
500|| Renderer: animation timing doesn't match narration | VAS 中的 dur 参数是元素动画时长，不是场景总时长。场景总时长始终从 timing.json 取——检查 Sequence 是否正确使用了 timing.json 值，而非 VAS dur。 |
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
523|- **Producer delegate_task may timeout**: 9 min video = ~35 min render. Split: Producer builds+TTS, Director renders.
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
555|| `scripts/extract-narration.sh` | Extract narration column from three-column scripts |
556|| `scripts/vtt-to-subtitles.py` | Convert edge-tts VTT to Remotion `subtitles.ts` with frame-accurate timing |
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
570|| `references/gateway-skip-platforms-phantom.md` | Why `gateway.skip_platforms` doesn't exist and how to actually disable Telegram |
571|| `references/hermes-web-ui-mention-bug.md` | Why agent-to-agent @mentions are broken in hermes-web-ui ≤ 0.6.10 and the hybrid workaround |
572|| `references/agent-personas.md` | SOUL.md templates for Researcher, Writer, Editor, Narrator, Renderer, Packager |
573|| `references/packager-persona.md` | SOUL.md template for Packager |
574|| `references/writer-visual-animation-guide.md` | **VAS 视觉动画规格指南** — Writer ↔ Renderer 共享词汇。完整参数表、组件映射、前后对比示例、自检清单。 |
575|| `/workspace/.hermes/plans/2026-06-08_writer-visual-animation-spec.md` | 实施计划：Writer 视觉动画规格化改造 (VAS)。8 个任务，6 个文件待修改。消除 Writer→Renderer 语义鸿沟。 |
576|