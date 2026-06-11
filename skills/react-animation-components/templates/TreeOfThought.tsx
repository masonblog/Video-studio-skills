import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export interface ThoughtNode {
  id: string;
  label: string;
  children?: ThoughtNode[];
  highlight?: boolean; // 标记最佳路径
}

interface TreeNodeComponentProps {
  node: ThoughtNode;
  depth: number;
  startFrame: number;
  maxDepth?: number;
}

/**
 * 递归渲染单个节点
 */
const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({
  node,
  depth,
  startFrame,
  maxDepth = 4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const effectiveFrame = Math.max(0, frame - startFrame);

  const scale = spring({
    frame: effectiveFrame,
    fps,
    config: { damping: 20, stiffness: 150 },
  });

  const opacity = interpolate(effectiveFrame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const isHighlight = node.highlight ?? false;
  const borderColor = isHighlight ? 'var(--color-agent)' : 'rgba(255,255,255,0.12)';
  const bgColor = isHighlight
    ? 'rgba(88, 196, 221, 0.1)'
    : 'rgba(255,255,255,0.03)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* 节点卡片 */}
      <div
        style={{
          padding: '8px 16px',
          background: bgColor,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 10,
          fontSize: 14,
          color: isHighlight ? 'var(--color-agent)' : 'var(--color-text)',
          fontFamily: 'var(--font-sans)',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        {isHighlight && <span style={{ marginRight: 4 }}>⭐</span>}
        {node.label}
      </div>

      {/* 子节点 */}
      {node.children && depth < maxDepth && (
        <>
          {/* 连线 */}
          <div
            style={{
              width: 1,
              height: 16,
              background: 'rgba(255,255,255,0.1)',
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: 20,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {node.children.map((child, i) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                depth={depth + 1}
                startFrame={startFrame + 15 + i * 8}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface TreeOfThoughtProps {
  tree: ThoughtNode;
  width: number;
  height: number;
  maxDepth?: number;
}

/**
 * TreeOfThought — 思维树分支可视化
 *
 * 递归渲染节点树，分层递进展示（子节点延迟出现），
 * 高亮标记最佳推理路径。
 */
export const TreeOfThought: React.FC<TreeOfThoughtProps> = ({
  tree,
  width,
  height,
  maxDepth = 4,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width,
        height,
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 24,
      }}
    >
      {/* 标题 */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 22,
          color: 'var(--color-agent)',
          letterSpacing: '0.05em',
          marginBottom: 20,
        }}
      >
        🌳 Tree of Thought
      </div>

      <TreeNodeComponent
        node={tree}
        depth={0}
        startFrame={0}
        maxDepth={maxDepth}
      />
    </div>
  );
};

export default TreeOfThought;
