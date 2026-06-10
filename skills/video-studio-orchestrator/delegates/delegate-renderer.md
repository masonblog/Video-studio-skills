# Delegate Renderer Prompt Template

## 目标
基于音频和 `timing.json` 创建 Remotion 项目，进行动画开发与多平台视频渲染。

---

## 委派提示词 (Prompt)

```
Goal: 基于 narration.mp3 + timing.json 创建 Remotion 项目 → 渲染多平台 MP4
Context:
  - pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md
  - 原材料目录：{VIDEO_PROJECTS_ROOT}/{project}/ (包含 narration.mp3, narration.vtt, timing.json, script-final.md)
  - Remotion 工作目录：{VIDEO_PROJECTS_ROOT}/{project}/remotion-project/

指令要求：
  1. 初始化 Remotion 项目并安装依赖，将 `narration.mp3` 和 `narration.vtt` 复制至项目的 `public/` 目录下。
  2. 使用 Python 脚本将 VTT 字幕文件转换成 TypeScript 数据：
     ```bash
     python scripts/vtt_to_subtitles.py public/narration.vtt -o src/subtitles.ts
     ```
  3. 读取 `timing.json` 中 `scenes` 的帧边界，设置各场景 `<Sequence>` 的 `from` 和 `durationInFrames`。
  4. 字幕外挂政策：不在 Remotion 中集成字幕组件烧录，字幕以外挂 VTT 形式发布。音频必须使用 `staticFile("narration.mp3")` 加载。
  5. 依照 VAS 参数，复用 `react-animation-components` 组件开发各场景 React 代码。
  6. 预览无误后进行渲染：
     - 渲染 横屏 `youtube.mp4` 并复制对应 `youtube.vtt`。
     - 渲染 竖屏 `vertical.mp4` 并复制对应 `vertical.vtt`。
     - 根据 `timing.json` 中的 `highlight_frame_range`，使用 ffmpeg 快速裁剪 `youtube.mp4`，输出精华版 `x-clip.mp4` 及其对应的 `x-clip.vtt` 字幕。
       ```bash
       ffmpeg -ss <start_time> -to <end_time> -i out/youtube.mp4 -c copy out/x-clip.mp4
       ```

Tools: terminal, file 
Skills: remotion, react-animation-components
```
