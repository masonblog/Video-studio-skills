#!/usr/bin/env python3
"""
Extract Narration script
Extracts pure narration text from Markdown section scripts, filtering headers,
VAS tags, and element lists. Handles cross-platform line endings and enforces
proper pause formatting (single empty line between paragraphs, double empty lines between scenes).
"""

import argparse
import sys
from pathlib import Path


def extract_narration(script_path: Path) -> str:
    """Parses the markdown script and extracts narration text."""
    if not script_path.exists():
        raise FileNotFoundError(f"Script file not found: {script_path}")

    with open(script_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    output_paragraphs = []
    current_paragraph = []
    
    for line in lines:
        stripped = line.strip()
        
        # Skip empty lines
        if not stripped:
            continue
            
        # Heading indicates scene transition
        if stripped.startswith("#"):
            # If we had a paragraph in progress, save it
            if current_paragraph:
                output_paragraphs.append(" ".join(current_paragraph))
                current_paragraph = []
            # We insert a scene boundary marker (represented as empty paragraphs)
            # which will be formatted as double blank lines later
            if output_paragraphs and output_paragraphs[-1] != "SCENE_BOUNDARY":
                output_paragraphs.append("SCENE_BOUNDARY")
            continue
            
        # Skip VAS tags (e.g. [画面:...], [图表:...])
        if stripped.startswith("[") and (stripped.endswith("]") or ":" in stripped):
            continue
            
        # Skip indented VAS list elements (e.g. - "Text" | param)
        # Check if line is indented and starts with bullet
        indent = len(line) - len(line.lstrip())
        if indent > 0 and (stripped.startswith("-") or stripped.startswith("*")):
            continue
            
        # If it's none of the above, it's a narration line!
        current_paragraph.append(stripped)

    # Append any remaining text
    if current_paragraph:
        output_paragraphs.append(" ".join(current_paragraph))

    # Format the paragraphs with appropriate spacing
    formatted_content = []
    for i, para in enumerate(output_paragraphs):
        if para == "SCENE_BOUNDARY":
            # Scene boundary translates to double blank lines in edge-tts pause rules
            # We don't want to start with a boundary, and we don't want multiple boundaries
            if formatted_content and formatted_content[-1] != "\n\n":
                formatted_content.append("\n\n")
        else:
            if formatted_content:
                # If the last element was a scene boundary, we don't add extra newlines.
                # Otherwise, we add a single empty line for paragraph breaks.
                if formatted_content[-1] == "\n\n":
                    formatted_content.pop() # remove boundary placeholder
                    formatted_content.append("\n\n\n") # replace with triple newline (two blank lines)
                else:
                    formatted_content.append("\n\n")
            formatted_content.append(para)

    return "".join(formatted_content)


def main():
    parser = argparse.ArgumentParser(
        description="Extract pure narration text from Markdown section scripts for TTS."
    )
    parser.add_argument(
        "script_file",
        type=str,
        help="Path to the final script markdown file (e.g. script-final.md)"
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Output file path (default: print to stdout)"
    )

    args = parser.parse_args()
    script_path = Path(args.script_file)

    try:
        narration_text = extract_narration(script_path)
        
        if args.output:
            output_path = Path(args.output)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(narration_text)
            print(f"Successfully extracted narration to: {output_path}")
        else:
            sys.stdout.write(narration_text)
            sys.stdout.flush()
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
