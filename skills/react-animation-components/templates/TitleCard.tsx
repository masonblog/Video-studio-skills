import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';

interface TitleCardProps {
  title: string;
  subtitle?: string;
  width: number;
  height: number;
}

/**
 * TitleCard — 章节标题卡
 *
 * 居中的大标题 + 可选副标题。
 * 打字机效果（逐字出现）+ 弹入动画。
 */
export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  width,
  height,
}) => {
  const frame = useCurrentFrame();

  // 弹入
  const scale = spring({
    frame,
    fps: 30,
    config: { damping: 15, stiffness: 100 },
  });

  // 打字机效果（60 帧内完成）
  const charsPerFrame = title.length / 60;
  const visibleChars = Math.min(
    Math.floor(frame * charsPerFrame),
    title.length
  );
  const displayedTitle = title.slice(0, visibleChars);

  // 光标
  const cursorVisible = frame % 20 < 10 && visibleChars < title.length;

  // 副标题延迟出现
  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // 装饰线
  const lineWidth = spring({
    frame: Math.max(0, frame - 20),
    fps: 30,
    config: { damping: 20, stiffness: 80 },
  });

  return (
    <div
      style={{
        width,
        height,
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}
    >
      {/* 装饰线 */}
      <div
        style={{
          width: `${lineWidth * 200}px`,
          height: 3,
          background: 'linear-gradient(90deg, var(--color-agent), var(--color-thought))',
          borderRadius: 2,
          marginBottom: 10,
        }}
      />

      {/* 标题 */}
      <h1
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 48,
          fontWeight: 700,
          color: 'var(--color-text)',
          textAlign: 'center',
          maxWidth: '80%',
          transform: `scale(${scale})`,
          lineHeight: 1.3,
        }}
      >
        {displayedTitle}
        <span
          style={{
            display: cursorVisible ? 'inline-block' : 'none',
            width: 3,
            height: 40,
            background: 'var(--color-agent)',
            marginLeft: 4,
            verticalAlign: 'middle',
          }}
        />
      </h1>

      {/* 副标题 */}
      {subtitle && (
        <p
          style={{
            opacity: subtitleOpacity,
            fontFamily: 'var(--font-sans)',
            fontSize: 20,
            color: 'var(--color-sub)',
            textAlign: 'center',
            maxWidth: '60%',
            lineHeight: 1.5,
            marginTop: 8,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default TitleCard;
