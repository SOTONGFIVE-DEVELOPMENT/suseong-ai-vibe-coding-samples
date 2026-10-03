# 수성 AI 바이브 코딩 — 누구나 다시 실행하는 실습 정상본

강의의 시작 화면부터 자료·검색·API 저장·조건 변경까지 **6개 독립 실행 프로젝트**를 제공합니다. 모든 기본 실습은 키 없는 교육용 가상 도서관 3건을 사용합니다. 각 단계 ZIP을 새 폴더에 풀어 혼자 다시 실행하거나 오류가 난 단계에서 복구할 수 있습니다.

[강의 사이트](https://suseong-ai-vibe-coding.pages.dev/) · [실습 다운로드 허브](https://suseong-ai-vibe-coding.pages.dev/practice) · [GitHub Releases](https://github.com/SOTONGFIVE-DEVELOPMENT/suseong-ai-vibe-coding-samples/releases/latest)

## 처음 실행하기

1. Node.js **22.x**를 [공식 다운로드](https://nodejs.org/en/download)에서 설치합니다. `node --version`의 첫 숫자가 22인지 확인합니다.
2. Releases 또는 실습 허브에서 필요한 단계 ZIP을 받습니다. 코드만 받으려면 GitHub의 Code → Download ZIP을 사용합니다.
3. ZIP을 압축 해제하고 `package.json`이 보이는 단계 폴더를 Codex에서 엽니다. macOS는 터미널, Windows는 PowerShell에서 같은 폴더로 이동합니다.
4. 아래 명령을 실행하고 [본인 PC 실습 화면](http://127.0.0.1:3000)을 엽니다.

```sh
node --version
npm --version
npm ci
npm run dev
```

전체 저장소를 받은 경우 먼저 `cd examples/step-03-search`처럼 단계 폴더로 이동하세요. **루트에서 npm run dev를 실행하지 않습니다.** 여섯 서버는 동시에 띄울 필요가 없습니다. 하나를 Ctrl+C로 중지한 뒤 다음 단계 폴더에서 실행하세요.

macOS 경로 예: `cd ~/Downloads/step-03-search`

Windows 경로 예: `cd "$HOME/Downloads/step-03-search"`

Windows에서 npm.ps1 실행 정책 오류가 나면 `npm` 대신 `npm.cmd`를 사용하세요. Node.js 설치 뒤에는 터미널을 다시 여세요. 3000 포트가 사용 중이면 서버를 Ctrl+C로 중지하고 `npm run dev -- --port 3001` 뒤 `http://127.0.0.1:3001`을 엽니다.

## 단계 선택

| 단계 | 학습 내용 | 정상 결과 |
|---|---|---|
| [00 시작본](examples/step-00-start/README.md) | 설치·폴더·실행·중지 | 시작 프로젝트 실행 안내 |
| [01 화면](examples/step-01-screen/README.md) | 요구사항에서 제목과 표 만들기 | 제목·5개 열·빈 자료 안내 |
| [02 자료](examples/step-02-records/README.md) | 파일 → 서버 → 화면 | 가상 A/B/C 3건, 파일 변경 반영 |
| [03 검색](examples/step-03-search/README.md) | 이름 조건·0건·초기화 | 3→B 1→없는 이름 0→초기화 3 |
| [04 API](examples/step-04-api/README.md) | 응답 검증·저장·출처·실패 보존 | sample 저장, 재시작 유지, 오류 시 파일 유지 |
| [05 변경](examples/step-05-change/README.md) | 이름·지역·유형 AND·빈 값 | 수성구 2, 중구 1, 수성구+작은=B 1 |

단계와 ZIP·강의 앵커·권장 실습 시간·성공 기준은 [course.json](course.json)의 동일한 목록으로 허브에 연결합니다. 권장 실습 시간은 강의 전체 블록 배분과 다를 수 있으며 진행자는 강의 시간표에 맞춰 조정합니다.

각 폴더의 README → PROMPTS → CHECKLIST 순서로 진행합니다. 기능을 직접 만드는 활동은 **이전 단계의 복사본**에서 시작하고, 해당 단계 정상본과 비교합니다. 각 단계는 완성된 정상본이므로 이미 구현한 내용을 Codex에게 또 만들어 달라고 요구하기보다 현재 구현·입력·처리·출력을 먼저 설명하게 하세요.

## 첫날 활동과 실제 Codex 참고

[첫날 워크북](docs/day1-workbook.md)에서 자기 업무를 요구사항으로 바꾸고 검증 기준을 작성합니다. [첫날 활동 파일](docs/day1/README.md)은 별도 ZIP으로 받을 수 있습니다. 실제 Codex 사용 화면과 재현 과정은 [Codex 따라 하기](docs/codex-walkthrough.md)에 있습니다.

## API와 비밀값

기본 실습은 `DATA_MODE=sample`이며 실제 기관의 정보를 주장하지 않습니다. 도서관 B의 주소와 모든 가상 자료의 기준일은 비어 있으며 **정보 없음**으로 표시합니다. `.env.local`을 만들지 않아도 기본 실습이 됩니다.

실제 API는 선택 활동입니다. 승인받은 본인 키가 준비된 경우에만 [API 명세와 검증 범위](docs/api-spec.md)를 읽고 live 모드를 선택합니다. `.env.local`의 키는 서버에서만 사용하며 저장소·대화·스크린샷에 올리지 않습니다. 예제에는 키가 들어 있지 않습니다.

## 복구와 검증

Node22 설치·28개 테스트·6개 빌드와 HTTP 확인 범위는 [검증 근거](docs/validation.md)에 기록했습니다.

개발 서버를 Ctrl+C로 중지하고 다음을 실행합니다.

```sh
npm test
npm run build
```

02 이상에서 가상 시작 자료를 복구하려면 `npm run reset-data`를 실행하세요. 이전 파일은 data의 백업 파일로 보존됩니다. 설치·코드가 깨지면 단계 ZIP을 새 폴더에 다시 풀고 npm ci부터 재시작합니다. `node_modules`나 `.next`를 ZIP에서 옮기지 않습니다.

전체 manifest 검사는 루트의 `npm run check`, ZIP 생성은 정상본을 검증하고 커밋한 다음 루트의 `npm run package -- <출력폴더>`입니다. ZIP은 Git 추적 파일만 포함하며 단계별 lockfile과 라이선스를 포함합니다. 기본 자료를 임의 수정한 작업 폴더를 정답본으로 배포하지 마세요.

## 재사용

코드·가상 자료·문서는 [MIT License](LICENSE)입니다. 의존성 및 실제 공공데이터에는 각각의 이용 조건이 적용됩니다.
