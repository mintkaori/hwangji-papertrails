#!/usr/bin/env bash
# usage: gen_pose.sh name...  three-pose sheets (A-pose / step / wave) drawn from the paper redraw npc/raw/<ref>.png
HERE="F:/Project/papertrails/art-src/taebaek/npc"
SG="C:/Users/mintk/.claude/skills/sprite-gen/.venv/Scripts/sprite-gen.exe"
STYLE="F:/Project/papertrails/art-src/taebaek/ref/style_ref.png"
for NAME in "$@"; do
  REF="$NAME"; [ "$NAME" = bear ] && REF=bear2; [ "$NAME" = otter ] && REF=otter2
  ROW=$(grep "^$REF|" "$HERE/prompts/notes.txt"); KEY=$(echo "$ROW" | cut -d'|' -f3); NOTE=$(echo "$ROW" | cut -d'|' -f4)
  PF="$HERE/pose/$NAME.prompt.txt"
  { cat "$HERE/prompts/_pose.txt"; echo "$NOTE"; } > "$PF"
  "$SG" gen --provider codex --prompt-file "$PF" --ref "$HERE/raw/$REF.png" --ref "$STYLE" --transparent --chroma-key "$KEY" \
    --out "$HERE/pose/$NAME.png" --report "$HERE/pose/$NAME.report.json" > "$HERE/pose/$NAME.log" 2>&1
  echo "exit=$? name=$NAME" >> "$HERE/pose/_done.log"
done
