# DUST Sensor Analyzer — Cloudflare Pages

브라우저에서 DUST_LOG CSV를 선택하여 session별 PM1·PM2.5·PM10 그래프, 평균·최솟값·최댓값, 구간 선택 및 CSV 내보내기를 사용하는 정적 분석기입니다. 목표 주소는 **https://dust.oehnps.co.uk**입니다. 배포 완료나 도메인 연결 완료를 뜻하지 않습니다.

## 준비된 작업과 계정 작업

| GitHub에서 준비한 내용 | Cloudflare 계정에서 남은 작업 |
| --- | --- |
| 기존 index.html 유지, 파일 입력 오류 처리·짧은 구간 선택·차트 지연 로딩 보완 | Pages 프로젝트 생성 및 GitHub 연결 승인 |
| 허용된 파일만 dist로 복사하는 빌드 | 아래 빌드 설정 입력 및 배포 |
| CSP 등 보안 헤더와 404 페이지 | Custom domains에 도메인 등록, DNS 확인 |
| 합성 CSV·코드 검증 및 운영 점검 절차 | 인증서 활성화, HTTPS 및 실제 브라우저 검증 |

Cloudflare 계정·DNS·인증서·기존 프로젝트 상태는 확인하지 않았습니다. main 병합은 기존 연결이 있다면 자동 운영 배포를 유발할 수 있으므로 연결 상태를 확인한 뒤 진행하세요.

## 파일 구성 및 로컬 확인

- `index.html`: 원본 앱. 별도 서버/API 없이 실행합니다.
- `scripts/build.mjs`: 배포 허용 목록을 `dist/`로 복사합니다. 측정 CSV, README, 테스트, 저장소 메타데이터는 배포되지 않습니다.
- `static/_headers`: Cloudflare Pages 정적 응답 보안 헤더.
- `static/404.html`: 잘못된 경로를 실제 404로 처리합니다.
- `tests/sample.csv`: 실제 측정값이 아닌 합성 검증 데이터.
- `tests/check.mjs`: JavaScript 구문, CSV 파싱·session 분리·평균, 오류 처리, 배포 파일 목록 검증.

Node.js 22 이상과 Python 3 사용:

```sh
node scripts/build.mjs
node tests/check.mjs
python3 -m http.server 8000 --directory dist
```

http://localhost:8000 에서 파일을 선택합니다. Python 서버는 `_headers`를 적용하지 않으므로 CSP·응답 헤더 검증은 Pages 미리보기에서 별도로 해야 합니다. npm 설치, API 키, 환경변수는 필요하지 않습니다.

## Cloudflare Pages와 GitHub 연결

1. 변경 브랜치를 검토하고 main에 병합합니다. 기존 Pages 연결이 있다면 먼저 운영 브랜치 설정을 확인합니다.
2. Cloudflare → Workers & Pages → Create application → Pages → Import an existing Git repository로 이동합니다. Workers 배포가 아닌 Pages를 선택합니다.
3. GitHub 연결을 승인하고 `TonyNobleHam/Dust-data-analysis` 저장소를 선택합니다. 접근 범위는 이 저장소로 제한할 수 있습니다.
4. 아래 설정으로 배포합니다.

| 항목 | 값 |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | 비워둠 (저장소 루트) |
| Build command | `node scripts/build.mjs` |
| Build output directory | `dist` |
| 환경변수 / 비밀키 | 필요 없음 |

5. 실제 발급된 `<프로젝트명>.pages.dev` 주소와 배포 commit을 기록합니다. 임의의 프로젝트명을 DNS에 사용하지 마세요.
6. 먼저 pages.dev에서 아래 운영 점검을 진행합니다. 연결 이후 main 변경은 운영 배포, 다른 브랜치는 설정에 따라 미리보기 배포가 됩니다. 이 구성은 Git 통합 방식이며 별도의 Wrangler 설정 파일이나 GitHub Actions 배포 토큰은 필요하지 않습니다.

