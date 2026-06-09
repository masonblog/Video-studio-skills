# Multi-Agent Skill Change Workflow

When modifying a multi-agent Hermes skill (like `video-studio-orchestrator`) where agent behavior is defined in both SKILL.md (delegate_task prompts) and per-profile SOUL.md files, follow this workflow to avoid silent failures.

## The Two-Location Problem

In a multi-agent Hermes skill:

- **SKILL.md delegate prompts** → only apply when Director uses `delegate_task` to spawn subagents
- **Per-profile SOUL.md** → applies when the agent runs in Kanban/group-chat/@mention mode with its own profile persona

A behavioral change that only updates SKILL.md will silently do nothing in group chat mode. A change that only updates SOUL.md will have no effect in delegate_task mode. BOTH must be updated.

## Full Change Workflow

### Phase 1: Plan

1. Write a plan documenting all files to change, using the `plan` skill methodology
2. Identify all 7 profile SOUL.md paths and the canonical SKILL.md path
3. Note which changes are delegate-template only vs SOUL-only vs both

### Phase 2: Canonical SKILL.md

1. Modify the canonical skill: `~/.hermes/skills/creative/video-studio-orchestrator/SKILL.md`
2. Update: architecture diagram, pipeline stages, delegate prompt templates, quality gates, startup checklist, pitfalls, reference file table

### Phase 3: Per-Agent SOUL.md

1. Modify each profile's SOUL.md: `~/.hermes/profiles/video-<role>/SOUL.md`
2. Roles: video-director, video-researcher, video-writer, video-editor, video-narrator, video-renderer, video-packager
3. When adding dependency on an optional upstream artifact (like pipeline-plan.md), use the graceful degradation pattern:

```
## <Artifact>引用（优雅降级）

收到任务后，先检查项目目录下是否存在 `<artifact>`：
- **存在** → 读取它，遵循其中的约束
- **不存在** → 按通用模式工作 + 标注「⚠️ 未检测到 <artifact>」
```

### Phase 4: Reference Files

1. Update `references/agent-personas.md` to align with SOUL.md changes
2. Create new templates in `references/` if needed
3. Update the Reference Files table in SKILL.md

### Phase 5: Sync Profile Copies

Each profile has a LOCAL copy of SKILL.md. They are NOT symlinks:

```bash
SRC=~/.hermes/skills/creative/video-studio-orchestrator/SKILL.md
PLANTPL=~/.hermes/skills/creative/video-studio-orchestrator/references/pipeline-plan-template.md
for dir in video-director video-editor video-narrator video-packager video-renderer video-researcher video-writer; do
  cp "$SRC" ~/.hermes/profiles/$dir/skills/creative/video-studio-orchestrator/SKILL.md
  mkdir -p ~/.hermes/profiles/$dir/skills/creative/video-studio-orchestrator/references/
  cp "$PLANTPL" ~/.hermes/profiles/$dir/skills/creative/video-studio-orchestrator/references/pipeline-plan-template.md
done
```

Also sync any new/modified reference files to the same profile-local directories.

### Phase 6: Verify

```bash
# Check all SOUL.md files contain the new directives
for dir in video-director video-researcher video-writer video-editor video-narrator video-renderer video-packager; do
  result=$(grep -c "pipeline-plan" {HERMES_HOME}/profiles/$dir/SOUL.md 2>/dev/null || echo "0")
  printf "%-18s refs: %s\n" "$dir:" "$result"
done

# Verify all profile SKILL.md copies match canonical
SRC=~/.hermes/skills/creative/video-studio-orchestrator/SKILL.md
for dir in video-director video-researcher video-writer video-editor video-narrator video-renderer video-packager; do
  diff -q "$SRC" ~/.hermes/profiles/$dir/skills/creative/video-studio-orchestrator/SKILL.md \
    && echo "$dir: MATCH" || echo "$dir: DIFF"
done
```

## Graceful Degradation Pattern

When an agent depends on an optional upstream artifact that may not exist in ad-hoc/standalone usage:

**Bad (breaks standalone usage):**
```
## 工作流程
1. 读取 pipeline-plan.md ← fails if agent called directly
2. 开始工作
```

**Good (degrades gracefully):**
```
## 规划引用（优雅降级）
收到任务后，先检查项目目录下是否存在 `pipeline-plan.md`：
- **存在** → 读取它，严格遵循其中的约束
- **不存在** → 按通用模式工作，在输出末尾注明「⚠️ 未检测到 pipeline-plan.md」
```

This pattern applies to ANY optional pipeline artifact — not just plan files. The key is:
1. Check existence first (don't unconditionally read)
2. Have a clear fallback behavior
3. Annotate the output so the user/upstream agent knows the artifact was absent
