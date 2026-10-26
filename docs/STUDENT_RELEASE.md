# NIN 재현 기록과 버전 기록 (22단계)

학생 작성 문서입니다. 실행 방법은 [STUDENT_RUNBOOK.md](STUDENT_RUNBOOK.md)를 따릅니다. 비밀값(키·토큰·인증서·설정 파일 내용)은 적지 않습니다.

## 1. 버전과 상태

| 항목 | 값 |
|---|---|
| 앱 | 「NIN」 보안 Agent (시작 틀 `alekov-client-starter` 0.2.11) |
| 학생 버전 | **NIN 0.9 (검증 중)** — v1.0 아님 |
| 저장소 | https://github.com/superblueskt-netizen/nin-security-agent |
| 브랜치 | `main` |
| 재현 대상 커밋 | 3장에 기록 |
| 지원 환경 | Windows + PowerShell + Node.js 24.19.0(실행 도구 허용 22~24). 자세한 범위는 STUDENT_RUNBOOK.md 9장 |

v1.0이 아닌 이유(누락·미해결):
- 19단계 보안 조치의 실제 집행 연결이 준비되지 않았습니다(제공 안내 기준). 실집행·효과 관측은 하지 않았습니다.
- SDP(접근 제어·XDR) 실제 연결, CLCO 계정 연결·AI 앱 승인·사건 설명, OSV 실제 외부 조회는 운영자 설정·권한이 필요해 기다림(UNV)입니다.
- 22단계 통과는 원문 검토 기준의 수료이며 실제 운영 인증이나 v1.0 자동 인증이 아닙니다.

## 2. 증거 종류 구분

| 표시 | 뜻 |
|---|---|
| 학생 PC 실행 | 학생이 지원 환경에서 직접 실행하고 화면·출력을 본 결과(학생 진술). 서버가 실행해 확인한 것이 아님 |
| 예제(demo) | `-Demo`/`npm run demo`의 예제 자료로 본 화면. 실제 연결 성공이 아님 |
| 모의 데이터 | 가짜 입력으로 학생 함수만 점검. 실제 화면·연결이 아님 |
| 원문 확인 | 코드를 읽고 대조. 실행하지 않음 |
| 미확인·UNV | 확인하지 않았거나 운영자 준비를 기다림 |

AI의 원문 검토(ALEPH 판정)는 실행 성공 증명이 아닙니다.

## 3. 새 환경 재현 절차

원래 작업 폴더(앱 폴더)는 그대로 두고, 새 빈 폴더에 GitHub에서 같은 커밋을 받아 실행합니다. 원래 폴더의 설정·인증 파일은 복사하지 않습니다(기본 실행은 그런 파일이 필요 없음).

PowerShell을 바탕 화면 등 원래 앱 폴더 밖에서 열고 실행합니다. `<커밋>`은 재현할 40자리 커밋입니다.

```powershell
git clone https://github.com/superblueskt-netizen/nin-security-agent nin-repro
cd nin-repro
git checkout <커밋>
git rev-parse HEAD
git status --short
node -v
npm run check
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -Port 5191
```

1. 브라우저에서 `http://127.0.0.1:5191/`을 열어 「보호 현황」과 학생 칸을 봅니다. 「설치 패키지 조회」를 누릅니다.
2. 실행 창에서 `Ctrl+C`로 종료하고, 주소가 열리지 않는지 봅니다.
3. 같은 명령으로 다시 실행해 다시 열리는지 봅니다(재실행).
4. `Ctrl+C`로 종료한 뒤 ` -Demo`를 붙여 예제 자료로 실행하고, 각 탭의 학생 칸을 봅니다. 예제 결과는 실제 연결 결과와 따로 적습니다.

`-Port 5191`은 원래 폴더의 앱이 5189·5190을 쓰고 있을 수 있어 붙였습니다.

## 4. 재현 기록

(재현 전 — 학생이 3장을 실행한 뒤 채웁니다.)

## 5. 데이터 보존 계획

| 데이터 | 어디에 | 보존·백업 | 복원 | 제한 |
|---|---|---|---|---|
| 학생 코드·문서(`student/extension.mjs`, `docs/STUDENT_*.md`, README 학생 부분) | Git 저장소 | 단계마다 커밋하고 GitHub `origin`에 push. 원래 작업 폴더는 지우지 않음 | 새 폴더에 `git clone` 뒤 `git checkout <커밋>`(3장) | 커밋·push하지 않은 변경은 복원할 수 없음 |
| 앱 실행 상태(화면 결과) | 서버·브라우저 메모리 | 저장하지 않음. 기본 실행은 서버가 파일을 쓰지 않고, 화면 코드는 브라우저 저장소(localStorage 등)를 쓰지 않음(원문 확인) | 다시 실행하고 다시 조회 | 이전 조회 결과는 남지 않음 |
| `.env` 등 로컬 설정 | 내 PC(Git 제외) | 비밀은 커밋하지 않음. 비밀 없는 견본은 `.env.example` | 견본을 보고 다시 설정 | 서버는 `.env`를 자동으로 읽지 않음(환경변수만) |
| 조치 기록 DB(SQLite) | 운영자가 지정한 기존 파일(`databasePath`) | 운영자 관리. 기본 실행에서는 쓰지 않음 | 운영자 절차 | 앱이 자동 생성·이전하지 않음(`src/actions/action-startup-config.mjs`) |
| AI 앱 자격 | native host가 Windows 쪽 보관(`tools/app-credentials.ps1`), 프로젝트·Git 밖 | 학생이 복사·백업하지 않음 | 새 환경에서 계정 연결·앱 승인을 다시 함 | 운영자 권한 필요(UNV) |
| SDP 설정·인증서 | 운영자가 준 파일, 프로젝트·Git 밖 | 학생이 복사하지 않음 | 운영자에게 다시 안내받음 | 기본 실행에서는 쓰지 않음 |
