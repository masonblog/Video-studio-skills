# Stage 2: Script Writing (Director → Writer)

## 概述
- **输入**：`research-data.json` + `pipeline-plan.md`
- **输出**：`script-draft.md`

---

## 叙事风格：“小Lin说”式故事叙述
用生动的类比、比喻和具体的实际案例解释复杂的概念。口播语调应当像朋友聊天，自然、有温度、有节奏。
- 避免教科书式的“第一点...第二点...”生硬罗列。
- 每段旁白应有完整的起承转合，确保画面切换频率合理。
- 严禁出现“大家好欢迎来到xx频道”等模板化套话。

---

## 叙事结构与场景粒度
- **Hook (~5%)**：前 30s 必须制造强烈的好奇心或冲突，抛出反直觉的结论或数据。
- **铺垫 (~20%)**：引入背景、定义关键概念、建立“为什么这很重要”的现实关联。
- **核心展开 (~50%)**：层层深入。每 90 秒安排一个“原来如此”的转折或洞察（Aha moment）。
- **总结/延伸 (~25%)**：联系现实、给出 takeaway 核心洞察，或留一个开放性的延伸思考。
- **场景粒度**：8-10 分钟视频控制在 **10-15 个场景**。每个场景是一个完整的“故事节拍”，包含 80-200 字中文旁白。

---

## 输出格式：Markdown Section 脚本
脚本采用 Markdown Section 格式，**严禁使用表格**。每个场景以 `## {场景名} — {一句话概括}` 划分：
- 场景名使用规范英文代号（如 `Hook`、`Act1_A`、`Act1_B`...），**不要写时间码**。
- 正文为纯中文旁白。
- 视觉指令单独起行，使用中括号包装的 **VAS 视觉动画规格** 标记。

```markdown
## Hook — 比特币的疯狂

你有没有想过，如果你在 2009 年买了 100 块钱比特币，今天你有 3 个亿。但如果你在 2011 年买了——对不起，你大概率在 2013 年就卖了。

[画面:entrance=fade-in,dur=30f,pos=center]
  - 比特币价格曲线暴涨 | animate=line-draw, color=#F7931A, dur=25f
  - "¥100 → ¥300,000,000" | entrance=char-pop(60px), stagger=4f, color=#FFD700, delay=35f
[图表:entrance=slide-up(50px),dur=20f]
  - 早期比特币交易量 vs 价格对比 | animate=bars-grow, color=#F7931A
```

---

## VAS 视觉动画规格 (Visual Animation Spec)

每一个视觉标签必须携带 `entrance` (入场动画) 和 `dur` (持续帧数，30fps) 参数：
```
格式：[TYPE:entrance=动画类型,dur=Nf,pos=位置]
```

### 标签分类与参数

| 标签 | 用途 | 常用 entrance |
|------|------|--------------|
| `[画面:...]` | 一般场景/背景画面 | fade-in, slide-up(Npx) |
| `[图表:...]` | 数据可视化 | slide-up, fade-in, spring-scale |
| `[动画:...]` | 复杂动效元素 | spring-scale, char-pop(Npx) |
| `[转场:...]` | 场景间过渡 | crossfade, slide-push-left, zoom-in |
| `[REACT_ANIM_CUE:*]` | AI/ReAct loop 动效 | 保持特定格式（如 thought, action, obs） |

### 元素级规格 (Staggered Elements)
在标签下方使用缩进列表逐行描述画面内多个元素，格式为 `"文本/画面描述" | 参数列表`：
```markdown
[画面:entrance=fade-in,dur=30f,pos=center]
  - "$5,000,000,000,000" | entrance=char-pop(80px), stagger=4f, color=#76B900
  - "全球首家五万亿美元公司" | entrance=fade-in, delay=90f, color=#999
```

> ⚠️ **绝对禁止模糊描述**：不得写出“数字弹出”“画面倒带”“对比动画”等无参数的模糊词。必须用 VAS 预设参数进行精确指定。详细参数见 `references/writer-visual-animation-guide.md`。
