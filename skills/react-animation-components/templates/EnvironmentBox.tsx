import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';

interface EnvironmentBoxProps {
  children: React.ReactNode;
  opacity?: number;
  startFrame?: number;
  width?: number;
}

/**
 * EnvironmentBox — 环境/工具容器卡片
 *
 * 与 AgentBox 对称，位于画面右侧，橙色主题。
 */
export const EnvironmentBox: React.FC<EnvironmentBoxProps> = ({
  children,
  opacity,
  startFrame = 0,
  width = 500,
}) => {
  const frame = useCurrentFrame();
  const effectiveFrame = Math.max(0, frame - startFrame);

  const scale = spring({
    frame: effectiveFrame,
    fps: 30,
    config: { damping: 15, stiffness: 120 },
  });

  const boxOpacity = opacity ?? interpolate(effectiveFrame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        right: '15%',
        transform: `translate(50%, -50%) scale(${scale})`,
        width,
        minHeight: 300,
        background: 'var(--bg-secondary)',
        border: '3px solid var(--color-env)',
        borderRadius: 16,
        padding: '24px 28px',
        opacity: boxOpacity,
        boxShadow: '0 8px 32px rgba(243, 156, 18, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          color: 'var(--color-env)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 8,
        }}
      >
        🌐 Environment
      </div>
      {children}
    </div>
  );
};

export default EnvironmentBox;
