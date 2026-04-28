# Drivever Project Concept & Strategy (PRD)

## 1. Project Overview (프로젝트 개요)
- **Project Name:** Drivever (드라이브에버)
- **Mission:** 단순 정보의 나열이 아닌, '실제 오너의 경험(Experience)'과 '정확한 법률 해석(Expertise)'을 제공하여 구글의 E-E-A-T 기준을 충족하는 프리미엄 자동차/교통 정보 블로그.
- **Target Audience:** 1. 수입차(특히 Audi Q7 등 대형 가솔린 SUV) 유지보수 및 보증에 관심 있는 고관여 오너.
  2. 헷갈리는 교통법규 및 과태료 규정에 대한 명확한 실전 해석이 필요한 운전자.

## 2. Business Goals (핵심 비즈니스 목표)
이 프로젝트의 최종 목적은 **트래픽 확보 및 애드센스(AdSense) 수익 극대화**에 있습니다. AI(Claude)는 아래 목표를 달성하기 위한 최적의 기술적/구조적 선택을 해야 합니다.

- **AdSense Approval (애드센스 승인):** '가치 없는 콘텐츠' 판정을 피하기 위해, 모든 페이지 구조는 텍스트(본문)가 가장 돋보이도록 구성.
- **High CPC Targeting (고단가 광고 타겟팅):** 프리미엄 수입차, 자동차 보험, 금융, 법률 관련 고단가 광고가 매칭되기 쉽도록 시맨틱(Semantic) 태그를 명확히 구성.
- **SEO Optimization (검색엔진 최적화):** 구글 봇이 콘텐츠를 완벽하게 크롤링할 수 있도록 SSR(Server-Side Rendering) 및 구조화된 데이터(Schema.org) 적극 활용.

## 3. Content Categories & Strategy (콘텐츠 전략)
블로그의 메뉴 구조 및 콘텐츠 방향성은 다음과 같습니다.

### A. Premium Garage (수입차 실전 유지보수)
- **Core Subject:** Audi Q7 55 TFSI 2023년식 오너의 실제 유지/관리 경험담.
- **Key Topics:** CSP/ESP 보증 패키지 활용법, 가솔린 대형 SUV 연비 방어, 센터에서 알려주지 않는 고질병 및 소모품 교체 꿀팁.
- **Tone:** 영수증과 실제 계기판 데이터를 기반으로 한 신뢰감 있는 분석.

### B. Safe Drive Guide (안전운전 및 실전 법규)
- **Core Subject:** 도로 위에서 겪는 아찔한 상황과 과태료 방어 팁.
- **Key Topics:** 우회전 신호 체계 분석, 자전거/PM(퍼스널 모빌리티)와의 도로 공유 법규, 사고를 막는 방어 운전 팁.
- **Tone:** 도로교통법 조항을 정확히 인용(Blockquote)하되, 일반인의 눈높이에서 쉽게 풀어쓰는 강사 톤.

## 4. Technical Requirements for Claude (클로드를 위한 기술 지침)
- **Semantic HTML:** `<header>`, `<main>`, `<article>`, `<aside>`(광고 영역), `<footer>` 구조를 엄격히 지킬 것.
- **Heading Hierarchy:** `<h1>`은 페이지당 무조건 1개만 사용(글 제목). 소제목은 `<h2>`, `<h3>`를 순차적으로 사용하여 목차(TOC) 생성이 용이하게 할 것.
- **Performance (LCP):** 메인 히어로 섹션에 무거운 자바스크립트나 큰 이미지를 지양하고, 빠른 텍스트 렌더링을 최우선으로 할 것.
- **Ad Placement Ready:** 본문 중간중간(예: <h2> 태그 바로 위)에 애드센스 광고를 삽입할 수 있는 `AdSlot` 컴포넌트를 미리 기획하여 배치할 것.