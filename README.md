# 수성 AI 바이브 코딩 — 누구나 다시 실행하는 실습 정상본

강의에서 다루는 시작 화면부터 자료, 검색, API 저장, 조건 변경까지 **6개 독립 실행 프로젝트**를 제공합니다. 기본 실습은 모두 키가 필요 없는 실제 공공 API 응답에서 선정해 보관한 도서관 3건의 저장 예제을 사용합니다. 각 단계 ZIP을 새 폴더에 풀어 혼자 다시 실행하거나 오류가 난 단계에서 복구할 수 있습니다.

[강의 사이트](https://suseong-ai-vibe-coding.pages.dev/) · [실습 다운로드 허브](https://suseong-ai-vibe-coding.pages.dev/practice) · [GitHub Releases](https://github.com/SOTONGFIVE-DEVELOPMENT/suseong-ai-vibe-coding-samples/releases/latest)

## 처음 실행하기

1. Node.js **22.x**를 [공식 다운로드 페이지](https://nodejs.org/en/download)에서 받아 설치합니다. `node --version` 결과의 첫 숫자가 22인지 확인합니다.
2. Releases 또는 실습 허브에서 필요한 단계 ZIP을 받습니다. 코드만 받으려면 GitHub의 Code → Download ZIP을 사용합니다.
3. ZIP 압축을 풀고 `package.json`이 보이는 단계 폴더를 Codex에서 엽니다. macOS는 터미널에서, Windows는 PowerShell에서 같은 폴더로 이동합니다.
4. 아래 명령을 실행하고 [본인 PC 실습 화면](http://127.0.0.1:3000)을 엽니다.

```sh
node --version
npm --version
npm ci
npm run dev
```

전체 저장소를 받은 경우 먼저 `cd examples/step-03-search`처럼 단계 폴더로 이동하세요. **루트에서 npm run dev를 실행하지 마세요.** 여섯 서버를 동시에 띄울 필요는 없습니다. 하나를 Ctrl+C로 중지한 뒤 다음 단계 폴더에서 실행하세요.

macOS 경로 예: `cd ~/Downloads/step-03-search`

Windows 경로 예: `cd "$HOME/Downloads/step-03-search"`

Windows에서 npm.ps1 실행 정책 오류가 나면 `npm` 대신 `npm.cmd`를 사용하세요. Node.js 설치 뒤에는 터미널을 다시 여세요. 3000번 포트가 사용 중이면 서버를 Ctrl+C로 중지하고 `npm run dev -- --port 3001`을 실행한 뒤 `http://127.0.0.1:3001`을 엽니다.

## 단계 선택

| 단계 | 학습 내용 | 정상 결과 |
|---|---|---|
| [00 시작본](examples/step-00-start/README.md) | 설치·폴더·실행·중지 | 시작 프로젝트 실행 안내 |
| [01 화면](examples/step-01-screen/README.md) | 요구사항에서 제목과 표 만들기 | 제목·5개 열·빈 자료 안내 |
| [02 자료](examples/step-02-records/README.md) | 파일 → 서버 → 화면 | 실제 저장 예제 3건, 파일 변경 반영 |
| [03 검색](examples/step-03-search/README.md) | 이름 조건·0건·초기화 | 3→사월 1→없는 이름 0→초기화 3 |
| [04 API](examples/step-04-api/README.md) | 응답 검증·저장·출처·실패 보존 | 저장 응답 재생, 재시작 유지, 오류 시 파일 유지 |
| [05 변경](examples/step-05-change/README.md) | 이름·지역·유형 AND·빈 값 | 수성구 2, 중구 1, 수성구+작은=사월 1 |

단계, ZIP, 강의 앵커, 권장 실습 시간, 성공 기준은 [course.json](course.json)에 있는 같은 목록으로 허브에 연결합니다. 권장 실습 시간은 강의 전체 블록 배분과 다를 수 있으며 진행자는 강의 시간표에 맞춰 조정합니다.

각 폴더의 README → PROMPTS → CHECKLIST 순서로 진행합니다. 기능을 직접 만드는 활동은 **이전 단계의 복사본**에서 시작하고 해당 단계의 정상본과 비교합니다. 각 단계는 완성된 정상본이므로 이미 구현한 내용을 Codex에게 다시 만들어 달라고 하기보다 현재 구현과 입력, 처리, 출력을 먼저 설명하게 하세요.

## 첫날 활동과 실제 Codex 참고

[첫날 워크북](docs/day1-workbook.md)에서 자기 업무를 요구사항으로 바꾸고 검증 기준을 작성합니다. [첫날 활동 파일](docs/day1/README.md)은 별도 ZIP으로 받을 수 있습니다. 실제 Codex 사용 화면과 재현 과정은 [Codex 따라 하기](docs/codex-walkthrough.md)에 있습니다. 그 스크린샷과 실행 기록은 실제 자료로 교체하기 전 가상 A/B/C를 사용한 역사 기록입니다. 현재 ZIP의 검색어는 사월이며 최신 성공 기준은 각 단계 README를 따르세요.

## API와 비밀값

기본 실습은 `DATA_MODE=sample`이며 **기록된 실제 공개 응답 3건을 오프라인으로 재생**합니다. 원본 수집 시각은 2026-10-04 19:17:37 한국 시간입니다. 수성구립용학도서관·수성구립사월책문화센터도서관·2.28민주운동 기념회관의 이름·주소·전화·기관 기준일을 그대로 보관했습니다. 원본 API 응답의 전체 242건에서 선정한 일부이므로 최신·전체 기관 목록을 뜻하지 않습니다. `.env.local` 없이 실습할 수 있으며 학생의 sample 재생 성공은 본인 키의 실전 호출 성공을 뜻하지 않습니다.

이름 검색은 **사월**로 1건을 확인합니다. 빈 값 표시는 `displayValue` 단위 테스트로 배우며 화면 실험은 **임시 빈 값 연습**이라고 표시한 별도 복사본에서만 합니다. 실제 원본 주소를 지우지 마세요.

실제 API 연결은 선택 활동입니다. 승인받은 본인 키가 준비된 경우에만 [API 명세와 검증 범위](docs/api-spec.md)를 읽고 live 모드를 선택합니다. `.env.local`의 키는 서버에서만 사용합니다. 키를 저장소, 대화, 스크린샷에 올리지 마세요. 예제에는 키가 들어 있지 않습니다.

## 복구와 검증

Node.js 22의 현재 테스트·6개 빌드와 과거 HTTP 확인 범위는 [검증 근거](docs/validation.md)에 기록했습니다.

개발 서버를 Ctrl+C로 중지하고 다음을 실행합니다.

```sh
npm test
npm run build
```

02 이상의 단계에서 기록된 실제 시작 자료를 복구하려면 `npm run reset-data`를 실행하세요. 이전 파일은 data의 백업 파일로 보존됩니다. 설치나 코드가 깨지면 단계 ZIP을 새 폴더에 다시 풀고 npm ci부터 재시작합니다. `node_modules`나 `.next`를 ZIP에서 옮기지 마세요.

전체 manifest 검사는 루트에서 `npm run check`로 합니다. ZIP을 만들 때는 정상본을 검증하고 커밋한 다음 루트에서 `npm run package -- <출력폴더>`를 실행합니다. ZIP에는 Git이 추적하는 파일만 들어가며 단계별 lockfile과 라이선스도 포함됩니다. 기본 자료를 임의로 수정한 작업 폴더를 정답본으로 배포하지 마세요.

## 재사용

코드와 문서는 [MIT License](LICENSE)를 따릅니다. 의존성과 실제 공공데이터에는 각각의 이용 조건이 적용됩니다.
