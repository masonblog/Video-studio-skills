import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface SubtitleItem {
  text: string;
  startFrame: number;
  endFrame: number;
}

interface SubtitlesProps {
  items: SubtitleItem[];
  fontSize?: number;
}

/**
 * Subtitles — 底部字幕条
 *
 * 按时间轴自动显示/隐藏。
 * 淡入淡出过渡，高对比度保证可读性。
 */
export const Subtitles: React.FC<SubtitlesProps> = ({
  items,
  fontSize = 28,
}) => {
  const frame = useCurrentFrame();

  // 查找当前活跃的字幕项
  const activeItem = items.find(
    (item) => frame >= item.startFrame && frame <= item.endFrame
  );

  if (!activeItem) return null;

  // 淡入淡出（前后各 6 帧过渡）
  const fadeIn = interpolate(
    frame,
    [activeItem.startFrame, activeItem.startFrame + 6],
    [0, 1],
    { extrapolateLeft: 'clamp' }
  );
  const fadeOut = interpolate(
    frame,
    [activeItem.endFrame - 6, activeItem.endFrame],
    [1, 0],
    { extrapolateRight: 'clamp' }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        textAlign: 'center',
        opacity,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize,
          fontWeight: 600,
          color: '#ffffff',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '10px 24px',
          borderRadius: 10,
          lineHeight: 1.5,
          display: 'inline-block',
          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
        }}
      >
        {activeItem.text}
      </span>
    </div>
  );
};

export default Subtitles;
