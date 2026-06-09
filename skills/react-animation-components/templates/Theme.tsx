import React from 'react';

/**
 * Theme — 注入全局 CSS 变量和基础样式。
 * 包裹在 Remotion 的 <Composition> 外层使用。
 *
 * 配色体系：
 *   --bg-primary     深蓝黑背景
 *   --bg-secondary   次级背景
 *   --color-agent    Agent 主题色（青蓝）
 *   --color-env      Environment 主题色（橙黄）
 *   --color-thought  Thought 气泡（绿）
 *   --color-action   Action 箭头（红）
 *   --color-obs      Observation 回传（紫）
 *   --color-text     主文字
 *   --color-sub      副文字
 */

const CSS = `
:root {
  --bg-primary:    #1a1a2e;
  --bg-secondary:  #16213e;
  --color-agent:   #58C4DD;
  --color-env:     #F39C12;
  --color-thought: #2ECC71;
  --color-action:  #E74C3C;
  --color-obs:     #9B59B6;
  --color-text:    #ECF0F1;
  --color-sub:     #BDC3C7;
  --font-mono:     'JetBrains Mono', 'Menlo', 'Courier New', monospace;
  --font-sans:     'Inter', 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: var(--bg-primary);
  color: var(--color-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* 安全区 padding（字幕不贴边） */
.safe-bottom {
  padding-bottom: 60px;
}

/* 通用动画工具类 */
.fade-in {
  opacity: 0;
}
`;

export const Theme: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <style>{CSS}</style>
    {children}
  </>
);

export default Theme;
