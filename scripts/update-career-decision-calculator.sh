#!/bin/bash
set -u

LOG=/var/log/career-decision-calculator-update.log
FAIL_LOG=/var/log/career-decision-calculator-fail.log
DATE=$(date "+%Y-%m-%d %H:%M:%S KST")
COMPOSE_DIR="${COMPOSE_DIR:-$HOME/projects/career-decision-calculator}"
LOCK_FILE=/tmp/career-decision-calculator-update.lock
WEB_IMAGE="legyeseul/career-decision-calculator:latest"
WEB_CONTAINER="career-decision-calculator"

log() {
  echo "[$DATE] $*" >> "$LOG"
}

fail_log() {
  echo "[$DATE] FAIL: $*" >> "$FAIL_LOG"
}

if [ -f "$LOCK_FILE" ]; then
  old_pid="$(cat "$LOCK_FILE" 2>/dev/null || true)"
  if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
    exit 0
  fi
fi

echo "$$" > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

CURRENT_WEB=$(docker inspect --format='{{.Image}}' "$WEB_CONTAINER" 2>/dev/null)

docker pull "$WEB_IMAGE" >> /dev/null 2>&1
if [ $? -ne 0 ]; then
  fail_log "Docker pull 실패: $WEB_IMAGE"
  exit 1
fi

NEW_WEB=$(docker inspect --format='{{.Id}}' "$WEB_IMAGE" 2>/dev/null)

if [ -z "$NEW_WEB" ]; then
  fail_log "새 이미지 ID 확인 실패"
  exit 1
fi

if [ "$CURRENT_WEB" == "$NEW_WEB" ]; then
  exit 0
fi

log "새 이미지 감지, 업데이트 중... web:${CURRENT_WEB:-none}->${NEW_WEB:-none}"

cd "$COMPOSE_DIR" || {
  fail_log "cd 실패: $COMPOSE_DIR"
  exit 1
}

docker compose up -d --remove-orphans >> /dev/null 2>&1
if [ $? -ne 0 ]; then
  fail_log "컨테이너 실행 실패"
  exit 1
fi

docker image prune -f >> /dev/null 2>&1
if [ $? -ne 0 ]; then
  fail_log "구형 이미지 정리 실패"
  exit 1
fi

log "업데이트 완료"
