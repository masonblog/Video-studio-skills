import React from 'react';
import { useCurrentFrame, interpolate, AbsoluteFill } from 'remotion';
import { AgentBox } from './AgentBox';
import { EnvironmentBox } from './EnvironmentBox';
import { ThoughtBubble } from './ThoughtBubble';
import { CodeBlock } from './CodeBlock';
import { ActionArrow } from './ActionArrow';
import { ObserveArrow } from './ObserveArrow';

interface ReActRound {
  thought: string;
  action: string;
  observation: string;
  startFrame: number;
}

interface ReActLoopProps {
  rounds: ReActRound[];
  width: number;
  height: number;
  /** 每轮动画持续时间（帧），默认 180 (6秒@30fps) */
  roundDuration?: number;
}

/**
 * ReActLoop — 完整 ReAct 三步循环组件
 *
 * 每轮 (round) 展示:
 *   1. Thought 气泡 (Agent 框内, 绿色)
 *   2. Action 箭头 + 代码块 (Agent → Environment, 红色)
 *   3. Observation 回传 (Environment → Agent, 紫色)
 *
 * 多轮依次播放，自动管理时序。
 */
export const ReActLoop: React.FC<ReActLoopProps> = ({
  rounds,
  width,
  height,
  roundDuration = 180,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: 'var(--bg-primary)',
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {rounds.map((round, index) => {
        const roundFrame = frame - round.startFrame;
        const isActive = roundFrame >= 0 && roundFrame < roundDuration;

        if (!isActive) return null;

        // 三个阶段各占 1/3
        const phaseLength = roundDuration / 3;
        const thoughtProgress = interpolate(roundFrame, [0, phaseLength], [0, 1], {
          extrapolateRight: 'clamp',
        });
        const actionProgress = interpolate(
          roundFrame,
          [phaseLength * 0.8, phaseLength * 1.2],
          [0, 1],
          { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
        );
        const obsProgress = interpolate(
          roundFrame,
          [phaseLength * 1.8, phaseLength * 2.2],
          [0, 1],
          { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
        );

        // 轮次标签
        const roundLabelOpacity = interpolate(roundFrame, [0, 15], [0, 1], {
          extrapolateRight: 'clamp',
        });

        return (
          <div key={index}>
            {/* 轮次标签 */}
            <div
              style={{
                position: 'absolute',
                top: 40,
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: roundLabelOpacity,
                fontFamily: 'var(--font-mono)',
                fontSize: 18,
                color: 'var(--color-sub)',
                letterSpacing: '0.05em',
              }}
            >
              Round {index + 1} / {rounds.length}
            </div>

            {/* Agent 框 + Thought */}
            <AgentBox startFrame={round.startFrame}>
              <ThoughtBubble
                text={round.thought}
                startFrame={round.startFrame}
              />

              {/* Observation 回传结果（第二阶段后显示） */}
              <div
                style={{
                  opacity: obsProgress,
                  marginTop: 8,
                  padding: '12px 16px',
                  background: 'rgba(155, 89, 182, 0.08)',
                  border: '1px solid rgba(155, 89, 182, 0.2)',
                  borderRadius: 10,
                  fontSize: 14,
                  color: 'var(--color-obs)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.7 }}>
                  📡 Observation
                </span>
                <div style={{ marginTop: 4, color: 'var(--color-text)' }}>
                  {round.observation}
                </div>
              </div>
            </AgentBox>

            {/* Environment 框 + CodeBlock */}
            <EnvironmentBox startFrame={round.startFrame}>
              <CodeBlock
                code={round.action}
                startFrame={round.startFrame + Math.floor(phaseLength * 0.6)}
              />
            </EnvironmentBox>

            {/* Action 箭头 */}
            <ActionArrow
              progress={actionProgress}
              label={round.action.length > 30
                ? round.action.slice(0, 30) + '...'
                : round.action}
            />

            {/* Observation 回传箭头 */}
            <ObserveArrow
              progress={obsProgress}
              label="Observation"
            />
          </div>
        );
      })}

      {/* 多轮分隔线 */}
      {rounds.length > 1 && rounds.map((round, index) => {
        if (index === 0) return null;
        const divFrame = frame - round.startFrame;
        if (divFrame < -10 || divFrame > 10) return null;
        const divOpacity = interpolate(divFrame, [-10, 0, 10], [0, 1, 0]);
        return (
          <div
            key={`div-${index}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: divOpacity,
              fontSize: 28,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-sub)',
              background: 'rgba(0,0,0,0.7)',
              padding: '8px 24px',
              borderRadius: 8,
            }}
          >
            ▼ Next Round
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export default ReActLoop;
