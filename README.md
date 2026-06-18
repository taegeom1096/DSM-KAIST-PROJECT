# 메뉴 추천 웹사이트

문서에 있는 메뉴 추천 아이디어를 바탕으로 만든 Node.js 풀스택 앱입니다. 별도 패키지 설치 없이 Node.js만 있으면 실행됩니다.

## 실행

```bash
npm start
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 구현된 기능

- `GET /recommendations`: 추천 기록 목록 조회
- `GET /recommendations/:id`: 추천 기록 단건 조회
- `POST /recommendations`: 랜덤 메뉴 추천 생성
- `PATCH /recommendations/:id`: 추천 다시 뽑기
- `DELETE /recommendations/:id`: 추천 기록 삭제
- `GET /menus`: 메뉴 목록 조회
- `POST /menus`: 추천 후보 메뉴 등록
- `GET /menus/:id/reviews`: 메뉴 한 줄 평 조회
- `POST /menus/:id/reviews`: 메뉴 한 줄 평 작성
- `DELETE /reviews/:id`: 한 줄 평 삭제

## 데이터

데이터는 `data/db.json`에 저장됩니다. 기본 메뉴 데이터가 들어 있으며, 앱에서 새 메뉴와 추천 기록, 한 줄 평을 추가할 수 있습니다.