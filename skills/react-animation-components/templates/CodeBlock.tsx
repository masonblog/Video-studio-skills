import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface CodeBlockProps {
  code: string;
  opacity?: number;
  startFrame?: number;
  /** 逐字出现进度 0→1。省略时框架控制 */
  revealProgress?: number;
  language?: string;
}

/**
 * CodeBlock — 代码高亮展示块
 *
 * 深色终端风格，逐字出现效果。
 * 用于 ReAct 动画中的 Action 展示。
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  opacity,
  startFrame = 0,
  revealProgress,
  language = 'python',
}) => {
  const frame = useCurrentFrame();
  const effectiveFrame = Math.max(0, frame - startFrame);

  const blockOpacity = opacity ?? interpolate(effectiveFrame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // 逐字出现：默认在 30 帧内完成
  const progress = revealProgress ?? interpolate(effectiveFrame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const visibleLength = Math.floor(progress * code.length);
  const visibleCode = code.slice(0, visibleLength);

  // 光标闪烁
  const cursorOpacity = effectiveFrame % 20 < 10 ? 1 : 0;

  return (
    <div
      style={{
        opacity: blockOpacity,
        background: '#0d1117',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '16px 20px',
        fontFamily: 'var(--font-mono)',
        fontSize: 15,
        lineHeight: 1.7,
        color: '#c9d1d9',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 顶部栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
        <span
          style={{
            marginLeft: 12,
            fontSize: 11,
            color: 'var(--color-sub)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {language}
        </span>
      </div>

      {/* 代码内容 */}
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        <code>{visibleCode}</code>
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 16,
            background: 'var(--color-action)',
            opacity: cursorOpacity,
            verticalAlign: 'text-bottom',
            marginLeft: 1,
          }}
        />
      </pre>
    </div>
  );
};

export default CodeBlock;
