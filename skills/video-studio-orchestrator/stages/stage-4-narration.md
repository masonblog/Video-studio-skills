# Stage 4: TTS Narration (Director → Narrator)

## 概述
- **输入**：`script-final.md` + `pipeline-plan.md`
- **输出**：`narration.mp3` + `narration.vtt` + `timing.json`

---

## 核心原则：TTS-First 铁律
音频是 Master Timeline（主时间线）。必须先生成 TTS 旁白音频，通过解析 VTT 得到精确的场景时间段 (timing.json)，然后由 Renderer 依此时间段编写动画。**绝对禁止先做动画再配音**。

---

## 停顿规则
在提取出旁白后，使用空行来控制 edge-tts 的停顿节奏：
- **句子间**：不加空行（自然微停 ~100ms）。
- **段落间 (每2-3句)**：一个空行（中停 ~500ms，加 `\n\n`）。
- **场景/章节切换**：两个空行（长停 ~800ms-1000ms，加 `\n\n\n`）。
- **强调/悬念**：在句中使用 `...`（微停 ~300ms）。

---

## 工作流程

1. **提取旁白**：
   使用 `extract_narration.py` 脚本，从 `script-final.md` 中提取纯旁白，并格式化空行：
   ```bash
   python scripts/extract_narration.py script-final.md -o narration.txt
   ```
2. **生成音频与 VTT 字幕**：
   ```bash
   edge-tts --voice zh-CN-YunxiNeural --rate=+10% \
     -f narration.txt \
     --write-media narration.mp3 \
     --write-subtitles narration.vtt
   ```
3. **生成 timing.json**：
   解析 VTT 的时间戳，将每个 cue 的帧率（按 30fps 计算）映射到对应的场景名，并在 JSON 中写入 `highlight_frame_range`（默认首个 Hook 场景范围，或根据 plan 指定）。

---

## timing.json 正式 Schema 与示例

```json
{
  "total_duration_seconds": 458.9,
  "total_frames_30fps": 13767,
  "voice_profile": "zh-CN-YunxiNeural",
  "rate": "+10%",
  "highlight_frame_range": {
    "start_frame": 3,
    "end_frame": 417
  },
  "scenes": [
    {
      "name": "Hook",
      "cue_start": 1,
      "cue_end": 8,
      "start_frame": 3,
      "end_frame": 417
    },
    {
      "name": "Act1_A",
      "cue_start": 9,
      "cue_end": 35,
      "start_frame": 420,
      "end_frame": 1680
    }
  ]
}
```

---

## 中文 TTS 语音选型

| 语音 | 性别 | 风格 | 适用场景 |
|------|------|------|---------|
| `zh-CN-YunxiNeural` | 男 | 阳光、活泼 | **主力**——科普叙述、教学 |
| `zh-CN-YunyangNeural` | 男 | 专业、可靠 | 严肃话题、正式结论 |
| `zh-CN-YunjianNeural` | 男 | 激情 | 高潮段落、Hook 开头 |
| `zh-CN-XiaoxiaoNeural` | 女 | 温暖 | 人文话题、感性段落 |