## dust.oehnps.co.uk 연결 및 HTTPS

1. Pages 프로젝트 → Custom domains → Set up a domain에서 `dust.oehnps.co.uk`를 등록합니다. **DNS CNAME만 먼저 추가하는 것으로는 연결이 완료되지 않습니다.**
2. Cloudflare가 `oehnps.co.uk` DNS를 관리한다면 안내된 DNS 변경을 확인하여 적용합니다. 다른 DNS 제공자를 사용한다면 아래 CNAME을 해당 제공자에 추가합니다.

| 유형 | 이름 | 대상 |
| --- | --- | --- |
| CNAME | `dust` (또는 제공자가 요구하는 전체 호스트명) | 실제 발급된 `<프로젝트명>.pages.dev` |

3. 같은 `dust` 이름의 기존 A/AAAA/CNAME이 있으면 용도와 이전 값을 확인한 후 교체합니다. 루트 도메인·메일 MX·다른 서비스 레코드는 변경하지 않습니다. 이 서브도메인 연결만을 위해 네임서버를 바꿀 필요는 없습니다.
4. Custom domains 상태와 Cloudflare의 인증서 발급/활성화를 확인합니다. 대기·실패 시 DNS 대상, 기존 충돌, CAA 제한을 확인합니다. 인증서 오류를 브라우저에서 우회하지 않습니다.
5. `https://dust.oehnps.co.uk`의 유효한 인증서를 확인하고 HTTP 접속이 HTTPS로 리디렉션되는지 확인합니다. 필요하면 Cloudflare에서 이 호스트에 한정한 HTTPS 리디렉션 규칙을 설정합니다. 전체 zone의 설정을 바꿀 경우 다른 서비스 영향을 먼저 확인합니다.
6. pages.dev를 도메인으로 리디렉션하는 설정은 도메인 검증 후 선택적으로 적용합니다. 미리보기 URL까지 일괄 리디렉션하지 않습니다.

## 측정 CSV와 외부 통신

- 코드의 입력 경로는 파일 선택/드롭 → `FileReader.readAsText` → 메모리 내 파싱입니다. CSV 전송용 fetch, XMLHttpRequest, WebSocket, sendBeacon, 업로드 폼/API는 없습니다.
- 내보내기는 `Blob`과 임시 `blob:` URL을 통한 로컬 다운로드입니다. CSV 내용을 localStorage나 서버에 저장하는 기능도 없습니다.
- **외부 요청 자체가 없는 앱은 아닙니다.** Highcharts 11.4.0을 `code.highcharts.com`에서 불러오며 실패 시 `cdnjs.cloudflare.com`, `cdn.jsdelivr.net`을 순서대로 시도합니다. 글꼴은 `fonts.googleapis.com`, `fonts.gstatic.com`에서 받습니다. 이들 및 호스팅 서버에는 일반 접속 메타데이터가 전달될 수 있습니다.
- `_headers`의 `connect-src 'none'`과 `form-action 'none'`으로 일반 데이터 전송 경로를 제한합니다. 현재 인라인 이벤트/스타일 유지 때문에 `unsafe-inline`을 허용합니다. CDN 스크립트는 페이지 권한으로 실행되므로 CSP만으로 제3자 코드의 모든 유출 가능성을 보장하지는 않습니다. 완전한 외부 의존성 제거는 라이브러리·폰트를 로컬 자산으로 옮기는 별도 작업입니다.
- Cloudflare Web Analytics/Zaraz 등 추가 스크립트는 이 저장소에 구성하지 않았습니다. 계정 설정에 따른 삽입 여부는 배포 후 Network에서 확인해야 합니다.
- 결론: 검토한 앱 코드에는 측정 CSV 외부 전송 기능이 없습니다. 실제 배포 환경의 네트워크 검증은 아래 절차로 남아 있습니다.

## 배포 후 확인 및 브라우저 인수 테스트

