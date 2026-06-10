# Stage 6: Packaging & SEO (Director → Packager)

## 概述
- **输入**：成品视频文件 (MP4) + 脚本最终稿 (`script-final.md`) + 调研数据 (`research-data.json`)
- **输出**：`deliverables/` 完整包装发布包

---

## 交付目录结构规范
```
deliverables/
├── metadata.json              ← 结构化元数据（包含项目名、发布时间、视频时长等机器可读信息）
├── youtube/
│   ├── title-candidates.md    ← 3-5 个标题候选（附带 5 维度打分及评估）
│   ├── description.md         ← 带有章节时间戳 (Chapters)、相关推介链接及 CTA 的描述文案
│   ├── tags.txt               ← 核心词、长尾词和关联词（逗号分隔，按优先级排列）
│   └── thumbnail-brief.md     ← 缩略图设计简报（包含 ComfyUI/Midjourney 可用的英文 Prompt）
├── x-twitter/
│   ├── thread.md              ← 针对 X 平台优化的 Thread 系列推文草稿
│   └── clip-spec.md           ← 精华片段说明（记录从 Renderer 提取的 x-clip.mp4 时间戳）
├── bilibili/
│   ├── title-candidates.md    ← 适合 B 站年轻社区的标题候选（更具口语化和调侃感）
│   └── description.md         ← B 站视频简介（含评论区置顶和弹幕互动引导）
└── README.md                  ← 交付清单与发布操作指南
```

---

## 标题打分方法论 (5 维度)

| 维度 | 权重 | 判定标准 |
|------|------|---------|
| **好奇心缺口 (Curiosity)** | 30% | 标题是否勾起了用户“想点进去探寻真相”的强烈欲望 |
| **搜索匹配度 (SEO)** | 25% | 是否包含了该主题在搜索引擎上的核心与高频关键词 |
| **情绪冲击力 (Emotion)** | 20% | 是否引起用户的共鸣、惊讶、紧迫感或打破常规的预期 |
| **简洁度 (Brevity)** | 15% | 字符数是否保持在合理长度，避免在移动端截断 (建议 ≤60 字符) |
| **真实性 (Honesty)** | 10% | 是否没有标题党嫌疑，标题的预设能在视频中得到确实回应 |

---

## 缩略图简报规范
Packager 需要设计一份针对 comfyui 或 `image_generate` 接口可以直接运行的 Prompt 简报，示例如下：
```markdown
## 缩略图设计简报

- **核心主题**：GPU 的算力演进
- **视觉风格**：赛博朋克科技感、高对比、深色底
- **构图设计**：左侧为一块发光的 GPU 芯片特写，右侧为大号加粗的金色文字
- **文字文案**：主标题 "算力狂飙" (金色，带霓虹发光)；副标题 "硅基生命的物理极限" (白色)
- **配色推荐**：深灰底色 (#111111) + 金色强调 (#f0b90b) + 亮蓝色点缀 (#00d2ff)

**英文生成 Prompt**:
A YouTube thumbnail design about semiconductor technology and AI computation. The left side shows a macro close-up of a glowing GPU microchip with glowing circuit lines. Dark obsidian background. High contrast, sharp details. Cinematic lighting. 16:9 aspect ratio.
```
