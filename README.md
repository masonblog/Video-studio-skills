# Video Studio Skills 🎬

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Hermes Agent](https://img.shields.io/badge/Hermes-Agent-8A2BE2)](https://github.com/NousResearch/hermes-agent)
[![Remotion](https://img.shields.io/badge/Remotion-Video-blue?logo=react)](https://remotion.dev)
[![Python](https://img.shields.io/badge/Python-Scripts-3776AB?logo=python&logoColor=white)](https://python.org)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-Media-007808?logo=ffmpeg&logoColor=white)](https://ffmpeg.org)

> **AI 驱动的多 Agent 协作视频创作技能集** — 7 个 Agent × 6 个阶段，从选题到发布全程自动化。

**Video Studio Skills** 是一套面向 [Hermes Agent](https://github.com/NousResearch/hermes-agent) 的一站式视频创作技能包。它让你用 7 个 AI Agent 组成一个视频工作室——从深度调研、脚本写作、中文 TTS 配音到 Remotion 动画渲染、多平台 SEO 包装，全部由 Agent 协作完成。

---

## 工作架构

```
你（选题）
  │
  ▼
Director（导演/编排）
  ├── Researcher      →  深度调研    →  research-data.json
  ├── Writer          →  脚本创作    →  script-draft.md
  ├── Editor          →  去AI润色    →  script-final.md
  ├── Narrator        →  TTS 配音    →  narration.mp3 + timing.json
  ├── Renderer        →  Remotion 渲染 → MP4 (+ 外挂 VTT 字幕)
  └── Packager        →  SEO 包装    →  deliverables/ (YouTube/Bilibili/X)
```

---

## 安装与配置

### 方式一：AI 自动安装（推荐）

将以下指令发送给你的 AI Agent，让它自动读取并配置：

```text
请帮我安装并配置这个项目：https://github.com/masonblog/Video-studio-skills.git
```

*(注：Agent 会自动读取项目中的 `AGENTS.md` 了解架构并执行必要的安装与配置)*

### 方式二：手动安装

```bash
# 1. 克隆仓库
git clone https://github.com/masonblog/Video-studio-skills.git
cd Video-studio-skills

# 2. 安装 Skills 到 Hermes
cp -r skills/video-studio-orchestrator ~/.hermes/skills/creative/
cp -r skills/react-animation-components ~/.hermes/skills/creative/

# 3. 创建 Agent Profiles（Hermes Studio 中每个 Agent 一个 Profile）
hermes profile create video-director
hermes profile create video-researcher
hermes profile create video-writer
hermes profile create video-editor
hermes profile create video-narrator
hermes profile create video-renderer
hermes profile create video-packager

# 4. 部署 Persona 文件
for agent in director researcher writer editor narrator renderer packager; do
  cp agent-personas/video-${agent}.md ~/.hermes/profiles/video-${agent}/SOUL.md
done
```

## 运行模式

Video Studio Skills 旨在多 Agent 环境中进行视频创作。你可以根据偏好选择以下三种模式来运行视频生成管线：

### 1. 群聊模式 (Group Chat Mode)  (推荐)

**适合场景**：想全程观察 Agent 间的协作，且随时需要插话或调整方向。

- 推荐使用 [hermes-web-ui](https://github.com/EKKOLearnAI/hermes-web-ui) 群聊功能，将全部 7 个 Profile 拉进同一个群聊。
- 在群里直接 `@video-director` 说：「做一期关于 [你的话题] 的视频」。Director 会在群聊中依次 `@` 其他 Agent 派发任务，所有讨论和中间件交付对你完全公开。

### 2. 委派模式 (Delegate Mode)

**适合场景**：不希望被海量聊天记录刷屏，只想要一个专属的「包工头」向你汇报。

- 只需创建一个与 `video-director` 的单聊会话。
- 直接向 Director 下达任务。Director 会在后台利用 `delegate_task` 工具（子 Agent 调用机制）隐式派发调研、写稿、渲染等子任务。你只需要看 Director 的关键节点汇报和最终成品即可，工作流极其清爽。

### 3. 看板模式 (Kanban Mode)

**适合场景**：适合长线的、大批量的视频生产，需要精确掌握每个视频当前处于哪个节点。

- 通过项目看板文件（如 `kanban.md` 或项目管理工具）来驱动。
- 在看板的 "To Do" (待办) 列添加一个视频选题。Director 会自动将其拆解并分配给其他 Agent。Agent 认领任务并完成后，会将状态流转到下一阶段（例如从 Writer 移交到 Editor）。整个过程结构化、透明且易于追溯。

## 依赖

- **Hermes Agent** ≥ 0.6.0
- **Node.js** ≥ 18 + [Remotion](https://remotion.dev) 4.x
- **[edge-tts](https://github.com/rany2/edge-tts)** — 中文 TTS 配音
- **ffmpeg** — 音频处理 + 视频编码

## 路径约定

Repo 中使用了以下占位符，安装时按实际环境调整：

| 占位符                     | 说明          | 默认值                          |
| ----------------------- | ----------- | ---------------------------- |
| `{VIDEO_PROJECTS_ROOT}` | 视频项目存放根目录   | `/workspace/video-projects/` |
| `{HERMES_HOME}`         | Hermes 配置目录 | `~/.hermes/`                 |

所有 Agent Persona 和 Skill 参考文档中的路径均为示例，启动首个项目后 Director 会帮你在配置中设定。

## 文件结构

```
Video-studio-skills/
├── README.md
├── LICENSE
├── AGENTS.md
├── skills/
│   ├── video-studio-orchestrator/
│   │   ├── SKILL.md              ← 管线编排技能（入口）
│   │   ├── stages/                ← 各阶段 (Stages 0-6) 详细执行规范
│   │   ├── delegates/             ← 各角色委派任务提示词模板
│   │   ├── references/            ← 参考文档：管线计划模板、视觉动画指南等
│   │   └── scripts/               ← VTT→TS 解析 / 旁白提取 (Python)
│   └── react-animation-components/
│       ├── SKILL.md
│       ├── references/
│       └── templates/             ← 11 个 Remotion React 组件
├── agent-personas/
│   ├── video-director.md
│   ├── video-researcher.md
│   ├── video-writer.md
│   ├── video-editor.md
│   ├── video-narrator.md
│   ├── video-renderer.md
│   └── video-packager.md
└── docs/
```

## 许可证

MIT © 2026 [Mason Hu](https://github.com/masonblog)
