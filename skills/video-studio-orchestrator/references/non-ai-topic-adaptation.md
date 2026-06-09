# Non-AI Topic Adaptation

When the pipeline handles non-AI topics (finance, medicine, law, history, etc.), translate animation markers to domain-specific cues. The Writer uses domain cues; the Renderer builds matching visual components.

## Financial / Trading Topics

Discovered in the "vertical-spread" end-to-end test (2026-06-04).

| AI/ReAct marker | → | Financial marker | Visual component |
|----------|---|-----------|------|
| `[REACT_ANIM_CUE]` | → | `[PAYOFF_CHART]` | Profit/loss curve, strike overlay |
| `[REACT_ANIM_CUE:thought]` | → | `[STRATEGY_DIAGRAM]` | Leg construction (buy+sell arrows) |
| `[REACT_ANIM_CUE:action]` | → | `[BREAKEVEN_CALC]` | Formula derivation + price line |
| `[REACT_ANIM_CUE:obs]` | → | `[RISK_REWARD_SCALE]` | Risk/reward balance animation |
| `[REACT_ANIM_CUE:tot]` | → | `[COMPARISON_TABLE]` | Strategy comparison grid |
| `[REACT_ANIM_CUE:multi]` | → | `[OPTION_CHAIN]` | Real option chain data display |
| (new) | → | `[REAL_EXAMPLE]` | Live SPY/QQQ data with current prices |

Financial color palette: `--bg-primary: #0a1628` (navy), `--color-bull: #00c853` (green), `--color-bear: #ff1744` (red), `--color-gold: #d4a843` (accent).

## Template for Adding New Domains

1. Identify the 3-6 most common visual patterns in the domain
2. Map them to the standard marker vocabulary
3. Define a domain-specific color palette
4. Create reusable React components in `react-animation-components` or project-local

## Writer Instructions for Non-AI Topics

When the Director delegates a non-AI topic:
1. Load `references/non-ai-topic-adaptation.md` for marker mapping
2. Use domain-specific markers in the "visual description" column
3. Include a marker-to-component mapping appendix at script end
4. Provide color palette for the Renderer
