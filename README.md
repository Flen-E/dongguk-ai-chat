# 사주팔자 풀이

기존 챗봇 API를 연결할 수 있는 커스텀 상담 UI입니다. 추천 질문, 대화 기록, 새 대화, 최소화 및 모바일 화면을 제공합니다.

## 로컬 실행

Node.js 22 이상에서 `.env.example`을 `.env`로 복사하고 `FACTCHAT_API_KEY`를 설정한 뒤 `npm start`를 실행하세요. `http://localhost:3000`에서 대화할 수 있습니다. API 키는 서버에서만 읽습니다.

## 배포

GitHub Pages는 정적 파일만 제공하므로 현재 디자인 미리보기와 원래 챗봇 링크를 제공합니다. Node.js 서버에 전체 프로젝트를 배포하면 같은 UI에서 `/api/chat`을 사용해 실제로 대화합니다.

별도 서버와 GitHub Pages를 함께 사용할 경우 `public/config.js`의 `apiUrl`을 실제 서버의 `/api/chat` 주소로 변경하세요. 서버 환경변수 `ALLOWED_ORIGIN`에는 `https://flen-e.github.io`를 지정하세요. 브라우저 코드에는 API 키를 넣지 마세요.

서버 실행 명령은 `npm start`, 상태 확인 경로는 `/api/health`입니다. API 연결이 없는 화면에서는 답변을 생성하거나 대화가 연결된 것처럼 표시하지 않습니다.
