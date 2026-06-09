# TTS-First Narration Guide

Why TTS-First, how to add natural pauses, voice selection, and the Narrator→Renderer handoff.

## The Problem

Script timestamps are handwritten estimates. A line marked "0:03" may actually take 2.1 seconds to speak, or 3.8 seconds. When animation is built to these estimates and TTS is added later, the result is audio-video desync: some scenes finish early (dead air), others run long (narration spills into the next scene).

## The Fix: TTS-First

1. Writer produces script with narration text only (timestamps are rough estimates, ignored by Narrator)
2. Narrator generates TTS, measures actual duration per segment
3. Narrator produces `timing.json` mapping scenes to exact frame ranges
4. Renderer builds animation to match the actual audio timing

This guarantees frame-accurate sync.

## Natural Pause Rules

edge-tts does not support SSML. Control pauses through text formatting:

| Pause type | Text marker | Effect (~ms) | When to use |
|-----------|-------------|-------------|-------------|
| Sentence boundary | (none) | ~100ms | Default between sentences |
| Paragraph break | `\n\n` (blank line) | ~500ms | Between paragraphs, every 2-3 sentences |
| Section/scene break | `\n\n\n` (two blank lines) | ~800ms | Between video sections/chapters |
| Emphasis/suspense | `...` | ~300ms | Before a reveal or key point |

Without these markers, edge-tts reads continuously like a robot on fast-forward.

## Voice Selection (Chinese)

| Voice | Style | Use case |
|-------|-------|----------|
| `zh-CN-YunxiNeural` | Lively, sunshine | **Primary** — educational narration |
| `zh-CN-YunyangNeural` | Professional, reliable | Serious/formal topics |
| `zh-CN-YunjianNeural` | Passionate | High-energy segments, hooks |
| `zh-CN-XiaoxiaoNeural` | Warm (female) | Human-interest topics |

Default: `--rate=+10%` (matches podcast/educational video pacing).

## Workflow

### Step 1: Extract narration text
```bash
bash scripts/extract-narration.sh script-final.md > narration-raw.txt
```

### Step 2: Add pause markers
Edit `narration-raw.txt`: add `\n\n` every 2-3 sentences, `\n\n\n` at section breaks.

### Step 3: Generate TTS
```bash
edge-tts --voice zh-CN-YunxiNeural --rate=+10% \
  -f narration-paused.txt \
  --write-media public/narration.mp3 \
  --write-subtitles public/narration.vtt
```

### Step 4: Verify VTT
Check that the last cue's end time matches the audio duration:
```bash
tail -5 public/narration.vtt
ffprobe public/narration.mp3 2>&1 | grep Duration
```

### Step 5: Generate subtitles.ts
```bash
python3 scripts/vtt-to-subtitles.py public/narration.vtt 30 > src/subtitles.ts
```

### Step 6: Generate timing.json
Map VTT cue indices to scene boundaries. This is the handoff to Renderer.

### Step 7: Verify sync
```bash
npx remotion still --frame=<keyframe> --scale=0.25
```
Check that subtitles and visuals align at key moments.

## Handoff Format: timing.json

```json
{
  "total_duration_seconds": 458.9,
  "total_frames_30fps": 13767,
  "voice_profile": "zh-CN-YunxiNeural",
  "rate": "+10%",
  "scenes": [
    {
      "name": "Hook",
      "cue_start": 1,
      "cue_end": 8,
      "start_frame": 3,
      "end_frame": 417
    },
    {
      "name": "Act1_Risk",
      "cue_start": 9,
      "cue_end": 35,
      "start_frame": 420,
      "end_frame": 1680
    }
  ]
}
```

Renderer reads this JSON. Each scene's `<Sequence>` uses:
```tsx
<Sequence from={scene.start_frame} durationInFrames={scene.end_frame - scene.start_frame}>
```

Zero computation on Renderer's side — the timing is fully determined by the actual TTS audio.

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| TTS sounds robotic | No pause markers in text | Add `\n\n` every 2-3 sentences |
| Video too short/long | Script timestamps ≠ TTS duration | TTS-First: let TTS determine total duration |
| Subtitles not showing | VTT parsing failed | Check `vtt-to-subtitles.py` output for syntax errors |
| Audio 404 in render | Used bare string for Audio src | Use `staticFile("narration.mp3")` |
| Pauses too long/short | `\n\n` spacing inconsistent | Standardize: exactly one blank line between paragraphs |
