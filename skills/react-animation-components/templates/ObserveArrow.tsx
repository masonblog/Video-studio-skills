import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface ObserveArrowProps {
  progress: number;
  label?: string;
  topOffset?: number;
}

/**
 * ObserveArrow — SVG 回传箭头（Environment → Agent）
 *
 * 与 ActionArrow 方向相反，紫色主题。
 */
export const ObserveArrow: React.FC<ObserveArrowProps> = ({
  progress,
  label,
  topOffset = 60,
}) => {
  const frame = useCurrentFrame();

  // 回传箭头路径：Environment 左侧 → Agent 右侧（弯折路径，从下方回传）
  const pathD = 'M 1180 450 L 850 450 L 850 420';

  const dashOffset = interpolate(progress, [0, 1], [550, 0], {
    extrapolateRight: 'clamp',
  });

  const labelOpacity = interpolate(progress, [0.4, 0.6], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const headOpacity = interpolate(progress, [0.85, 1], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: `calc(50% + ${topOffset}px)`,
        left: 0,
        width: '100%',
        height: 100,
        pointerEvents: 'none',
      }}
    >
      <svg
        width="100%"
        height="100"
        viewBox="0 0 1920 100"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* 主回传线 */}
        <path
          d={pathD}
          stroke="var(--color-obs)"
          strokeWidth={3}
          strokeDasharray="550"
          strokeDashoffset={dashOffset}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 箭头头部（三角） */}
        <polygon
          points="850,410 830,420 850,430"
          fill="var(--color-obs)"
          opacity={headOpacity}
        />
      </svg>

      {label && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '65%',
            transform: 'translate(-50%, -130%)',
            opacity: labelOpacity,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--color-obs)',
            background: 'rgba(155, 89, 182, 0.1)',
            padding: '4px 12px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
          }}
        >
          📡 {label}
        </div>
      )}
    </div>
  );
};

export default ObserveArrow;
