#!/usr/bin/env python3
"""
vtt-to-subtitles.py — Convert edge-tts VTT to Remotion subtitles.ts
Usage: python3 vtt-to-subtitles.py narration.vtt [fps] > src/subtitles.ts
Output: SubtitleItem interface + subtitles array + TOTAL_FRAMES constant
"""
import re, sys

def parse_vtt(path, fps=30):
    with open(path) as f:
        vtt = f.read()
    cues, blocks = [], vtt.strip().split('\n\n')
    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) < 2: continue
        ts = lines[1] if lines[0].strip().isdigit() else lines[0]
        m = re.match(r'(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})', ts)
        if not m: continue
        s = int(m.group(1))*3600+int(m.group(2))*60+int(m.group(3))+int(m.group(4))/1000
        e = int(m.group(5))*3600+int(m.group(6))*60+int(m.group(7))+int(m.group(8))/1000
        cues.append((s, e, lines[-1].strip() if len(lines)>=3 else ""))
    if not cues: print("// ERROR: No cues", file=sys.stderr); sys.exit(1)
    tf = int(cues[-1][1]*fps)+30
    print("export interface SubtitleItem {")
    print("  index: number; startFrame: number; endFrame: number;")
    print("  startSec: number; endSec: number; text: string;")
    print("}\n")
    print("export const subtitles: SubtitleItem[] = [")
    for i,(s,e,t) in enumerate(cues):
        sf,ef=int(s*fps),int(e*fps)
        print(f'  {{ index:{i+1}, startFrame:{sf}, endFrame:{ef}, startSec:{s:.3f}, endSec:{e:.3f}, text:"{t}" }},')
    print("];\n")
    print(f"export const TOTAL_FRAMES = {tf};")
    print(f"// {len(cues)} cues, {tf} frames, {tf/fps:.1f}s", file=sys.stderr)

if __name__=="__main__":
    if len(sys.argv)<2: print(f"Usage: {sys.argv[0]} <narration.vtt> [fps]",file=sys.stderr); sys.exit(1)
    parse_vtt(sys.argv[1], int(sys.argv[2]) if len(sys.argv)>2 else 30)