1. 개발자 도구 Network에서 Preserve log를 켜고 새로고침합니다. HTTPS 문서, CDN JS, 폰트 요청과 Console 오류를 확인합니다.
2. 초기 로딩이 끝나면 Network 목록을 지우고 `tests/sample.csv`를 파일 선택 창에서 선택합니다. 4건·2 sessions가 나와야 합니다.
3. Session #1을 열어 3개 곡선과 평균 PM1=15.0, PM2.5=20.0, PM10=25.0을 확인합니다. 범위는 각각 5–25, 10–30, 15–35입니다.
4. PM 계열 표시 전환, 구간 선택·초기화, 기준선, 색상·선 두께, CSV 내보내기를 확인합니다. Session #2의 단일 점도 오류 없이 표시되어야 합니다.
5. 빈 CSV 및 잘못된 날짜/숫자 파일에 오류가 표시되고 기존 결과가 유지되는지 확인합니다. 유효 파일로 다시 분석합니다.
6. 파일 선택·session 클릭·필터·내보내기 후 새 POST/PUT, fetch/XHR, WebSocket, beacon 및 측정값/파일명이 포함된 URL·본문이 없는지 모든 요청 유형을 검사합니다. 아직 로딩 중인 CDN/폰트 요청은 CSV 전송과 구분합니다. 실제 측정 CSV는 Git에 올리지 않고 사용자 기기에서 별도로 검증합니다.
7. 모바일 화면에서도 파일 선택과 차트 조작을 확인합니다. 차트 라이브러리 차단 시 안내가 나오며 통계·표가 유지되는지 확인합니다.
8. 아래 응답 확인에서 루트 200, 미존재 경로 404, HTML의 CSP·nosniff·no-referrer를 확인합니다.

```sh
curl -I https://dust.oehnps.co.uk/
curl -I http://dust.oehnps.co.uk/
curl -I https://dust.oehnps.co.uk/not-a-page
```

문제 발생 시 Pages의 이전 성공한 운영 배포로 Rollback하거나 문제 commit을 되돌립니다. DNS를 불필요하게 변경하지 않습니다.

## 검증 기록 (2026-10-17)

- 기준 commit: `e760cf2bdcdbf40921987ee28b78ed9ca64fd1f6`.
- `node scripts/build.mjs`, `node tests/check.mjs` 통과. 합성 CSV 파싱·2개 session·평균 및 배포 허용 목록 검증 완료.
- 브라우저 자동 검증은 실행 환경의 URL 보안 정책으로 차단되어 **미완료**입니다. 실제 파일 선택, SVG 그래프, CSP 적용 및 Network 무전송 여부를 검증했다고 주장하지 않습니다.
- 사용자의 실제 DUST_LOG 파일은 이번 검증에 사용하지 않았습니다. 원본의 고정 열 순서(처음 8열: ID, 날짜, 시간, session, count, PM1, PM2.5, PM10; 총 12열 이상)를 유지합니다. 날짜는 YYYY-MM-DD 또는 YYYY/MM/DD, 시간은 HH:MM:SS입니다. 따옴표 안의 쉼표·다중행을 포함하는 일반 CSV 전체 규격은 지원하지 않습니다.
- 기존 기준선/색상은 유지했습니다. 평균 시간·적용 환경을 고려한 공식 적합 판정 기능은 아닙니다. 이번 작업은 기준값의 최신성 검토를 포함하지 않습니다.

## 별도 확장

센서 자동 수집, 서버 저장, 실시간 갱신, 사용자 인증 및 장기 기록은 **미구현**입니다. 추가하려면 센서 전송 규격, 인증, API/저장소, 보존 기간 및 데이터 보호 정책을 별도로 설계해야 합니다. 정적 Pages 배포만으로 센서 자동 연동이 생기지 않습니다.

## 공식 문서

- [Static HTML 배포](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)
- [빌드 설정](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Git 연결](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [커스텀 도메인·DNS·인증서 문제](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [정적 응답 헤더](https://developers.cloudflare.com/pages/configuration/headers/)
