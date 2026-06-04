# AI 챗봇

Google Gemini와 Groq 모델을 선택해 대화할 수 있는 Express 기반 AI 챗봇 예제입니다. 프론트엔드는 ChatGPT/Gemini 스타일의 채팅 UI로 구성되어 있으며, 채팅 기록은 브라우저 `localStorage`에 저장됩니다.

## 주요 기능

- Google / Groq Provider 선택
- Provider에 따른 모델 자동 선택
  - Google: `gemma-4-26b-a4b-it`
  - Groq: `openai/gpt-oss-120b`
- 질문 전송 중 로딩 메시지 표시
- AI 답변 마크다운 렌더링
  - 제목, 목록, 표, 코드블록, 인용문, 구분선, 링크, `<br>` 지원
- 새 채팅 생성
- 채팅 목록 확인 및 이전 채팅으로 이동
- 채팅 기록 `localStorage` 저장
- favicon, manifest, SEO/Open Graph/Twitter 메타 태그 포함

## 기술 스택

- Node.js
- Express
- `@google/genai`
- `groq-sdk`
- Vanilla HTML/CSS/JavaScript
- Browser `localStorage`

## 설치

```bash
npm install
```

## 환경변수

프로젝트 루트에 `.env` 파일을 만들고 아래 값을 설정합니다.

```env
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
PORT=3737
```

## 실행

개발 실행:

```bash
npm run 04
```

배포/일반 실행:

```bash
npm start
```

실행 후 브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:3737
```

## 파일 구조

```text
.
├── 01_express.js
├── 02_sdk.js
├── 03_chat.js
├── 04_deploy.js
├── package.json
├── public
│   ├── favicon.svg
│   ├── index.html
│   └── site.webmanifest
└── postman
```

## API

### `POST /chat`

요청 본문:

```json
{
  "provider": "google",
  "model": "gemma-4-26b-a4b-it",
  "ask": "질문 내용"
}
```

응답 예시:

```json
{
  "provider": "google",
  "model": "gemma-4-26b-a4b-it",
  "ask": "질문 내용",
  "answer": "AI 답변"
}
```

## 참고

- 채팅 기록은 서버가 아니라 사용자의 브라우저 `localStorage`에 저장됩니다.
- 다른 브라우저나 시크릿 모드에서는 기존 채팅 기록이 보이지 않습니다.
- API 키는 절대 Git에 커밋하지 마세요.
