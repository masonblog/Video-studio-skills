1|---
2|name: react-animation-components
3|description: "ReAct 推理动画 Remotion 组件库：ThoughtBubble, AgentBox, ActionArrow, CodeBlock, ReActLoop, TreeOfThought, TitleCard, Subtitles。用于科普视频中的 AI Agent 推理过程可视化。"
4|version: 1.0.1
5|author: Hermes Agent
6|license: MIT
7|platforms: [linux, macos, windows]
8|metadata:
9|  hermes:
10|    tags: [remotion, react, animation, react-agent, visualization, components]
11|    category: creative
12|prerequisites:
13|  commands: [node, npx]
14|---
15|
16|# ReAct Animation Components — Remotion 组件库
17|
18|为科普视频中的 **ReAct 推理链** 可视化提供一套开箱即用的 Remotion React 组件。
19|
20|## 何时加载
21|
22|当 Director 委派 Renderer 制作视频时，Renderer 必须加载此 Skill。也适用于任何需要展示 AI Agent 推理过程的视频项目。
23|
24|## 组件总览
25|
26|| 组件 | 文件 | 用途 |
27||------|------|------|
28|| `Theme` | `templates/Theme.tsx` | CSS 变量、配色系统、字体栈 |
29|| `AgentBox` | `templates/AgentBox.tsx` | Agent 容器卡片（圆角、阴影、主题色边框） |
30|| `EnvironmentBox` | `templates/EnvironmentBox.tsx` | Environment 容器卡片 |
31|| `ThoughtBubble` | `templates/ThoughtBubble.tsx` | CSS 气泡 + 思考点动画 |
32|| `ActionArrow` | `templates/ActionArrow.tsx` | SVG 从 Agent 到 Environment 的箭头 |
33|| `ObserveArrow` | `templates/ObserveArrow.tsx` | SVG 从 Environment 到 Agent 的回传箭头 |
34|| `CodeBlock` | `templates/CodeBlock.tsx` | 代码高亮展示块 |
35|| `ReActLoop` | `templates/ReActLoop.tsx` | 完整 ReAct 三步循环组件 |
36|| `TreeOfThought` | `templates/TreeOfThought.tsx` | ToT 分支树递归组件 |
37|| `TitleCard` | `templates/TitleCard.tsx` | 章节标题卡（打字机 + 弹入） |
38|| `Subtitles` | `templates/Subtitles.tsx` | 底部字幕条（保留用于需内嵌场景；管线默认使用外挂 VTT） |
39|
40|## 使用方法
41|
42|### 1. 将模板文件复制到 Remotion 项目
43|
44|```bash
45|SKILL_DIR="$HOME/.hermes/skills/creative/react-animation-components"
46|cp $SKILL_DIR/templates/Theme.tsx src/components/
47|cp $SKILL_DIR/templates/*.tsx src/components/
48|```
49|
50|### 2. 在最外层包裹 Theme
51|
52|```tsx
53|// src/Root.tsx
54|import { Theme } from './components/Theme';
55|
56|export const RemotionRoot: React.FC = () => (
57|  <Theme>
58|    <Composition id="Main" component={Main} durationInFrames={900} fps={30} width={1920} height={1080} />
59|  </Theme>
60|);
61|```
62|
63|Theme 注入所有 CSS 变量，组件通过 CSS 变量自动适配配色。
64|
65|### 3. 使用 ReActLoop（最常用）
66|
67|```tsx
68|import { ReActLoop } from './components/ReActLoop';
69|
70|const SceneReAct: React.FC = () => {
71|  const rounds = [
72|    { thought: "我需要搜索 ReAct 论文", action: 'search("ReAct reasoning LLM")', observation: "找到 5 篇论文", startFrame: 0 },
73|    { thought: "阅读摘要", action: 'read_paper("2203.12345")', observation: "ReAct = reasoning + acting", startFrame: 180 },
74|  ];
75|  return <ReActLoop rounds={rounds} width={1920} height={1080} />;
76|};
77|```
78|
79|### 4. 使用 TreeOfThought（扩展话题）
80|
81|```tsx
82|import { TreeOfThought, type ThoughtNode } from './components/TreeOfThought';
83|const treeData: ThoughtNode = {
84|  id: 'root', label: '如何解决？',
85|  children: [
86|    { id: 'a', label: '方案 A', children: [{ id: 'a1', label: 'A1' }, { id: 'a2', label: 'A2', highlight: true }] },
87|    { id: 'b', label: '方案 B', children: [{ id: 'b1', label: 'B1' }] },
88|  ],
89|};
90|<TreeOfThought tree={treeData} width={1920} height={1080} />;
91|```
92|
93|### 5. Subtitles 组件（按需使用）
94|
95|**管线默认不使用此组件。** 视频管线工作流通过外挂 VTT 文件（与 MP4 同名）提供字幕，播放器（YouTube/VLC/IINA）自动加载。`Subtitles.tsx` 保留用于需要烧录字幕的场景（如竖屏短视频平台不支持外挂字幕）。
96|
97|```tsx
98|import { Subtitles } from './components/Subtitles';
99|const subs = [
100|  { text: "旁白内容", startFrame: 0, endFrame: 120 },
101|];
102|<Subtitles items={subs} />
103|```
104|
105|## 配色定制
106|
107|通过 CSS 变量覆盖默认配色：
108|
109|```css
110|:root {
111|  --bg-primary:    #1a1a2e;
112|  --bg-secondary:  #16213e;
113|  --color-agent:   #58C4DD;
114|  --color-env:     #F39C12;
115|  --color-thought: #2ECC71;
116|  --color-action:  #E74C3C;
117|  --color-obs:     #9B59B6;
118|  --color-text:    #ECF0F1;
119|  --color-sub:     #BDC3C7;
120|}
121|```
122|
123|## 渲染清单
124|
125|```bash
126|npx remotion studio                        # 预览
127|npx remotion still Main --frame=120       # 抽帧验证
128|npx remotion render Main out/final.mp4     # 渲染
129|```
130|
131|## 注意事项
132|
133|- 所有组件依赖 `useCurrentFrame()` 做帧级动画，不要用 `setTimeout`/`requestAnimationFrame`
134|- 动画使用 `interpolate` 和 `spring`，确保渲染确定性
135|- TreeOfThought 是递归组件，节点过深时建议限制深度 ≤4
136|- ReActLoop 每个循环的动画占约 5-6 秒（150-180 帧 @30fps）
137|- 字幕最大宽度建议 80% 视口，保证小屏可读
138|- **Subtitles 默认不用于管线**：视频管线使用外挂 VTT（与 MP4 同名），不烧录字幕。Subtitles.tsx 保留用于需内嵌字幕的场景