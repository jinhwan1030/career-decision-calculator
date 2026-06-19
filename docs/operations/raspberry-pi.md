# Raspberry Pi Deployment

이 프로젝트는 Raspberry Pi 4B arm64에서 정적 Nginx 컨테이너로 실행한다.

## 배포 모델

- GitHub Actions가 Docker 이미지를 빌드한다.
- 대상 플랫폼은 `linux/amd64`, `linux/arm64`다.
- Raspberry Pi는 `docker compose`로 최신 이미지를 실행한다.
- 앱은 서버 API 없이 브라우저에서 계산하고 localStorage에 저장한다.

## 이미지

```text
legyeseul/career-decision-calculator:latest
```

## GitHub Secrets

GitHub Actions가 Docker Hub에 이미지를 push하려면 이 저장소에 secret을 추가해야 한다.

```text
DOCKER_PASSWORD
```

값은 Docker Hub 계정 `legyeseul`의 access token 또는 password다.

저장소 설정 경로:

```text
GitHub Repository > Settings > Secrets and variables > Actions > New repository secret
```

## 런타임

```bash
docker compose up -d
```

기본 compose 포트:

```text
8092:80
```

운영 도메인에서는 기존 reverse proxy에서 이 컨테이너로 프록시한다.

예시:

```nginx
location / {
    proxy_pass http://127.0.0.1:8092;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 업데이트

```bash
scripts/update-career-decision-calculator.sh
```

서버에서 cron 또는 systemd timer로 실행할 수 있다.

## 주의

- `.env`가 필요 없는 정적 앱이다.
- 결제, 로그인, 서버 DB, AI API를 사용하지 않는다.
- GitHub Pages 배포는 사용하지 않는다.
- `DOCKER_PASSWORD` secret이 없으면 Docker Hub 로그인 단계에서 workflow가 실패한다.
