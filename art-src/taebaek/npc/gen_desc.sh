#!/usr/bin/env bash
# usage: gen_desc.sh name...  (description-only redraws: style reference only, no character reference)
HERE="F:/Project/papertrails/art-src/taebaek/npc"
SG="C:/Users/mintk/.claude/skills/sprite-gen/.venv/Scripts/sprite-gen.exe"
STYLE="F:/Project/papertrails/art-src/taebaek/ref/style_ref.png"
for NAME in "$@"; do
  ROW=$(grep "^$NAME|" "$HERE/prompts/notes.txt"); KEY=$(echo "$ROW" | cut -d'|' -f3); NOTE=$(echo "$ROW" | cut -d'|' -f4)
  PF="$HERE/raw/$NAME.prompt.txt"
  { cat "$HERE/prompts/_npc_desc.txt"; echo "$NOTE"; } > "$PF"
  "$SG" gen --provider codex --prompt-file "$PF" --ref "$STYLE" --transparent --chroma-key "$KEY" \
    --out "$HERE/raw/$NAME.png" --report "$HERE/raw/$NAME.report.json" > "$HERE/raw/$NAME.log" 2>&1
  echo "exit=$? name=$NAME" >> "$HERE/raw/_done.log"
done
