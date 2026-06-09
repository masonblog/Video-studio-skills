#!/bin/bash
# extract-narration.sh — Extract narration text from Markdown section scripts
# Input:  script-final.md (Markdown section format: ## Scene — summary + narration + [tags])
# Output: narration-raw.txt (narration text with blank lines between paragraphs)
# Usage:  bash extract-narration.sh script-final.md > narration-raw.txt

awk '
  BEGIN { skip=0; last_was_text=0 }
  # Scene headers — output blank line to mark scene boundary (narrator adds \n\n\n)
  /^## / {
    if (last_was_text) print ""
    last_was_text=0
    next
  }
  # Visual tag lines — skip them and their descriptions (until next blank line or ##)
  /^\[(画面|图表|动画|REACT_ANIM_CUE)/ { skip=1; next }
  # Blank line — end of a visual tag block or paragraph separator
  /^[[:space:]]*$/ {
    if (skip) { skip=0; next }
    if (last_was_text) print ""
    last_was_text=0
    next
  }
  # Code fence or other markup to skip
  /^```/ { next }
  # Narration text — print it
  {
    if (!skip) {
      print $0
      last_was_text=1
    }
  }
  # After printing a visual-tagged line, skip subsequent description lines
  skip && /^[[:space:]]*$/ { skip=0 }
' "$1" | sed '/^[[:space:]]*$/N;/^\n[[:space:]]*$/D'
