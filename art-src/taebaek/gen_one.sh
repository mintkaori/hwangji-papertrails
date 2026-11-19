#!/usr/bin/env bash
# usage: gen_one.sh <name> <green|magenta> [sheet]
# Composes prompts/<name>.txt (+ the sheet layout) + the shared style and asks sprite-gen (GPT via codex) for one image.
set -u
NAME="$1"; KEY="$2"; KIND="${3:-single}"
HERE="F:/Project/papertrails/art-src/taebaek"
SG="C:/Users/mintk/.claude/skills/sprite-gen/.venv/Scripts/sprite-gen.exe"
PF="$HERE/raw/$NAME.prompt.txt"
if [ "$KIND" = "sheet" ]; then
  cat "$HERE/prompts/_sheet.txt" "$HERE/prompts/$NAME.txt" "$HERE/prompts/_style.txt" > "$PF"
else
  cat "$HERE/prompts/$NAME.txt" "$HERE/prompts/_style.txt" > "$PF"
fi
"$SG" gen --provider codex --prompt-file "$PF" --ref "$HERE/ref/style_ref.png" --transparent --chroma-key "$KEY" \
  --out "$HERE/raw/$NAME.png" --report "$HERE/raw/$NAME.report.json" > "$HERE/raw/$NAME.log" 2>&1
echo "exit=$? name=$NAME" >> "$HERE/raw/_done.log"
