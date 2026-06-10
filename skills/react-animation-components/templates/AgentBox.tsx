import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface AgentBoxProps {
  children: React.ReactNode;
  opacity?: number;
  startFrame?: number;
  width?: number;
}

/**
 * AgentBox — Agent 容器卡片
 *
 * 圆角矩形、Agent 主题色边框、弹入动画。
 * 用于展示 Agent 内部状态（Thought / Observation）。
 */
export const AgentBox: React.FC<AgentBoxProps> = ({
  children,
  opacity,
  startFrame = 0,
  width = 500,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const effectiveFrame = Math.max(0, frame - startFrame);

  const scale = spring({
    frame: effectiveFrame,
    fps,
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
        left: '15%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        width,
        minHeight: 300,
        background: 'var(--bg-secondary)',
        border: '3px solid var(--color-agent)',
        borderRadius: 16,
        padding: '24px 28px',
        opacity: boxOpacity,
        boxShadow: '0 8px 32px rgba(88, 196, 221, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          color: 'var(--color-agent)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 8,
        }}
      >
        🤖 Agent
      </div>
      {children}
    </div>
  );
};

export default AgentBox;
