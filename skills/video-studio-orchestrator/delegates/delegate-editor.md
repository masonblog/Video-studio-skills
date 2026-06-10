# Delegate Editor Prompt Template

## 目标
对脚本草稿进行“去 AI 化”润色并生成修改报告，输出 `script-final.md`。

---

## 委派提示词 (Prompt)

```
Goal: 对 script-draft.md 进行去 AI 化和口语化润色
Context:
  - pipeline-plan.md 路径：{VIDEO_PROJECTS_ROOT}/{project}/pipeline-plan.md
  - 脚本草稿：{VIDEO_PROJECTS_ROOT}/{project}/script-draft.md
  - 输出路径：{VIDEO_PROJECTS_ROOT}/{project}/script-final.md
  - 报告路径：{VIDEO_PROJECTS_ROOT}/{project}/edit-report.md

指令要求：
  1. 彻底清除 AI 写作痕迹（宣传腔、假大空词汇、-ing 状态句式、过度总结等）。
  2. 中文专项排查：严禁滥用成语，清除“在某种程度上”、“值得注意的是”等翻译腔，将长句切短，将正式动作词（如“进行处理”）替换为口语（如“处理下”）。
  3. 进行 Read-Aloud 朗读测试：确保每一句读起来自然顺口，呼吸节奏合理。
  4. 🔴 保护 VAS 标记（不可触碰）：脚本中所有的 `[画面:...]`、`[图表:...]`、`[动画:...]`、`[转场:...]`、`[REACT_ANIM_CUE:...]` 标签及其缩进元素描述和内部参数是下游渲染的直接依据，**严禁进行任何修改、移动或删除**。你的润色只限于旁的文本。
  5. 必须输出修改报告（包含 AI 痕迹修复统计、口语化调整及朗读优化详情）。

Tools: file 
Skills: humanizer
```
