# 실습 정상본 검증 근거

검증일: **2026-10-04 (한국 시간)**. 실행 환경: macOS, Node.js **22.23.3**, Next.js **16.3.8**, React **19.3.0**, Tailwind CSS **4.3.3**, daisyUI **5.7.47**. 기본 DATA_MODE=sample이며 실제 인증키를 사용하지 않았습니다.

## 독립 설치·테스트·빌드

각 단계 폴더에서 `npm ci`와 `npm run check`를 실행했습니다. check는 `npm test`와 `npm run build`를 순서대로 실행합니다.

| 단계 | 테스트 통과 | Next 빌드 | 확인 범위 |
|---|---:|---|---|
| 00 시작 | 1/1 | 성공 | 단계·가상 자료 계약, 시작 화면 컴파일 |
| 01 화면 | 1/1 | 성공 | 단계·가상 자료 계약, 빈 표 화면 컴파일 |
| 02 자료 | 4/4 | 성공 | JSON 조회·검색 함수·누락 값·저장 재조회·잘못된 갱신 보존 |
| 03 검색 | 4/4 | 성공 | 이름 3→1→0→3, 지역·유형 AND 함수, 저장 보존 |
| 04 API | 9/9 | 성공 | sample 가져오기·모의 live 페이지 수집·인증/형식/시간초과 거부·중복·local origin |
| 05 변경 | 9/9 | 성공 | API 검증과 파일 보존, 지역·유형 조건·누락 값 |

합계 28개 테스트를 통과했습니다. 코드 수정 후 해당 단계의 check를 재실행했습니다. 04/05는 내부 request.url을 localhost로 만드는 Next 동작과 실제 Host=127.0.0.1을 함께 검사하는 회귀 조건을 포함합니다. 비 local Host·외부 Origin을 허용하지 않습니다.

## 실제 Next 서버의 HTTP 동작

정상본의 별도 임시 복사본을 `127.0.0.1:3034`에서 Next 프로덕션 서버로 실행하고 Node의 HTTP 요청으로 확인했습니다. 원본 정상본의 자료 파일은 변경하지 않았습니다.

- 같은 local Origin의 `/api/import` 성공 요청: HTTP 200, 가상 3건 저장, `meta.dataMode=sample`.
- 시간 초과·형식 오류·인증 오류의 교육용 재현: 각각 HTTP 502, 이전 저장 파일의 전체 내용 동일.
- 외부 Origin 요청: HTTP 403, 이전 파일 유지.
- `/api/libraries?q=도서관 B`: count=1.

이 확인은 HTTP와 파일 동작의 근거입니다. 실제 Codex 사용 화면과 브라우저의 클릭·입력 근거는 [Codex 따라 하기](codex-walkthrough.md)에 기록합니다.

## 패키지 구성 확인

루트 `npm run check`로 6단계 manifest·lockfile·독립 실행 파일·MIT 라이선스·기본 가상 3건·B의 빈 주소·127.0.0.1 실행 주소를 확인했습니다. 04/05의 API 명세·가상 응답 사본은 루트 정본과 바이트 단위로 일치합니다. 각 단계 README·PROMPTS·CHECKLIST의 로컬 링크는 모두 해당 단계 폴더 안에서 열립니다.

각 단계 `.gitignore`가 node_modules·.next·.env.local·임시 파일·복구 백업을 제외하며 `.env.example`은 포함하는 것을 확인했습니다.

2026-10-04 ZIP 8개를 실제 생성해 각 ZIP의 CRC 무결성·경로·의존성/비밀 파일 제외를 검사했습니다. 모든 단계 ZIP에 잠금 파일과 `.gitignore`가 포함됩니다. STEP-04 ZIP을 새로운 임시 폴더에 풀어 Node22에서 `npm ci`, `npm run check`를 실행했고 9개 테스트와 Next 빌드가 통과했습니다. 공개 다운로드의 파일 크기·SHA-256·원본 Git 커밋은 실습 사이트의 `/downloads/course.json`과 `SHA256SUMS.txt`에 기록합니다.

부모의 실제 브라우저 검증은 [Codex 따라 하기](codex-walkthrough.md)의 출처·스크린샷 11장에 기록했습니다. 최신 조회 응답만 화면을 바꾸는 보강은 별도 검토에서 느린 초기 응답·오래된 오류·effect cleanup 이후 응답 순서를 제어해 재확인했습니다.

## 미확인 범위

Windows PC의 실제 설치·실행, 본인 인증키로 공공데이터포털의 실전 API 호출, 실제 수강생의 독립 수행률·수업 시간 준수는 미확인입니다. 공식 API 명세의 endpoint·항목·페이지 규칙은 [API 명세](api-spec.md)의 출처를 확인했습니다. 가상 응답 성공을 실전 API 인증 성공으로 판정하지 않습니다.
