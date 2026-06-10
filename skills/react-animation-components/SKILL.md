---
name: react-animation-components
description: "ReAct 推理动画 Remotion 组件库：ThoughtBubble, AgentBox, ActionArrow, CodeBlock, ReActLoop, TreeOfThought, TitleCard, Subtitles。用于科普视频中的 AI Agent 推理过程可视化。"
version: 1.0.1
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [remotion, react, animation, react-agent, visualization, components]
    category: creative
prerequisites:
  commands: [node, npx]
---

# ReAct Animation Components — Remotion 组件库

为科普视频中的 **ReAct 推理链** 可视化提供一套开箱即用的 Remotion React 组件。

## 何时加载

当 Director 委派 Renderer 制作视频时，Renderer 必须加载此 Skill。也适用于任何需要展示 AI Agent 推理过程的视频项目。

## 组件总览

| 组件 | 文件 | 用途 |
|------|------|------|
| `Theme` | `templates/Theme.tsx` | CSS 变量、配色系统、字体栈 |
| `AgentBox` | `templates/AgentBox.tsx` | Agent 容器卡片（圆角、阴影、主题色边框） |
| `EnvironmentBox` | `templates/EnvironmentBox.tsx` | Environment 容器卡片 |
| `ThoughtBubble` | `templates/ThoughtBubble.tsx` | CSS 气泡 + 思考点动画 |
| `ActionArrow` | `templates/ActionArrow.tsx` | SVG 从 Agent 到 Environment 的箭头 |
| `ObserveArrow` | `templates/ObserveArrow.tsx` | SVG 从 Environment 到 Agent 的回传箭头 |
| `CodeBlock` | `templates/CodeBlock.tsx` | 代码高亮展示块 |
| `ReActLoop` | `templates/ReActLoop.tsx` | 完整 ReAct 三步循环组件 |
| `TreeOfThought` | `templates/TreeOfThought.tsx` | ToT 分支树递归组件 |
| `TitleCard` | `templates/TitleCard.tsx` | 章节标题卡（打字机 + 弹入） |
| `Subtitles` | `templates/Subtitles.tsx` | 底部字幕条（保留用于需内嵌场景；管线默认使用外挂 VTT） |

## 使用方法

### 1. 将模板文件复制到 Remotion 项目

```bash
SKILL_DIR="$HOME/.hermes/skills/creative/react-animation-components"
cp $SKILL_DIR/templates/Theme.tsx src/components/
cp $SKILL_DIR/templates/*.tsx src/components/
```

### 2. 在最外层包裹 Theme

```tsx
// src/Root.tsx
import { Theme } from './components/Theme';

export const RemotionRoot: React.FC = () => (
  <Theme>
    <Composition id="Main" component={Main} durationInFrames={900} fps={30} width={1920} height={1080} />
  </Theme>
);
```

Theme 注入所有 CSS 变量，组件通过 CSS 变量自动适配配色。

### 3. 使用 ReActLoop（最常用）

```tsx
import { ReActLoop } from './components/ReActLoop';

const SceneReAct: React.FC = () => {
  const rounds = [
    { thought: "我需要搜索 ReAct 论文", action: 'search("ReAct reasoning LLM")', observation: "找到 5 篇论文", startFrame: 0 },
    { thought: "阅读摘要", action: 'read_paper("2203.12345")', observation: "ReAct = reasoning + acting", startFrame: 180 },
  ];
  return <ReActLoop rounds={rounds} width={1920} height={1080} />;
};
```

### 4. 使用 TreeOfThought（扩展话题）

```tsx
import { TreeOfThought, type ThoughtNode } from './components/TreeOfThought';
const treeData: ThoughtNode = {
  id: 'root', label: '如何解决？',
  children: [
    { id: 'a', label: '方案 A', children: [{ id: 'a1', label: 'A1' }, { id: 'a2', label: 'A2', highlight: true }] },
    { id: 'b', label: '方案 B', children: [{ id: 'b1', label: 'B1' }] },
  ],
};
<TreeOfThought tree={treeData} width={1920} height={1080} />;
```

### 5. Subtitles 组件（按需使用）

**管线默认不使用此组件。** 视频管线工作流通过外挂 VTT 文件（与 MP4 同名）提供字幕，播放器（YouTube/VLC/IINA）自动加载。`Subtitles.tsx` 保留用于需要烧录字幕的场景（如竖屏短视频平台不支持外挂字幕）。

```tsx
import { Subtitles } from './components/Subtitles';
const subs = [
  { text: "旁白内容", startFrame: 0, endFrame: 120 },
];
<Subtitles items={subs} />
```

## 配色定制

通过 CSS 变量覆盖默认配色：

```css
:root {
  --bg-primary:    #1a1a2e;
  --bg-secondary:  #16213e;
  --color-agent:   #58C4DD;
  --color-env:     #F39C12;
  --color-thought: #2ECC71;
  --color-action:  #E74C3C;
  --color-obs:     #9B59B6;
  --color-text:    #ECF0F1;
  --color-sub:     #BDC3C7;
}
```

## 渲染清单

```bash
npx remotion studio                        # 预览
npx remotion still Main --frame=120       # 抽帧验证
npx remotion render Main out/final.mp4     # 渲染
```

## 注意事项

- 所有组件依赖 `useCurrentFrame()` 做帧级动画，不要用 `setTimeout`/`requestAnimationFrame`
- 动画使用 `interpolate` 和 `spring`，确保渲染确定性
- TreeOfThought 是递归组件，节点过深时建议限制深度 ≤4
- ReActLoop 每个循环的动画占约 5-6 秒（150-180 帧 @30fps）
- 字幕最大宽度建议 80% 视口，保证小屏可读
- **Subtitles 默认不用于管线**：视频管线使用外挂 VTT（与 MP4 同名），不烧录字幕。Subtitles.tsx 保留用于需内嵌字幕的场景