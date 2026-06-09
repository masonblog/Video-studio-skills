# Writer 视觉动画规格指南 (VAS)

> **读者：** Writer（生成脚本）和 Renderer（解析脚本）
> **目的：** 统一视觉动画描述语言，消除「概念描述」→「Remotion 代码」之间的语义鸿沟

---

## 1. 为什么需要这份文档

### 问题

Writer 产出的视觉描述通常是自然语言，比如：

```markdown
[画面] 数字 "$5,000,000,000,000" 逐位弹出，屏幕震动。Nvidia 绿光扫过
[图表] 柱状图：Nvidia 单柱 vs 英国上市公司总和
[画面] 画面倒带：数字蒸发→日历翻页→停在 1996年
```

Renderer 拿到这些描述后，需要把它翻译成 Remotion 代码：

```tsx
const y = interpolate(charFrame, [0, 8], [80, 0], { extrapolateRight: "clamp" });
const opacity = interpolate(charFrame, [0, 4], [0, 1], { extrapolateRight: "clamp" });
```

中间存在巨大的理解差距——「逐位弹出」可以对应 `translateY` 75px、`translateX` 20px、`scale` 0→1.2 等十几种实现，Renderer 只能**猜**。

### 解决方案

这套 Visual Animation Spec (VAS) 语法让 Writer 用**结构化参数**描述每个画面元素，Renderer 可以直接映射到 Remotion 动画原语，不再需要猜测。

Writer 仍然写的是**自然语言脚本**，不写 React 代码——但每个画面元素附加了 Renderer 可以机械翻译的参数。

---

## 2. 视觉标签语法

### 基本格式

```
[TYPE:param1=value1,param2=value2,dur=Nf]
  - "元素文本" | entrance=动画类型, delay=Nf, color=#xxx, ...
  - "第二个元素" | entrance=动画类型, ...
```

### 标签类型

| 标签 | 用途 | 必填参数 | 推荐参数 |
|------|------|----------|----------|
| `[画面]` | 一般场景/背景画面 | `entrance`, `dur` | `pos` |
| `[动画]` | 需要复杂动效的元素 | `entrance`, `dur` | `pos` |
| `[图表]` | 数据可视化 | `entrance`, `dur` | `animate`, `color` |
| `[转场]` | 场景间过渡 | `type`, `dur` | — |
| `[REACT_ANIM_CUE:*]` | AI 推理动画 | 保持原有格式 | — |

---

## 3. 动画参数词汇表

### 3.1 入场动画 (entrance)

| 参数值 | 视觉效果 | Renderer 映射 |
|--------|----------|--------------|
| `fade-in` | opacity 0→1 | `interpolate(f, [start, start+dur], [0,1], {extrapolateRight:'clamp'})` |
| `slide-up(Npx)` | 从下方 Npx 滑入 + fade | `translateY: interpolate(f, [start, start+dur], [N, 0])` + opacity |
| `slide-left(Npx)` | 从左方 Npx 滑入 + fade | `translateX: interpolate(f, [start, start+dur], [N, 0])` + opacity |
| `slide-right(Npx)` | 从右方 Npx 滑入 + fade | `translateX: interpolate(f, [start, start+dur], [-N, 0])` + opacity |
| `spring-scale` | spring 弹性缩放入场 | `spring({frame: f-start, fps: 30, config: {damping:12, stiffness:100}})` |
| `char-pop(Npx)` | 逐字从下方弹入 | 逐字符：`translateY` + `opacity`，`delay = charIndex * stagger` |
| `typewriter` | 逐字出现，无位移 | 逐字符：`opacity` 0→1，`delay = charIndex * stagger` |
| `scale-up` | 静态放大 0→1 | `scale: interpolate(f, [start, start+dur], [0, 1])` |

### 3.2 持续动画 (animate)

| 参数值 | 视觉效果 | Renderer 映射 |
|--------|----------|--------------|
| `pulse` | scale 周期性 1.0→1.05 | `1 + 0.05 * Math.sin(f * 0.15)` |
| `float` | translateY 周期性 ±8px | `8 * Math.sin(f * 0.1)` |
| `glow-pulse` | 发光效果周期性亮暗 | `textShadow/boxShadow` opacity 周期性变化 |
| `bars-grow` | 柱状图从底部长出 | `scaleY: interpolate(f, [start, start+dur], [0, 1])` |
| `line-draw` | SVG 路径描边动画 | `strokeDashoffset: interpolate(…, [total, 0])` |
| `count-up` | 数字从 0 滚动到目标 | 计数器动画，`interpolate` 数值再 `Math.round` |
| `shake` | 水平周期性抖动 | `translateX: 4 * Math.sin(f * 0.5) * decay(f)` |

### 3.3 转场 (type)

