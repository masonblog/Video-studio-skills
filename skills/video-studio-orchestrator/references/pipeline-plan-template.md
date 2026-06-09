# Pipeline Plan Template (pipeline-plan.md)

> 这是 Director 创建的项目总体规划模板。覆盖 7 个章节，每个章节 ≤5 行。
> Director 在所有 6 个 Stage 开始前创建此文件，写入项目根目录。

---

```markdown
# {项目名} — 视频制作总体规划

> 项目路径：{VIDEO_PROJECTS_ROOT}/{project}/
> 创建时间：{timestamp}
> 目标平台：YouTube | Bilibili | X/Twitter | 多平台
> 预期时长：{N} 分钟

## 1. 选题评估
- 话题价值：[有争议性技术话题/深度科普/新闻解读]
- 目标观众：{受众画像——年龄、兴趣、知识水平}
- 差异化角度：{与已有内容的不同点}
- 选题风险：[争议性/时效性/资料可得性]

## 2. 叙事策略
- 核心故事线：{一句话概括，这个故事讲什么}
- Hook 策略：{开篇用什么制造好奇或冲突——反直觉数据？争议问题？历史转折？}
- Aha 时刻分布：{约每 90s 一个洞察点，预期 N 个}
- 情感曲线：{平缓→上升→高潮→回落？还是多波峰？}
- 参照风格：{小Lin说/Veritasium/Kurzgesagt/新华社/...}

## 3. 研究策略
- 核心搜索关键词：[中文关键词] / [English keywords]
- 必查来源：[arXiv/特定论文DOI/技术博客/官方文档/知乎]
- 对立观点要求：[必须找到的反对声音或争议点]
- 知识盲区预判：[可能没有明确答案的问题，标注留白]

## 4. 视觉风格
- 配色方案：主色 #XXXXXX + 辅助色 #XXXXXX（示例: Deep Blue #0a1628 + Gold #FFD700）
- 动画风格：[数据驱动/抽象概念可视化/场景再现/信息图表]
- 参考视觉：[已有高质量同类视频的视觉风格描述]

## 5. 管线分工
| Stage | Agent | 输入 → 输出 | 质量标准 |
|-------|-------|------------|---------|
| 1 | video-researcher | 选题 → research-data.json | ≥3论文 / ≥5事实 / ≥1对立观点 |
| 2 | video-writer | research → script-draft.md | 10-15场景 / 叙事弧完整 / Hook锋利 |
| 3 | video-editor | draft → script-final.md | 零AI痕迹 / 朗读通过 |
| 4 | video-narrator | final → narration.mp3+timing.json | TTS自然 / VTT完整 |
| 5 | video-renderer | timing → MP4+VTT | 音画同步 / 色彩一致 / 多平台 |
| 6 | video-packager | MP4 → deliverables/ | ≥3标题 / SEO完整 / 缩略图可用 |

## 6. 质量红线
- 不可接受：[捏造数据 / AI写作痕迹 / 机械配音 / 音画不同步 / 无事实出处]
- 优先保证：[信息密度（每30s一个观点转折）/ Hook吸引力 / 视觉清晰度 / 朗读自然度]

## 7. 风险与预案
| 风险 | 概率 | 预案 |
|------|------|------|
| 研究资料不足 | 中 | 拓宽到行业报告/专家观点/社交媒体讨论 |
| TTS 语音不自然 | 低 | 切换语音/调整语速±5% |
| 渲染超时 | 低 | 降低分辨率/分段渲染/缩短时长 |
```
