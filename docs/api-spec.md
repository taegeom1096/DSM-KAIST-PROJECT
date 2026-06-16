## API 1

- 기능 이름: 추천 기록 목록 조회
- 다루는 객체: recommendation
- Method: GET
- Path: /recommendations
- 요청 데이터: 없음
- 응답 데이터: recommendation 배열(메뉴 정보 포함)

## API 2

- 기능 이름: 추천 기록 단건 조회
- 다루는 객체: recommendation
- Method: GET
- Path: /recommendations/:id
- 요청 데이터: 없음
- 응답 데이터: recommendation 1개(메뉴 정보 포함)

## API 3

- 기능 이름: 메뉴 추천(생성)
- 다루는 객체: recommendation
- Method: POST
- Path: /recommendations
- 요청 데이터: user_name, result_method
- 응답 데이터: 생성된 recommendation(랜덤 추천된 메뉴 포함)

## API 4

- 기능 이름: 추천 다시 뽑기(수정)
- 다루는 객체: recommendation
- Method: PATCH
- Path: /recommendations/:id
- 요청 데이터: result_method
- 응답 데이터: 수정된 recommendation(새로 추천된 메뉴 포함)

## API 5

- 기능 이름: 추천 기록 삭제
- 다루는 객체: recommendation
- Method: DELETE
- Path: /recommendations/:id
- 요청 데이터: 없음
- 응답 데이터: 성공 메시지

## API 6

- 기능 이름: 메뉴 목록 조회
- 다루는 객체: menu
- Method: GET
- Path: /menus
- 요청 데이터: 없음
- 응답 데이터: menu 배열
