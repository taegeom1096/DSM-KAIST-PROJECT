# 팀 프로젝트 설계 문서

## 1. 팀 정보

- 팀원: 조현우, 김태건
- 서비스 이름: 메뉴 추천
- 한 줄 설명: 이 서비스는 굶주린 사용자가 배고픈 상황에서 메뉴 결정을 할 수 있게 돕는다.

## 2. 브레인스토밍

### 아이디어 1

- 사용자: 선택장애가 심하게 와서 뇌가 정지된 배고픈 사람
- 상황: 점심/저녁 메뉴를 고르느라 30분째 배달 앱만 붙잡고 고통받고 있을 때
- 액션: 결정장애 유저가 메뉴를 강제 추천받는다

### 아이디어 2

- 사용자: 메뉴 고르는 것조차 귀찮고 재미를 원하는 자취생 또는 대학생
- 상황: 매일 먹는 밥이 거기서 거기라 무난한 메뉴를 조금 더 재밌게 뽑고 싶을 때
- 액션: 지친 사용자가 스크래치 복권을 긁어 오늘의 메뉴를 확인한다

### 아이디어 3

- 사용자: 돈은 없고 배는 고픈데 집에 재료가 몇 개 남은 자취러
- 상황: 배달비가 아깝고, 냉장고에 남은 재료로 한 끼 때우고 싶을 때
- 액션: 자취생이 남은 재료 태그를 선택해 만들 수 있는 메뉴를 추천받는다

## 3. 액션 아이템

### 액션 아이템 1

- 사용자 액션: 사용자가 "배고파 뒤지겠다" 버튼을 눌러 메뉴를 추천받는다
- 서버가 해야 할 일: menus 테이블에서 메뉴 1개를 랜덤으로 선택하고, 추천 기록을 저장한다
- 저장할 데이터: 사용자 이름, 추천 방식, 추천된 메뉴 id, 추천 시각
- 후보 테이블: menus, recommendations

### 액션 아이템 2

- 사용자 액션: 사용자가 추천 기록(히스토리)을 조회한다
- 서버가 해야 할 일: recommendations 테이블에서 기록 목록을 조회해 메뉴 정보와 함께 반환한다
- 저장할 데이터: (조회만 하므로 별도 저장 없음)
- 후보 테이블: recommendations, menus

## 4. DB 스키마

### 테이블 1

테이블명: recommendations

설명: 사용자가 추천받은 메뉴 기록을 저장한다.

컬럼:
[id]: 정수(integer), PK, 자동 증가, not null
[user_name]: 문자열(text), not null
[result_method]: 문자열(text), not null
[menu_id]: 정수(integer), not null, FK -> menus(id)
[created_at]: 날짜/시간(datetime), not null, 기본값 현재 시간

관계:

- 이 테이블의 [menu_id]는 menus의 [id]를 가리킨다.

### 테이블 2

테이블명: menus

설명: 추천 후보가 되는 음식 메뉴들을 저장한다.

컬럼:
[id]: 정수(integer), PK, 자동 증가, not null
[name]: 문자열(text), not null
[category]: 문자열(text), not null
[calorie]: 정수(integer), not null
[created_at]: 날짜/시간(datetime), not null, 기본값 현재 시간

관계:

- 없음

## 5. 화면 설계

### 화면 1

화면 이름: 메뉴 추천 메인 화면

화면 목적: 사용자가 버튼 하나로 메뉴를 즉시 추천받는다.

구성 요소:

- 추천 메뉴 결과 목록(최근 추천 기록)
- 사용자 이름 입력창
- "배고파 뒤지겠다" 추천 버튼
- 로딩/빈 상태/오류 메시지 영역

액션:

- 사용자가 최근 추천 기록을 조회한다 -> API: GET /recommendations
- 사용자가 추천 버튼을 눌러 메뉴를 추천받는다 -> API: POST /recommendations

### 화면 2

화면 이름: 추천 결과 상세 화면

화면 목적: 사용자가 추천받은 메뉴를 자세히 확인하고 다시 뽑거나 기록을 지운다.

구성 요소:

- 추천 메뉴 제목 영역
- 메뉴 상세 내용 영역
- 메뉴 다시 추천(수정) 버튼
- 추천 기록 삭제 버튼

액션:

- 사용자가 추천 결과 상세를 조회한다 -> API: GET /recommendations/:id
- 사용자가 메뉴를 다시 추천받는다 -> API: PATCH /recommendations/:id
- 사용자가 추천 기록을 삭제한다 -> API: DELETE /recommendations/:id

## 6. API 명세

### API 1

- 기능 이름: 추천 기록 목록 조회
- 다루는 객체: recommendation
- Method: GET
- Path: /recommendations
- 요청 데이터: 없음
- 응답 데이터: recommendation 배열(메뉴 정보 포함)

### API 2

- 기능 이름: 추천 기록 단건 조회
- 다루는 객체: recommendation
- Method: GET
- Path: /recommendations/:id
- 요청 데이터: 없음
- 응답 데이터: recommendation 1개(메뉴 정보 포함)

### API 3

- 기능 이름: 메뉴 추천(생성)
- 다루는 객체: recommendation
- Method: POST
- Path: /recommendations
- 요청 데이터: user_name, result_method
- 응답 데이터: 생성된 recommendation(랜덤 추천된 메뉴 포함)

### API 4

- 기능 이름: 추천 다시 뽑기(수정)
- 다루는 객체: recommendation
- Method: PATCH
- Path: /recommendations/:id
- 요청 데이터: result_method
- 응답 데이터: 수정된 recommendation(새로 추천된 메뉴 포함)

### API 5

- 기능 이름: 추천 기록 삭제
- 다루는 객체: recommendation
- Method: DELETE
- Path: /recommendations/:id
- 요청 데이터: 없음
- 응답 데이터: 성공 메시지

### API 6

- 기능 이름: 메뉴 목록 조회
- 다루는 객체: menu
- Method: GET
- Path: /menus
- 요청 데이터: 없음
- 응답 데이터: menu 배열

## 7. 7주차 구현 우선순위

1. menus 테이블에 기본 메뉴 데이터를 넣고, POST /recommendations로 랜덤 메뉴 1개를 뽑아 반환하는 핵심 추천 기능 구현
2. 메인 화면에서 버튼 클릭 시 추천 결과를 보여주고, GET /recommendations로 최근 추천 기록을 목록으로 표시
3. 추천 결과 상세 화면에서 다시 뽑기(PATCH)와 기록 삭제(DELETE), 그리고 빈 상태·로딩·오류 메시지 등 UX 폴리싱 마무리
