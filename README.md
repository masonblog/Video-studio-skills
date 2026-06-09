# Video Studio Skills 🎬

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Hermes Agent](https://img.shields.io/badge/Hermes-Agent-8A2BE2)](https://github.com/NousResearch/hermes-agent)

> **AI 驱动的多 Agent 协作视频创作技能集** — 7 个 Agent × 6 个阶段，从选题到发布全程自动化。

**Video Studio Skills** 是一套面向 [Hermes Agent](https://github.com/NousResearch/hermes-agent) 的视频创作技能包。它让你用 7 个 AI Agent 组成一个视频工作室——从深度调研、脚本写作、中文 TTS 配音到 Remotion 动画渲染、多平台 SEO 包装，全部由 Agent 协作完成。

---

## 管线架构

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

## 包含什么

| 模块 | 内容 | 用途 |
|------|------|------|
| **`video-studio-orchestrator`** skill | 完整 6 阶段管线编排 + 14 篇参考文档 | 管线总控 |
| **`react-animation-components`** skill | 11 个 Remotion React 组件 | 视频动画渲染 |
| **agent-personas/** | 7 个 Agent 角色定义 (SOUL.md) | 创建 Hermes Profile |
| **scripts/** | 2 个辅助脚本 | VTT 解析 / 旁白提取 |

## 安装

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

## 快速开始

1. 在 Hermes Studio 群聊中 @video-director
2. 说：**「做一期关于 [你的话题] 的视频」**
3. Director 会创建项目计划，然后按顺序派发任务给各 Agent
4. 最终在 `deliverables/` 目录拿到 MP4 + 包装素材

## 依赖

- **Hermes Agent** ≥ 0.6.0
- **Node.js** ≥ 18 + [Remotion](https://remotion.dev) 4.x
- **[edge-tts](https://github.com/rany2/edge-tts)** — 中文 TTS 配音
- **ffmpeg** — 音频处理 + 视频编码

## 路径约定

Repo 中使用了以下占位符，安装时按实际环境调整：

| 占位符 | 说明 | 默认值 |
|--------|------|--------|
| `{VIDEO_PROJECTS_ROOT}` | 视频项目存放根目录 | `/workspace/video-projects/` |
| `{HERMES_HOME}` | Hermes 配置目录 | `~/.hermes/` |

所有 Agent Persona 和 Skill 参考文档中的路径均为示例，启动首个项目后 Director 会帮你在配置中设定。

## 文件结构

```
Video-studio-skills/
├── README.md
├── LICENSE
├── AGENTS.md
├── skills/
│   ├── video-studio-orchestrator/
│   │   ├── SKILL.md              ← 管线编排技能
│   │   ├── references/            ← 14 篇参考：管线计划模板、视觉动画指南等
│   │   └── scripts/               ← VTT→TS 解析 / 旁白提取
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
