# Profile API Key Setup for Multi-Profile Mode

## Problem

When using Hermes Studio multi-profile group chat, video-* profiles fail with "no API key configured" even though the default profile works fine.

## Root Cause

Each profile needs its own `.env` in its profile directory. In CLI mode (`hermes -p <name>`), profiles inherit from the parent shell environment. In gateway/group-chat mode, they look for `~/.hermes/profiles/<name>/.env`.

## Fix

```bash
for p in video-director video-researcher video-writer video-editor \
         video-narrator video-renderer video-packager; do
  ln -sf ~/.hermes/.env ~/.hermes/profiles/$p/.env
done
```

## Notes

- **Renderer timeout**: 9 min video ≈ 25-35 min render. Director should handle final `npx remotion render` separately from delegate_task.
- **External subtitles**: Subtitles are external VTT files (same-named alongside MP4), not burned-in. No re-rendering needed for subtitle edits.
- **Model config**: New profiles have no model. Set: `hermes -p <name> config set model.default <model>` and `hermes -p <name> config set model.provider <provider>`.
