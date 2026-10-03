# 도서관 API 명세와 검증 범위

확인일: **2026-10-04 (한국 시간)**. 기본 실습은 교육용 가상 응답이며 인증키 없는 상태에서 가능합니다. 실전 endpoint와 항목·페이지 규칙은 [공공데이터포털 전국도서관표준데이터 15013109](https://www.data.go.kr/data/15013109/standard.do)의 공식 명세를 확인했습니다.

## 기본 자료와 변환

[가상 응답](../api-response.sample.json)은 실제 API로 내려받은 데이터가 아닙니다. 공식 응답의 항목을 설명하기 위해 만든 교육용 응답입니다. 실행 프로젝트의 응답 원본은 `data/sample-api-response.json`, 검증 후 저장은 `data/records.json`입니다.

```json
{
  "meta": {
    "dataMode": "sample",
    "source": "교육용 API 응답 파일 · 실제 공공데이터 호출이 아님",
    "syncedAt": "저장 실행 시각 (ISO 8601)",
    "scope": "가상 도서관 3건 (대구 수성구·대구 중구)",
    "totalCount": 3
  },
  "items": [
    {"id":"생성한 고유값","name":"도서관 B","region":"대구 수성구","type":"작은도서관","address":"","phone":"가상 전화 B","referenceDate":null}
  ]
}
```

위 코드블록은 구조 설명이므로 items를 한 항목으로 줄였습니다. 실제 파일의 totalCount는 실제 items 길이와 같아야 합니다. `syncedAt`은 이 PC에서 저장한 시각이며 기관의 `referenceDate`와 다릅니다. 가상 항목은 실제 데이터 기준일을 주장하지 않습니다.

| 공식 명세 항목 / JSON 직렬화 표현 | 실습 필드 | 처리 |
|---|---|---|
| LBRRY_NM / lbrryNm | name | 필수 문자열 |
| CTPRVN_NM / ctprvnNm | region의 시 | 대구광역시인지 확인 |
| SIGNGU_NM / signguNm | region의 구 | 대구 + 구 이름 |
| LBRRY_SE / lbrrySe | type | 필수 문자열 |
| RDNMADR / rdnmadr | address | 비면 정보 없음 |
| PHONE_NUMBER / phoneNumber | phone | 저장 선택 항목 |
| REFERENCE_DATE / referenceDate | referenceDate | 비면 null, 날짜 형식 확인 |

명세의 대문자 이름과 camelCase JSON 표현만 명시적으로 읽습니다. 구조가 달라지면 임의의 배열을 찾아 저장하지 않고 실패합니다.

## 실전 선택 설정

대상은 `https://api.data.go.kr/openapi/tn_pubr_public_lbrry_api`로 고정돼 있습니다. 사용자 입력으로 URL을 바꾸지 않습니다. 공식 명세는 pageNo 샘플을 0으로, 한 페이지 최대값을 1000으로 안내합니다. 어댑터는 `pageNo=0`, `numOfRows=500`, `type=json`, `CTPRVN_NM=대구광역시`로 시작합니다. 20페이지·총 10,000건·페이지 응답 2MB를 상한으로 하며 페이지별 8초·전체 25초 제한을 둡니다. 전체 건수·페이지 건수·중복·성공코드가 맞아야 저장합니다. 안전 상한에 걸리면 자료를 일부 저장하지 않습니다.

1. 포털에서 본인 계정으로 활용 신청하고 해당 API 이용 승인을 확인합니다.
2. 04 또는 05 폴더에서 `.env.example`을 `.env.local`로 복사합니다. macOS: `cp .env.example .env.local`; Windows: `Copy-Item .env.example .env.local`.
3. 편집기에서 `DATA_MODE=live`로 바꾸고 `DATA_GO_KR_SERVICE_KEY`에 본인 **디코딩 인증키**를 넣습니다. URL 인코딩은 서버가 수행합니다. 값을 화면 공유·대화·GitHub에 넣지 않습니다.
4. macOS는 `chmod 600 .env.local`을 실행합니다. Windows는 파일 속성에서 본인 계정의 접근 권한을 확인합니다.
5. 서버를 재시작하고 **공식 API 가져오기**를 누릅니다. 저장에 성공했을 때만 출처가 실제 API 응답으로 바뀝니다. 요청 URL·키·서버 응답 원문은 로그나 오류 안내에 출력하지 않습니다.

키 미승인·네트워크 차단·응답 형식 불일치·건수 제한은 실패로 표시하며 이전 정상 파일을 보존합니다. 실전 자료는 가상 3건과 건수가 달라서 수업의 3→1→0→3 검증에 사용하지 않습니다. sample로 복귀하려면 서버를 중지하고 `DATA_MODE=sample`로 바꾼 뒤 `npm run reset-data` 후 다시 실행합니다.

## 확인한 것과 미확인 범위

공식 endpoint·요청/응답 항목·첫 페이지·최대 페이지 크기는 위 공식 명세를 읽었습니다. 자동 검증은 가상 응답과 모의 fetch로 정규화·페이지 수집·시간 초과·잘못된 응답·중복·파일 보존·local origin 제한을 검사합니다. **본인 키가 필요한 실전 인증 호출 및 실제 응답 직렬화는 미확인**입니다. 로그인·승인 완료·실전 호출 성공을 가상 버튼의 성공으로 판단하지 않습니다.

Node22·Next App Router 설치는 [Next.js 설치 안내](https://nextjs.org/docs/app/getting-started/installation), Tailwind4·daisyUI5 구성은 [daisyUI Next.js 설치 안내](https://daisyui.com/docs/install/nextjs/)를 확인했습니다. lockfile은 이 정상본의 의존성 버전을 고정합니다.
