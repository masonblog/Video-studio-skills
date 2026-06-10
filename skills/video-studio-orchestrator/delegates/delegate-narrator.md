# Delegate Narrator Prompt Template

## 目标
提取脚本旁白，利用 `edge-tts` 生成配音音频、VTT 字幕，并输出 `timing.json`。

---

## 委派提示词 (Prompt)

```
Goal: 提取脚本旁白 → 生成 TTS 配音 + timing.json
Context:
  - pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md
  - 润色定稿：{VIDEO_PROJECTS_ROOT}/{project}/script-final.md
  - 脚本存放目录：{VIDEO_PROJECTS_ROOT}/{project}/

指令要求：
  1. 使用 Python 脚本自动从 script-final.md 提取旁白文本（过滤所有的 `##` 标题行和 `[画面]`/`[图表]` 等 VAS 视觉标记）：
     ```bash
     python scripts/extract_narration.py script-final.md -o narration.txt
     ```
  2. 根据停顿规则格式化 narration.txt，插入合适空行（段落间一个空行 `\n\n`，场景间两个空行 `\n\n\n`）。
  3. 运行 edge-tts 生成音频和 VTT 字幕：
     ```bash
     edge-tts --voice zh-CN-YunxiNeural --rate=+10% -f narration.txt --write-media narration.mp3 --write-subtitles narration.vtt
     ```
  4. 解析 VTT 字幕文件，将每一个 cue 对应的帧率映射到脚本场景名称，输出 `timing.json`。
  5. 在 `timing.json` 中添加 `highlight_frame_range` 字段（根据计划或默认选取首个 Hook 场景范围），并将 `scenes` 作为映射数组字段名。
  6. 输出验证摘要（包括总时长、VTT cue 数和场景数）。

Tools: terminal, file
```