| 参数值 | 视觉效果 | Renderer 映射 |
|--------|----------|--------------|
| `crossfade` | 前场景淡出 + 后场景淡入 | 前后场景 opacity 交叉 |
| `slide-push-left` | 后场景从右推入，前场景推出 | translateX 交叉 |
| `zoom-in` | 前场景放大消失 | scale + opacity |
| `cut` | 硬切 | 无过渡（0帧） |

### 3.4 位置 (pos)

| 值 | CSS 等价 |
|----|---------|
| `center` | `display:flex; justify-content:center; align-items:center` |
| `top` | 上方居中 |
| `bottom` | 下方居中 |
| `left` | 左侧居中 |
| `right` | 右侧居中 |
| `top-left` | `position:absolute; top:0; left:0` |
| `bottom-right` | `position:absolute; bottom:0; right:0` |
| `fullscreen` | 覆盖全屏 |

### 3.5 元素级参数

| 参数 | 格式 | 说明 | 示例 |
|------|------|------|------|
| `entrance` | 入场动画名 | 见此节 3.1 | `entrance=char-pop(80px)` |
| `dur` | 持续帧数 | 标签级或元素级 | `dur=30f` |
| `delay` | 延迟帧数 | 相对场景起始 | `delay=60f` |
| `stagger` | 逐元素间隔 | 用于文本逐字/列表逐项 | `stagger=4f` |
| `color` | 颜色值 | hex 或 CSS 变量名 | `color=#76B900` |
| `glow` | 发光效果 | `半径-颜色-透明度` | `glow=0-0-40px-rgba(118,185,0,0.3)` |
| `size` | 字号 | px | `size=48px` |
| `pos` | 位置 | 元素级位置（覆盖标签级） | `pos=bottom-center` |
| `labels` | 图表标签 | 逗号分隔 | `labels=["Nvidia","其他"]` |

---

## 4. 组件映射表

Writer 不需要引用组件名，但了解以下映射有助于给出更准确的视觉描述：

| 视觉模式 | Writer 用哪个标签 | Renderer 组件 |
|----------|-------------------|---------------|
| 大数字冲击力展示 | `[画面]` + `entrance=char-pop` | 自定义数字组件 |
| 章节标题 | `[画面:entrance=spring-scale]` | TitleCard |
| 数据柱状图对比 | `[图表:animate=bars-grow]` | 自定义 ChartJS/纯 SVG |
| 增长曲线 | `[图表:animate=line-draw]` | SVG path 动画 |
| AI 思考过程 | `[REACT_ANIM_CUE:thought]` | ThoughtBubble |
| AI 行动展示 | `[REACT_ANIM_CUE:action]` | AgentBox + ActionArrow |
| AI 观察结果 | `[REACT_ANIM_CUE:obs]` | AgentBox (observation) |
| 推理循环 | `[REACT_ANIM_CUE]` | ReActLoop |
| 分支决策 | `[REACT_ANIM_CUE:tot]` | TreeOfThought |
| 多 Agent 协作 | `[REACT_ANIM_CUE:multi]` | MultiAgent |
| 人物照片展示 | `[画面:entrance=fade-in]` | `<Img>` 或 `<img>` |
| 文档/文字飞出 | `[动画:entrance=slide-up(80px)]` | 自定义 CSS transform |
| 场景间过渡 | `[转场:type=crossfade,dur=30f]` | Transition 组件 |

---

## 5. 完整改造示例

### 示例 1：Hook 场景 — 大数字冲击

**改造前（模糊）：**
```markdown
[画面] 数字 "$5,000,000,000,000" 逐位弹出，屏幕震动。Nvidia 绿光扫过
[图表] 柱状图：Nvidia 单柱 vs 英国上市公司总和
```

**改造后（规格化）：**
```markdown
[画面:entrance=fade-in,dur=30f,pos=center]
  - "$5,000,000,000,000" | entrance=char-pop(80px), stagger=4f, color=#76B900, glow=0-0-40px-rgba(118,185,0,0.3), size=64px
  - "2025年10月 · 全球首家五万亿美元公司" | entrance=fade-in, delay=90f, color=#999, size=22px
  - 屏幕震动 | animate=shake, dur=15f, trigger=数字出现时

[图表:entrance=slide-up(60px),dur=25f,pos=center]
  - 柱状图 | animate=bars-grow, color-left=#76B900, color-right=#444, labels=["Nvidia","英国上市公司总和"], ratio=100:85
  - "全球首家"标题 | entrance=fade-in, delay=40f, color=#999, size=18px
```

### 示例 2：Act1_A — 场景叙事

**改造前：**
```markdown
[画面] 暗色调的 Rosewood 酒店外观 → 餐桌上摆放着 OpenAI 创始文件，灯光昏暗
[动画] 一张纸从桌面上飘出，展开成 OpenAI 创始宣言，高亮"优先考虑全人类的利益"
[图表] 创始团队人物关系图谱：Musk-Altman 双主席，Sutskever CSO
```

