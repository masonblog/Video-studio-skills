# Delegate Writer Prompt Template

> ⚠️ 本提示词与 `stages/stage-2-writing.md` 描述同一阶段的约束。修改任一文件时必须同步另一处，避免两种派发模式（群聊 / delegate_task）使用不一致的规范。

## 目标
基于调研数据和全局规划，创作“小Lin说”故事风格的中深度视频脚本 `script-draft.md`。

---

## 委派提示词 (Prompt)

```
Goal: 基于 research-data.json 创作 "小Lin说" 风格的视频脚本
Context: 
  - pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md（请先读取并严格对齐叙事和视觉风格）
  - 调研数据：{VIDEO_PROJECTS_ROOT}/{project}/research-data.json（请读取并优先参考 visualIdeas）
  - 输出路径：{VIDEO_PROJECTS_ROOT}/{project}/script-draft.md

目标风格：
  - 故事驱动的中等深度讲解。用口语化的语气（像朋友聊天），多用生动类比和比喻。避免学术腔。
  
叙事结构：
  1. Hook (~5%)：抛出反直觉的结论、疑问或数据制造强烈冲突。不要说“大家好欢迎来到xx”。
  2. 铺垫 (~20%)：介绍背景，定义关键概念，阐明为什么这与观众相关。
  3. 核心展开 (~50%)：层层深入。以“故事节拍”为场景切分，每 90s 设计一个 Aha 洞察时刻。
  4. 总结/延伸 (~25%)：得出 takeaway，引申至现实生活或提出开放性问题。

场景与格式：
  - 8-10 分钟视频控制在 10-15 个场景。每个场景包含 80-200 字中文旁白。
  - 输出格式必须为 Markdown Section 格式（严禁使用表格）。
  - 每个场景命名为：`## {场景代号} — {一句话概括}`。场景代号采用英文命名（如 Hook, Act1_A...），严禁写入时间码。

视觉动画规格 (VAS) 要求：
  - 每个场景正文后必须带有一个或多个 `[类型:entrance=动画类型,dur=持续帧数,pos=位置]` 视觉标签。
  - 每个标签必须带上 `entrance=` 和 `dur=Nf`。
  - 标签内多个子元素，用缩进列表逐行描述：`- "文本内容/画面描述" | 参数列表`
  - 常用动画类型：fade-in, slide-up(Npx), char-pop(Npx), spring-scale, typewriter。
  - 严禁使用“数字弹出”“画面倒带”等不带参数的模糊叙述。

Tools: file, terminal 
Skills: baoyu-comic, songwriting-and-ai-music
```
