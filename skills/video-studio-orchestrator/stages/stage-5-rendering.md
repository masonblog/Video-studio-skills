# Stage 5: Remotion Rendering (Director → Renderer)

## 概述
- **输入**：`narration.mp3` + `narration.vtt` + `timing.json` + `script-final.md`
- **输出**：Remotion 项目代码 + rendered 视频包（`youtube.mp4`、`vertical.mp4`、`x-clip.mp4` 及其对应的 VTT）

---

## 核心规范

### 1. 场景时间完全契约
- 场景的总时长及帧范围**必须完全从 `timing.json` 读取**，在 `<Sequence>` 组件的 `from` 和 `durationInFrames` 属性中严格应用。
- 绝不允许手动调整场景时长以防音画不同步。

### 2. 外部 VTT 字幕政策 (Subtitles are External)
- **不在 Remotion 视频层烧录字幕**，这意味着不要使用 `<Subtitles>` 动画组件。
- 所有的字幕必须在发布时以**同名的外挂 VTT 文件**方式传递给平台，播放器会自动加载，便于后期文本修改而无需重新渲染视频。

### 3. 音频加载规范
- Remotion 的 `<Audio>` 标签中 `src` 属性**必须使用 `staticFile("narration.mp3")`**。严禁裸写字符串，否则会在打包时报 404 错误。

---

## 工作流程

1. **项目初始化与音频放置**：
   在 `{VIDEO_PROJECTS_ROOT}/{project}/` 中创建 Remotion 项目。将 `narration.mp3` 和 `narration.vtt` 复制至项目的 `public/` 目录下。
2. **生成字幕 TS 数据**：
   使用 `vtt_to_subtitles.py` 转换 VTT 字幕文件：
   ```bash
   python scripts/vtt_to_subtitles.py public/narration.vtt -o src/subtitles.ts
   ```
3. **编写场景与 VAS 映射**：
   按 `script-final.md` 逐场景开发，引用 `react-animation-components` 组件库中的通用组件，将 VAS 标签及元素列表解析并映射为 Remotion 动画原语（参见下方参数映射表）。
4. **横屏渲染 (YouTube 横版)**：
   `npx remotion render <CompositionId> out/youtube.mp4`，并复制 `narration.vtt` 至 `out/youtube.vtt`。
5. **多版本适配 (竖屏与 X 精华)**：
   - 渲染 9:16 的 `vertical.mp4`。
   - 读取 `timing.json` 的 `highlight_frame_range`（起止帧）。将其转换为时间戳，使用 ffmpeg 对已渲染的 `youtube.mp4` 进行无损裁剪，生成 `x-clip.mp4` 及其对应的 `x-clip.vtt` 字幕。
     ```bash
     ffmpeg -ss <start_time> -to <end_time> -i out/youtube.mp4 -c copy out/x-clip.mp4
     ```

---

## VAS → Remotion 参数映射表

| VAS 参数 | Remotion 动画实现 (30fps) |
|----------|--------------------------|
| `entrance=fade-in` | `interpolate(f, [start, start+dur], [0,1], {extrapolateRight:'clamp'})` |
| `entrance=slide-up(N)` | `translateY: interpolate(f, [start, start+dur], [N, 0])` + opacity |
| `entrance=slide-left(N)` | `translateX: interpolate(f, [start, start+dur], [N, 0])` + opacity |
| `entrance=char-pop(N)` | 逐字符 `translateY: interpolate(charFrame, [0,8], [N, 0])` |
| `entrance=spring-scale` | `spring({frame: f-start, fps: 30, config: {damping:12, stiffness:100}})` |
| `entrance=typewriter` | 逐字符 `opacity: interpolate(charFrame, [0,4], [0,1])` |
| `stagger=Nf` | `const delay = charIndex * N` |
| `animate=bars-grow` | `scaleY: interpolate(f, [start, start+dur], [0, 1])` |
| `animate=line-draw` | SVG `strokeDashoffset: interpolate(f, [start, start+dur], [total, 0])` |
| `animate=count-up` | `Math.round(interpolate(f, [start, start+dur], [0, target]))` |
| `animate=pulse` | `1 + 0.05 * Math.sin(f * 0.15)` |
| `pos=center` | `display:'flex', justifyContent:'center', alignItems:'center'` |
| `pos=bottom-right` | `position:'absolute', bottom:0, right:0` |
| `glow` | `textShadow: '0 0 ...px rgba(...)'` |
| `[转场:type=crossfade,dur=Nf]` | 前后场景 opacity 交叉，overlap=Nf 帧 |
| `[转场:type=cut]` | 无过渡动画 |
