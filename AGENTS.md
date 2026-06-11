# Video Studio Skills — For AI Agents

This file explains the project to other AI agents (Hermes, Claude, etc.) that encounter this repository.

## What This Repo Is

A collection of **Hermes Agent skills** for multi-agent AI video production. It defines a 7-agent × 6-stage pipeline that turns a topic idea into a finished video package (MP4 + VTT subtitles + platform-specific SEO metadata).

## Architecture

```
Director (orchestrator)
  ├── Researcher   → Deep research → research-data.json
  ├── Writer       → Script draft  → script-draft.md
  ├── Editor       → Humanize      → script-final.md
  ├── Narrator     → TTS + timing  → narration.mp3 + timing.json
  ├── Renderer     → Remotion      → MP4 + external VTT
  └── Packager     → SEO/Distro    → deliverables/ (YouTube/B/X)
```

## How to Use This Repo

### As a human user

Follow the instructions in `README.md`.

### As an AI agent (Hermes)

1. Load the `video-studio-orchestrator` skill: `skill_view(name='video-studio-orchestrator')`
2. This skill contains the full pipeline workflow, delegate_task templates, quality standards, and all reference docs
3. When the user asks you to create a video, follow the pipeline stages in order
4. Use the agent personas in `agent-personas/` as SOUL.md content when creating Hermes profiles

### Key Conventions

- **TTS-First**: Narration audio is recorded before animation. timing.json bridges Narrator → Renderer.
- **External VTT**: Subtitles are delivered as separate .vtt files (not burned in). The MP4 and VTT share the same filename.
- **Quality checkpoints**: Director reviews output after Stages 2, 3, 5, and 6.
- **Default platform**: YouTube (1920×1080) + Bilibili + X/Twitter clip.
- **Default duration**: 8–12 minutes for YouTube, 1–3 minutes for shorts.

### File Purposes

| File/Dir | Purpose |
|-----------|---------|
| `skills/video-studio-orchestrator/SKILL.md` | Master orchestrator skill — load this first |
| `skills/video-studio-orchestrator/stages/` | Detailed specifications for stages 0-6 |
| `skills/video-studio-orchestrator/delegates/` | Delegate task prompt templates for each role |
| `skills/video-studio-orchestrator/references/` | Templates, guides, troubleshooting |
| `skills/video-studio-orchestrator/scripts/` | vtt_to_subtitles.py, extract_narration.py |
| `skills/react-animation-components/SKILL.md` | Remotion component library — load for rendering |
| `skills/react-animation-components/templates/` | 11 TypeScript React components |
| `skills/humanizer/SKILL.md` | De-AI + spoken-narration polishing skill — load for Stage 3 (Editor) |
| `skills/humanizer/references/` | Full 29-item AI-trace checklist with examples |
| `agent-personas/` | SOUL.md files for each of the 7 pipeline agents |

### Path Conventions

The repo uses placeholder paths. At runtime, resolve:
- `{VIDEO_PROJECTS_ROOT}` → where video projects live (default: `/workspace/video-projects/`)
- `{HERMES_HOME}` → Hermes config directory (default: `~/.hermes/`)
