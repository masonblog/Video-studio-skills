# Remotion Rendering Pitfalls

## `staticFile()` 必需规则

在 Remotion 项目中使用 `public/` 目录下的静态资源时，**必须**通过 `staticFile()` 引用：

```tsx
// ❌ 错误 — dev 模式正常，render 模式 404
<Audio src="narration.mp3" />

// ✅ 正确
import { staticFile } from 'remotion';
<Audio src={staticFile("narration.mp3")} />
```

**原因**：Remotion 在 render 模式下使用临时 webpack bundle 目录，非 `public/` 路径的静态资源不会被复制进去。`staticFile()` 告诉 Remotion 将文件从 `public/` 复制到 bundle 目录。

**影响范围**：`<Audio>`, `<Video>`, `<Img>`, `<OffthreadVideo>` 等所有接受文件路径的组件。

## 渲染超时处理

9-10 分钟视频在单核 ARM 服务器上渲染约需 30-40 分钟。`delegate_task` 默认 600s 超时通常不够。策略：

1. **分流模式**：Producer 只负责代码 + TTS，Director 承担最终 `npx remotion render`
2. **后台渲染**：`terminal(background=true, notify_on_complete=true)` + 600s timeout
3. **帧数估算**：`时长秒数 × 30fps`，单核 ARM 约 1 frame/0.12s，预估总时间

## 验证顺序

```bash
npx remotion studio           # 1. 先浏览器预览（秒级迭代）
npx remotion still --frame=X  # 2. 抽关键帧验证
npx remotion render ...       # 3. 最后全量渲染（30+分钟）
```

跳过步骤 1-2 直接渲染会因为微小错误浪费大量时间。
