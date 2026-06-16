## 화면 1

화면 이름: 메뉴 추천 메인 화면
화면 목적: 사용자가 버튼 하나로 메뉴를 즉시 추천받는다.

구성 요소:

- 추천 메뉴 결과 목록
- 사용자 이름 입력창
- "배고파 뒤지겠다" 추천 버튼
- 로딩/빈 상태/오류 메시지 영역

액션:

- 사용자가 최근 추천 기록을 조회한다 -> API: GET /recommendations
- 사용자가 추천 버튼을 눌러 메뉴를 추천받는다 -> API: POST /recommendations
- 사용자가 메뉴를 다시 추천받는다 -> API: PATCH /recommendations/:id
- 사용자가 추천 기록을 삭제한다 -> API: DELETE /recommendations/:id

## 화면 2

화면 이름: 추천 결과 상세 화면
화면 목적: 사용자가 추천받은 메뉴를 자세히 확인하고 다시 뽑거나 기록을 지운다.

구성 요소:

- 추천 메뉴 제목 영역
- 메뉴 상세 내용 영역
- 메뉴 다시 추천 수정 버튼
- 추천 기록 삭제 버튼

액션:

- 사용자가 추천 결과 상세를 조회한다 -> API: GET /recommendations/:id
- 사용자가 메뉴를 다시 추천받는다 -> API: PATCH /recommendations/:id
- 사용자가 추천 기록을 삭제한다 -> API: DELETE /recommendations/:id