**改造后：**
```markdown
[画面:entrance=fade-in,dur=40f,pos=fullscreen]
  - Rosewood酒店外观(暗色调) | entrance=fade-in, dur=20f
  - 餐桌+OpenAI创始文件 | entrance=fade-in, delay=25f, pos=center, color=warm-amber

[动画:entrance=slide-up(80px),dur=40f,pos=center]
  - OpenAI创始宣言(纸张飞出) | entrance=slide-up(100px), dur=30f, stagger=0
  - "优先考虑全人类的利益"高亮 | entrance=fade-in, delay=45f, color=#FFD700, glow=0-0-20px-rgba(255,215,0,0.4)

[图表:entrance=fade-in,dur=30f,pos=center]
  - 人物关系图 | entrance=fade-in, animate=none, labels=["Musk(联合主席)","Altman(联合主席)","Sutskever(CSO)","Brockman(总裁)"], layout=star
```

### 示例 3：转场 + 倒带效果

**改造前：**
```markdown
[画面] 画面倒带：数字蒸发→日历翻页→停在 1996年
```

**改造后：**
```markdown
[转场:type=crossfade,dur=25f]

[画面:entrance=fade-in,dur=30f,pos=center]
  - "数字蒸发效果" | animate=count-up, direction=reverse, speed=2x, dur=20f
  - "日历翻页" | animate=3D-flip, dur=15f, iterations=3
  - "← 1996" | entrance=spring-scale, delay=40f, color=#E74C3C, size=48px
  - "差一点就没了" | entrance=fade-in, delay=60f, color=#999, size=24px
```

---

## 6. Writer 自检清单

写完脚本后，逐项检查：

- [ ] 每个 `[画面]` / `[动画]` / `[图表]` 标签是否都包含 `entrance` 参数？
- [ ] 每个标签是否都包含 `dur=Nf`（持续帧数）？
- [ ] 是否有「弹出」「飘出」「倒带」「对比」等自然语言描述的孤立场面（没有参数细化）？
- [ ] 复杂画面（3+ 元素）是否用缩进列表逐元素描述了入场方式？
- [ ] 大数字/重要文本是否用了 `entrance=char-pop` 或 `entrance=typewriter` + `stagger`？
- [ ] 数据图表是否指定了 `animate=bars-grow` / `animate=line-draw`？
- [ ] 图表是否有 `color` 或 `color-left`/`color-right`？
- [ ] 关键文字元素是否指定了 `size` 和 `color`？
- [ ] 场景间是否有 `[转场]` 标签？（如无，Renderer 默认用 `crossfade`）
- [ ] 元素出场顺序是否有 `delay` 参数体现？（不要让所有元素同时出现）

---

## 7. 简写模式

并非每个元素都需要逐行拆解。简单画面可以简写：

```markdown
# 可接受的简写（单元素简单画面）：
[画面:entrance=fade-in,dur=30f]
  ChatGPT 界面从空白到疯狂滚动的对话记录

# 不接受（缺少 entrance 和 dur）：
[画面] ChatGPT 界面从空白到疯狂滚动的对话记录
```

规则：**`entrance` 和 `dur` 是必填参数。其他参数按需添加。**

---

## 8. 常见错误

| 错误 | 修正 |
|------|------|
| `[画面] 数字弹出` | `[画面:entrance=fade-in,dur=30f,pos=center]` → `"$5T" \| entrance=char-pop(80px), stagger=4f` |
| `[动画] 对比动画` | `[图表:entrance=slide-up(60px),dur=25f]` → 柱状图 \| `animate=bars-grow, color-left=#76B900, color-right=#E74C3C` |
| `[画面] 镜头拉远，看到全景` | `[画面:entrance=fade-in,dur=40f,pos=fullscreen]` → 场景 \| `animate=scale(1→0.7), dur=40f` |
| `[画面] 倒带效果` | 拆解为：`[转场:type=crossfade,dur=20f]` → 数字蒸发子画面 → 日历翻转子画面 |
| 忘记 `stagger` 参数 | 所有 `char-pop` 和 `typewriter` 必须搭配 `stagger=Nf`（通常 3-5f/字） |
| `dur` 值异常 | 30fps 下：短动画 15-30f，常规 30-60f，长动画 60-90f。不要写 5f（太短看不到）或 200f（太慢） |

---

## 9. 与 timing.json 的关系

**重要：** VAS 中的 `dur` 参数是**元素级动画时长**，不是场景总时长。

- 场景总时长始终从 `timing.json` 取（Narrator TTS 录音决定）
- `dur` 决定元素自身动画的持续帧数
- `delay` 决定元素在场景内的出场时刻

```json
// timing.json 示例
{"name": "Hook", "start_frame": 3, "end_frame": 417}
// 场景总长 = 414 帧
// 在此前提下，各元素动画的 dur + delay 应在 414 帧内排开
```
