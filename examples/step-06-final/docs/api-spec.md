# 도서관 API 명세와 검증 범위

확인일: **2026-10-04 (한국 시간)**. 기본 sample 실습은 실제 공공 API에서 수집한 공개 자료 중 3건을 저장해 재생합니다. 학생은 인증키·회원가입·외부 접속 없이 실습할 수 있습니다. 출처는 [공공데이터포털 전국도서관표준데이터 15013109](https://www.data.go.kr/data/15013109/standard.do)입니다.

## 기록된 실제 자료와 교육용 범위

[저장 응답](../api-response.sample.json)은 2026-10-04 **19:17:37 한국 시간**에 인증 호출로 수집한 응답에서 다음 3곳을 선정한 교육용 부분 자료입니다. 도서관명·주소·전화·기관 기준일을 원본 그대로 보존했습니다.

| 도서관 | 지역 | 유형 | 기관 기준일 |
|---|---|---|---|
| 수성구립용학도서관 | 대구 수성구 | 공공도서관 | 2026-03-01 |
| 수성구립사월책문화센터도서관 | 대구 수성구 | 작은도서관 | 2026-03-01 |
| 2.28민주운동 기념회관 | 대구 중구 | 공공도서관 | 2025-12-29 |

전체 원본 API 응답은 **242건**이었습니다. 교육용 응답의 `response.body.totalCount=3`, `numOfRows=3`은 선정한 3건에 맞춘 포장 값이며 전체 원본 응답을 그대로 복사한 값이 아닙니다. `recording.kind=recorded-subset`, `selection`, `upstreamTotalCount=242`, `sourceUrl`, `recordedAt`으로 이 범위를 명시합니다. 원본 응답 SHA-256은 `52ea03a89a47ea04caa9e8996dd4de48b6f5074810d834361135cbd4f825b0c4`입니다. 저장 파일에 적힌 지문은 수집 당시 원본 응답의 지문이며 교육용 부분 응답 파일 자체의 지문과 다릅니다.

실행 프로젝트는 `data/sample-api-response.json`을 읽고 검증한 뒤 `data/records.json`에 정규화한 자료를 저장합니다. 기본 파일과 `records.seed.json`은 같은 선정 자료입니다. 검색어 **사월**은 1건, 수성구는 2건, 중구는 1건, 수성구와 작은도서관의 AND 조건은 1건입니다. 전체 자료 최신성이나 학생 본인의 실전 인증 성공을 이 결과로 판정하지 않습니다.

| 저장 메타데이터 | 뜻 |
|---|---|
| `dataMode=sample` | 기록 자료를 오프라인으로 재생한 현재 실행 |
| `recordedAt=2026-10-04T10:17:37Z` | 강사가 원본 응답을 수집한 고정 시각 |
| `syncedAt=null` 또는 저장 실행 ISO 시각 | 이 PC에서 재생·저장한 시각, 초기 파일은 null |
| `totalCount=3` | 현재 저장한 선정 자료 수 |
| `upstreamTotalCount=242` | 수집 당시 원본 API 전체 응답 수 |
| `originalResponseSha256` | 수집 당시 전체 원본 응답의 지문 |
| 항목의 `referenceDate` | 제공기관이 기록한 데이터 기준일 |

원본 수집 시각, 이 PC 재생·저장 시각, 기관 기준일은 서로 다른 값입니다. 저장 응답 재생은 `syncedAt`만 새로 만들고 `recordedAt`과 원본 공개 필드·수집 근거를 유지합니다. 누락 값 처리는 `displayValue('')`, `displayValue(null)` 단위 테스트로 배웁니다. 화면 실험은 별도로 **임시 빈 값 연습**이라고 표시한 폴더 복사본에서만 하며 실제 주소를 원본 정상본에서 지우지 않습니다.

## 필드와 응답 변환

| 공식 명세 항목 / JSON 직렬화 표현 | 실습 필드 | 처리 |
|---|---|---|
| LBRRY_NM / lbrryNm | name | 필수 문자열 |
| CTPRVN_NM / ctprvnNm | region의 시 | 대구광역시인지 확인 |
| SIGNGU_NM / signguNm | region의 구 | 대구 + 구 이름 |
| LBRRY_SE / lbrrySe | type | 필수 문자열 |
| RDNMADR / rdnmadr | address | 원본 문자열, 비면 정보 없음 |
| PHONE_NUMBER / phoneNumber | phone | 원본 선택 항목 |
| REFERENCE_DATE / referenceDate | referenceDate | 원본 날짜, 비면 null, 실제 달력 날짜 검증 |

인증 API의 직접 `header/body`와 저장 응답의 `response.header/body`를 명시적으로 지원합니다. items 배열과 `items.item` 배열, 위 대문자·camelCase 필드만 읽습니다. 응답 구조가 다르면 아무 배열이나 찾아 저장하지 않고 실패로 처리합니다. `header.resultCode=00`과 전체 건수·필수 필드를 확인합니다.

## 실전 선택 설정

호출 대상은 `https://api.data.go.kr/openapi/tn_pubr_public_lbrry_api`로 고정돼 있습니다. 사용자 입력으로 URL을 바꾸지 않습니다. 공식 명세의 페이지 시작은 0이며 어댑터는 `pageNo=0`, `numOfRows=500`, `type=json`, `CTPRVN_NM=대구광역시`로 시작합니다. 20페이지, 총 10,000건, 페이지 응답 2MB를 상한으로 하며 페이지별 8초, 전체 25초로 시간을 제한합니다.

전체 원본 건수가 정확히 모이고 성공 코드가 일치해야 저장합니다. 같은 페이지 반복, 건수 변경, 같은 ID의 다른 내용은 실패입니다. 원본 전체 건수 검증 후 정규화한 모든 필드가 동일한 중복 항목만 제거합니다. live의 `upstreamTotalCount`는 원본 응답 수, `totalCount`는 중복 제거 후 실제 저장 수이며 두 수는 다를 수 있습니다. 안전 상한이나 검증 오류가 발생하면 그때까지 받은 자료도 저장하지 않고 이전 정상 파일을 보존합니다.

1. 포털에서 본인 계정으로 활용 신청을 하고 이 API의 이용 승인을 확인합니다.
2. 04 또는 05 폴더에서 `.env.example`을 `.env.local`로 복사합니다. macOS에서는 `cp .env.example .env.local`, Windows에서는 `Copy-Item .env.example .env.local`을 실행합니다.
3. 편집기에서 `DATA_MODE=live`로 바꾸고 `DATA_GO_KR_SERVICE_KEY`에 본인 **디코딩 인증키**를 넣습니다. URL 인코딩은 서버가 합니다. 키는 대화·로그·스크린샷·GitHub에 넣지 않습니다. `NEXT_PUBLIC_` 변수로 만들지 않습니다.
4. macOS에서는 `chmod 600 .env.local`을 실행합니다. Windows에서는 파일 속성에서 본인 계정의 접근 권한을 확인합니다.
5. 서버를 다시 시작하고 **공식 API 가져오기**를 누릅니다. 저장에 성공했을 때만 현재 저장 모드가 live로 바뀝니다. 요청 URL·키·응답 원문은 로그나 오류 안내에 출력하지 않습니다.

실전 호출은 사용자가 live를 선택한 때만 합니다. 실전 전체 자료에는 선정 예제의 3→1→0→3 기준을 적용하지 않습니다. sample로 돌아가려면 서버를 중지하고 `DATA_MODE=sample`로 바꾼 뒤 `npm run reset-data`를 실행하고 다시 시작합니다. 이전 파일은 복구 백업에 보존됩니다.

## 확인 범위

기록된 실제 3건과 수집 근거를 여섯 단계에서 검사합니다. 자동 검증은 키 없이 저장 응답 재생, 직접 응답 형식, 모의 live 전체 페이지·정확 중복 제거·ID 충돌·시간 초과·잘못된 응답·파일 보존·local origin 제한을 검사합니다. 이 samples 프로젝트 검증에서는 실제 인증키를 읽거나 live 네트워크 호출을 하지 않습니다. 학생 PC의 키 승인·접속 여부는 live 선택 후 별도로 확인해야 합니다. Windows PC 실행과 참여자의 독립 수행률은 미확인입니다.

Node.js 22와 Next App Router는 [Next.js 설치 안내](https://nextjs.org/docs/app/getting-started/installation), Tailwind CSS 4와 daisyUI 5는 [daisyUI Next.js 설치 안내](https://daisyui.com/docs/install/nextjs/)를 따릅니다. lockfile은 정상본의 의존성 버전을 고정합니다. 코드·문서는 MIT이며 실제 공공데이터에는 제공기관의 이용 조건이 적용됩니다.
