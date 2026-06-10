# Delegate Packager Prompt Template

## 目标
为成品视频包生成多平台社交媒体包装发布包。

---

## 委派提示词 (Prompt)

```
Goal: 为成品视频创建社交媒体包装
Context:
  - pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md
  - 视频路径：{VIDEO_PROJECTS_ROOT}/{project}/remotion-project/out/
  - 最终脚本：{VIDEO_PROJECTS_ROOT}/{project}/script-final.md
  - 调研数据：{VIDEO_PROJECTS_ROOT}/{project}/research-data.json
  - 输出目录：{VIDEO_PROJECTS_ROOT}/{project}/deliverables/

指令要求：
  1. 请先读取 pipeline-plan.md，了解目标平台和受众画像。
  2. 在 `deliverables/` 目录下生成结构化的平台包：
     - **YouTube**：包含 3-5 个标题候选（带 5 维度评分及推荐），包含章节时间戳 (Chapters)、推介链接和 CTA 的描述文案，tags 关键词列表，及一张包含 ComfyUI 英文 Prompt 的缩略图设计简报。
     - **Bilibili**：包含更口语化和互动感的主标题候选，带有弹幕互动引导和分段的简介文案。
     - **X (Twitter)**：包含 Thread 推广推文文案，记录 `x-clip.mp4` 的起止时间。
     - 生成元数据文件 `metadata.json` 和完整交付清单 `README.md`。
  3. 标题评分必须涵盖 5 个维度：好奇心缺口 (30%)、搜索匹配度 (25%)、情绪冲击力 (20%)、简洁度 (15%)、真实性 (10%)。拒绝 clickbait 虚假承诺。
  4. 缩略图 prompt 应为可直接运行的 Midjourney/ComfyUI 英文关键词。

Tools: file
```
