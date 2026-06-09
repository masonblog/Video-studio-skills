import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface ActionArrowProps {
  /** 动画进度 0→1（用于控制箭头画出） */
  progress: number;
  /** 箭头标签（如 "Action: search(...)"） */
  label?: string;
  /** 附加 CSS top 偏移 */
  topOffset?: number;
}

/**
 * ActionArrow — SVG 动画箭头（Agent → Environment）
 *
 * 使用 stroke-dashoffset 动画实现"从无到有画出"效果。
 * 红色主题。
 */
export const ActionArrow: React.FC<ActionArrowProps> = ({
  progress,
  label,
  topOffset = 0,
}) => {
  const frame = useCurrentFrame();

  // 箭头路径：Agent 右侧 → Environment 左侧
  const pathD = 'M 520 380 L 1180 380';

  // 控制路径绘制进度
  const dashOffset = interpolate(progress, [0, 1], [700, 0], {
    extrapolateRight: 'clamp',
  });

  // 标签出现时机（箭头画到一半时显示）
  const labelOpacity = interpolate(progress, [0.4, 0.6], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // 箭头头部（三角）出现时机
  const headOpacity = interpolate(progress, [0.85, 1], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // 颜色脉冲（箭头到达时闪一下）
  const pulse = interpolate(
    progress,
    [0.9, 0.95, 1],
    [1, 1.5, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: `calc(50% + ${topOffset}px)`,
        left: 0,
        width: '100%',
        height: 60,
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
      }}
    >
      <svg
        width="100%"
        height="60"
        viewBox="0 0 1920 60"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* 主箭头线 */}
        <path
          d={pathD}
          stroke="var(--color-action)"
          strokeWidth={3}
          strokeDasharray="700"
          strokeDashoffset={dashOffset}
          fill="none"
          strokeLinecap="round"
          filter={`drop-shadow(0 0 ${4 * pulse}px rgba(231, 76, 60, 0.6))`}
        />

        {/* 箭头头部（三角） */}
        <polygon
          points="1180,370 1200,380 1180,390"
          fill="var(--color-action)"
          opacity={headOpacity}
        />
      </svg>

      {/* 标签 */}
      {label && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -120%)`,
            opacity: labelOpacity,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--color-action)',
            background: 'rgba(231, 76, 60, 0.1)',
            padding: '4px 12px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
          }}
        >
          ⚡ {label}
        </div>
      )}
    </div>
  );
};

export default ActionArrow;
