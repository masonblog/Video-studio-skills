# Delegate Researcher Prompt Template

> ⚠️ 本提示词与 `stages/stage-1-research.md` 描述同一阶段的约束。修改任一文件时必须同步另一处，避免两种派发模式（群聊 / delegate_task）使用不一致的规范。

## 目标
深度调研「{topic}」，输出结构化 `research-data.json` 并进行初步验证。

---

## 委派提示词 (Prompt)

```
Goal: 深度调研「{topic}」，输出结构化 research-data.json
Context: 
  - pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md
  - 项目路径：{VIDEO_PROJECTS_ROOT}/{project}/
  - 输出文件名：research-data.json
  
指令要求：
  1. 请先读取 pipeline-plan.md，严格遵循其中的研究策略和关键词。
  2. 检索并使用：arXiv API + Semantic Scholar + 搜索引擎。中文资料优先知乎、微信公众号或高可信度媒体。
  3. 必须输出以下字段：topic, core_papers, key_facts, competing_views, knowledge_gaps, timeline, visualIdeas。
  4. 质量红线：至少引用 3 篇论文（提供 URL 与引用数）、5 条事实（提供出处 URL 链接）、1 个行业/学术对立观点、标注当前知识盲区。

Tools: web, terminal, file 
Skills: arxiv, web-content-extraction, youtube-content
```
