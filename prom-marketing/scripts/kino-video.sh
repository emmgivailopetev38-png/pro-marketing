#!/usr/bin/env bash
# Филмът за онлайн киното → Vercel Blob (store „kino-video“).
#
#   scripts/kino-video.sh <вход.mp4|.mov> [име] [папка]      — само кодиране
#   UPLOAD=1 scripts/kino-video.sh <вход> [име] [папка]      — кодиране + качване
#
# Прави три файла:
#   <име>-1080.mp4  H.264 High, CRF 21, таван 3,5 Mbps, AAC 160k
#   <име>-720.mp4   H.264 High, CRF 23, таван 1,6 Mbps, AAC 128k
#   <име>-poster.jpg  кадър от 3-тата секунда (POSTER_AT=секунди за друг)
# PRESET=medium ускорява кодирането (по подразбиране slow).
# И двата MP4 са с +faststart (индексът е в началото → тръгва веднага и се
# превърта с Range заявки, без HLS) и ключов кадър на 2 s (бързо „влизане в
# текущата минута“). Плейърът избира 1080p само на широк екран и нормална мрежа.
#
# Качването: `vercel blob put` в store „kino-video“ (store_zb1ApEiPtQXi1Vj7).
# Иска BLOB_READ_WRITE_TOKEN в средата — от Vercel → Storage → kino-video →
# „.env.local“ (не се пише в git). Пътят е kino/<файл>, без случаен суфикс;
# накрая адресите се слагат във FILM_BLOB в lib/kino/config.ts.
set -euo pipefail

in="${1:?Подай входния файл}"
name="${2:-valnata-film}"
out="${3:-./kino-out}"
poster_at="${POSTER_AT:-3}"
preset="${PRESET:-slow}"   # PRESET=medium — по-бързо (за черновите)
mkdir -p "$out"

common=(-c:v libx264 -preset "$preset" -profile:v high -pix_fmt yuv420p -g 48 -keyint_min 48
  -movflags +faststart -c:a aac -ac 2 -ar 48000)

ffmpeg -hide_banner -y -i "$in" -vf "scale=-2:1080:flags=lanczos" -crf 21 -maxrate 3500k -bufsize 7000k \
  -b:a 160k "${common[@]}" "$out/$name-1080.mp4"
ffmpeg -hide_banner -y -i "$in" -vf "scale=-2:720:flags=lanczos" -crf 23 -maxrate 1600k -bufsize 3200k \
  -b:a 128k "${common[@]}" "$out/$name-720.mp4"
ffmpeg -hide_banner -y -ss "$poster_at" -i "$in" -frames:v 1 -update 1 -vf "scale=-2:720:flags=lanczos" -q:v 3 \
  "$out/$name-poster.jpg"

ls -lh "$out/$name-1080.mp4" "$out/$name-720.mp4" "$out/$name-poster.jpg"

if [[ "${UPLOAD:-0}" == "1" ]]; then
  : "${BLOB_READ_WRITE_TOKEN:?Сложи BLOB_READ_WRITE_TOKEN (Vercel → Storage → kino-video)}"
  for f in "$out/$name-1080.mp4" "$out/$name-720.mp4" "$out/$name-poster.jpg"; do
    npx --yes vercel@latest blob put "$f" --access public --pathname "kino/$(basename "$f")"
  done
  echo "Готово: адресите отгоре → FILM_BLOB в lib/kino/config.ts"
fi
