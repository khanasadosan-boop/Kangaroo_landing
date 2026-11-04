#!/usr/bin/env bash
# Выкладка лендинга на https://kenguru.olympia.uz
#   ./deploy-kenguru.sh            — выложить текущую папку public/
#   ./deploy-kenguru.sh rollback   — вернуть предыдущую версию
#
# Каждая выкладка — новая папка landing-ГГГГММДД-ЧЧММ, `current` переключается на неё.
# Хранятся 5 последних landing-*, остальные landing-* удаляются. Чужие папки не трогаем.
set -euo pipefail

HOST="olympia"
BASE="/var/www/production/kenguru-spa"
SITE="https://kenguru.olympia.uz"
cd "$(dirname "$0")"
SSH="ssh -o BatchMode=yes -o LogLevel=ERROR $HOST"

if [ "${1:-}" = "rollback" ]; then
  $SSH "set -e; cd $BASE
    cur=\$(basename \"\$(readlink -f current)\")
    prev=\$(ls -1d landing-[0-9]*-[0-9]* | sort -r | grep -A1 -x \"\$cur\" | tail -n1)
    [ -n \"\$prev\" ] && [ \"\$prev\" != \"\$cur\" ] || { echo 'Нет более старой версии для отката'; exit 1; }
    ln -sfn $BASE/\$prev current
    echo \"Откат: \$cur -> \$prev\""
  curl -sI "$SITE" | head -1
  exit 0
fi

# --- проверка перед выкладкой ---
grep -q '<meta property="og:image" content="https://kenguru.olympia.uz/' public/index.html \
  || { echo "ОШИБКА: og:image должен быть абсолютной ссылкой на $SITE"; exit 1; }
grep -q '<meta property="og:url" content="https://kenguru.olympia.uz/' public/index.html \
  || { echo "ОШИБКА: нет абсолютного og:url"; exit 1; }
[ -f public/index.html ] || { echo "ОШИБКА: нет public/index.html"; exit 1; }

NEW="$BASE/landing-$(date +%Y%m%d-%H%M)"
echo "Выкладываю в $NEW"

$SSH "mkdir -p '$NEW'"
rsync -rlz \
  --exclude '.DS_Store' --exclude '.git' --exclude '.claude' --exclude 'node_modules' \
  --exclude '*.sh' --exclude '*.zip' --exclude 'README*' \
  -e "ssh -o BatchMode=yes -o LogLevel=ERROR" \
  public/ "$HOST:$NEW/"

$SSH "set -e
  chmod -R a+rX '$NEW'
  ln -sfn '$NEW' '$BASE/current'
  cd '$BASE'
  ls -1d landing-[0-9]*-[0-9]* | sort -r | tail -n +6 | xargs -r rm -rf --"

echo "Готово. Текущая версия: $NEW"
curl -sI "$SITE" | head -1
