# Stage 1: Research (Director → Researcher)

## 概述
- **输入**：选题关键词与 `pipeline-plan.md`
- **输出**：`research-data.json`

Researcher 使用 `arxiv`、`web-content-extraction`、`youtube-content`、Semantic Scholar 等工具进行深度检索与分析。

---

## 核心要求
1. **先读 Plan**：严格遵循 `pipeline-plan.md` 中的研究策略与搜索关键词。
2. **多源验证**：每个核心事实与观点均需标注出处 URL，严禁主观编造。
3. **数据格式**：输出必须为严格的结构化 JSON。

---

## research-data.json 格式定义
```json
{
  "topic": "选题名称",
  "core_papers": [
    {
      "title": "论文标题",
      "authors": ["作者1", "作者2"],
      "year": 2026,
      "citation_count": 120,
      "url": "https://arxiv.org/abs/..."
    }
  ],
  "key_facts": [
    {
      "fact": "事实陈述内容",
      "confidence": "high/medium",
      "source_url": "https://..."
    }
  ],
  "competing_views": [
    {
      "view_a": "观点A描述",
      "view_b": "对立观点B描述",
      "source": "https://..."
    }
  ],
  "knowledge_gaps": [
    "尚未明确或存在争议的领域1"
  ],
  "timeline": [
    {
      "year": "年份/时间节点",
      "event": "关键事件/技术突破说明"
    }
  ],
  "visualIdeas": [
    "适合做可视化的场景概念或动画设想"
  ]
}
```

---

## 质量红线
- 至少引用 3 篇高质量学术论文（提供 arXiv/Semantic Scholar 链接）。
- 至少包含 5 条附带 URL 出处的可信事实。
- 必须明确包含 1 个以上行业/学术界的对立观点。
- 必须明确指出当下的知识盲区 (knowledge gaps)。
