# Stage 0: Planning (Director — 必须先执行)

## 概述
- **输入**：用户选题 (Topic)
- **输出**：`pipeline-plan.md`

Director 收到选题后，不能直接派发任务。必须先加载 `plan` skill 方法论，在项目目录创建 `pipeline-plan.md`。这是全管线的"宪法"——每个 Agent 在开始自己的阶段前，必须先读 pipeline-plan.md 对齐全局策略。

---

## Plan 7 章节规范 (每节 ≤5 行，保持紧凑)

1. **选题评估**：话题价值（有争议性的技术话题 > 纯科普 > 新闻搬运）、目标观众、差异化角度、风险。
2. **叙事策略**：核心故事线（一句话描述）、Hook 策略、Aha 时刻分布（每 90 秒左右安排一个转折或洞察）、情感曲线、参照风格（"新华社深度报道 × Veritasium 科普"）。
3. **研究策略**：核心搜索关键词（中/英文）、必查来源、对立观点要求。
4. **视觉风格**：配色方案、动画风格、参考视觉。
5. **管线分工**：6 个 Stage 的输入→输出→质量标准表。
6. **质量红线**：不可接受的底线（捏造数据/AI写作/机械配音/音画不同步）。
7. **风险与预案**：概率评估 + 应急预案。

---

## Plan 模板
Plan 的标准模板位于 `references/pipeline-plan-template.md`。

---

## Plan 在不同执行模式中的传递

- **`delegate_task` 模式**：
  每个 delegate 任务的 `context` 第一行必须指定 Plan 路径，如：
  `pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md`
- **`Kanban` 模式**：
  T0 任务产出 pipeline-plan.md，后续所有任务的 body 中通过相对或绝对路径引用。
- **群聊 `@mention` 接力模式**：
  Director 创建 plan 后，在 @video-researcher 的选题交接消息中注明 plan 的绝对路径。
