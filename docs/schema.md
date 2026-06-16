## 테이블 1
테이블명: menus
설명: 추천 후보가 되는 음식 메뉴들을 저장한다.

컬럼:
[id]: integer, PK, 자동 증가, not null
[name]: text, not null
[category]: text, not null
[calorie]: integer, not null
[created_at]: datetime, not null, 기본값 현재 시간

관계:
- 없음

## 테이블 2
테이블명: recommendations
설명: 사용자가 버튼을 눌러 추천받은 메뉴 기록을 저장한다.

컬럼:
[id]: integer, PK, 자동 증가, not null
[user_name]: text, not null
[result_method]: text, not null
[menu_id]: integer, not null, FK -> menus(id)
[created_at]: datetime, not null, 기본값 현재 시간

관계:
- 이 테이블의 [menu_id]는 menus의 [id]를 가리킨다.
