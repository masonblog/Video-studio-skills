import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface ThoughtBubbleProps {
  text: string;
  opacity?: number;
  startFrame?: number;
  maxWidth?: number;
}

/**
 * ThoughtBubble — CSS 思维气泡
 *
 * 带思考点动画（三个点循环闪烁）。
 * 绿色主题，用于展示 Agent 的 Thought 阶段。
 */
export const ThoughtBubble: React.FC<ThoughtBubbleProps> = ({
  text,
  opacity,
  startFrame = 0,
  maxWidth = 380,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const effectiveFrame = Math.max(0, frame - startFrame);

  const scale = spring({
    frame: effectiveFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const bubbleOpacity = opacity ?? interpolate(effectiveFrame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // 思考点动画：三个点依次闪烁
  const dot1 = interpolate(effectiveFrame % 40, [0, 10, 20], [0.3, 1, 0.3], {
    extrapolateRight: 'clamp',
  });
  const dot2 = interpolate((effectiveFrame + 13) % 40, [0, 10, 20], [0.3, 1, 0.3], {
    extrapolateRight: 'clamp',
  });
  const dot3 = interpolate((effectiveFrame + 26) % 40, [0, 10, 20], [0.3, 1, 0.3], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'relative',
        transform: `scale(${scale})`,
        opacity: bubbleOpacity,
        maxWidth,
        background: 'rgba(46, 204, 113, 0.12)',
        border: '1px solid rgba(46, 204, 113, 0.3)',
        borderRadius: 18,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* 标签 */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--color-thought)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        💭 Thought
        {/* 思考点动画 */}
        <span style={{ display: 'inline-flex', gap: 3, marginLeft: 4 }}>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--color-thought)',
              opacity: dot1,
            }}
          />
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--color-thought)',
              opacity: dot2,
            }}
          />
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--color-thought)',
              opacity: dot3,
            }}
          />
        </span>
      </div>

      {/* 正文 */}
      <div
        style={{
          fontSize: 16,
          lineHeight: 1.5,
          color: 'var(--color-text)',
        }}
      >
        {text}
      </div>

      {/* 气泡尾巴 */}
      <div
        style={{
          position: 'absolute',
          bottom: -8,
          right: 30,
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid rgba(46, 204, 113, 0.12)',
        }}
      />
    </div>
  );
};

export default ThoughtBubble;
