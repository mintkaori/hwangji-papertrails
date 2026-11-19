#!/usr/bin/env bash
# usage: gen_npc.sh name1 name2 ...  (rows of prompts/notes.txt: name|srcdir|chroma|note)
HERE="F:/Project/papertrails/art-src/taebaek/npc"
SG="C:/Users/mintk/.claude/skills/sprite-gen/.venv/Scripts/sprite-gen.exe"
STYLE="F:/Project/papertrails/art-src/taebaek/ref/style_ref.png"
for NAME in "$@"; do
  ROW=$(grep "^$NAME|" "$HERE/prompts/notes.txt")
  SRC=$(echo "$ROW" | cut -d'|' -f2); KEY=$(echo "$ROW" | cut -d'|' -f3); NOTE=$(echo "$ROW" | cut -d'|' -f4)
  PF="$HERE/raw/$NAME.prompt.txt"
  { cat "$HERE/prompts/_npc.txt"; echo "$NOTE"; } > "$PF"
  "$SG" gen --provider codex --prompt-file "$PF" --ref "C:/Users/mintk/blender-test/chars/$SRC/$NAME.png" --ref "$STYLE" \
    --transparent --chroma-key "$KEY" --out "$HERE/raw/$NAME.png" --report "$HERE/raw/$NAME.report.json" > "$HERE/raw/$NAME.log" 2>&1
  echo "exit=$? name=$NAME" >> "$HERE/raw/_done.log"
done
