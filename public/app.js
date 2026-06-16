const state = {
  recommendations: [],
  menus: [],
  selectedRecommendationId: null,
  selectedRecommendation: null,
  reviews: [],
  activeTab: "history",
  loading: false
};

const els = {
  recommendForm: document.querySelector("#recommend-form"),
  userName: document.querySelector("#user-name"),
  resultCard: document.querySelector("#result-card"),
  status: document.querySelector("#status-message"),
  historyList: document.querySelector("#history-list"),
  refreshHistory: document.querySelector("#refresh-history"),
  menuForm: document.querySelector("#menu-form"),
  menuList: document.querySelector("#menu-list"),
  detailView: document.querySelector("#detail-view"),
  tabButtons: [...document.querySelectorAll(".tab-button")],
  tabPanels: [...document.querySelectorAll(".tab-panel")]
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "요청을 처리하지 못했습니다.");
  }

  return data;
}

function setStatus(message = "", type = "normal") {
  els.status.textContent = message;
  els.status.classList.toggle("is-error", type === "error");
}

function setLoading(isLoading) {
  state.loading = isLoading;
  document
    .querySelectorAll("button")
    .forEach((button) => {
      button.disabled = isLoading && !button.classList.contains("tab-button");
    });
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function spicyLabel(level) {
  const count = Number(level || 0);
  if (count <= 0) {
    return "맵기 없음";
  }
  return `맵기 ${count}/5`;
}

function switchTab(tab) {
  state.activeTab = tab;
  els.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tab);
  });
  els.tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `${tab}-tab`);
  });
}

function renderResult(recommendation) {
  if (!recommendation?.menu) {
    els.resultCard.className = "result-card is-empty";
    els.resultCard.innerHTML = `
      <p class="result-label">추천 결과</p>
      <h2>아직 메뉴를 뽑지 않았어요</h2>
      <p>이름을 입력하고 버튼을 누르면 서버가 메뉴 하나를 골라줍니다.</p>
    `;
    return;
  }

  const { menu } = recommendation;
  els.resultCard.className = "result-card";
  els.resultCard.innerHTML = `
    <p class="result-label">${escapeHtml(recommendation.user_name)}님의 오늘 메뉴</p>
    <h2>${escapeHtml(menu.name)}</h2>
    <p>${escapeHtml(menu.category)} 메뉴에서 랜덤으로 골랐습니다.</p>
    <div class="result-meta">
      <span class="pill">${escapeHtml(menu.category)}</span>
      <span class="pill">${menu.calorie} kcal</span>
      <span class="pill hot">${spicyLabel(menu.spicy_level)}</span>
      <span class="pill green">평점 ${menu.rating_average || 0}</span>
    </div>
  `;
}

function recommendationCard(recommendation) {
  const menu = recommendation.menu || {};
  return `
    <article class="history-card">
      <div>
        <h3>${escapeHtml(menu.name || "삭제된 메뉴")}</h3>
        <p>${escapeHtml(recommendation.user_name)} · ${formatDate(recommendation.created_at)}</p>
        <div class="card-meta">
          <span class="pill">${escapeHtml(menu.category || "분류 없음")}</span>
          <span class="pill">${menu.calorie || 0} kcal</span>
          <span class="pill hot">${spicyLabel(menu.spicy_level)}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="ghost-button" type="button" data-action="detail" data-id="${recommendation.id}">상세</button>
        <button class="secondary-button" type="button" data-action="reroll" data-id="${recommendation.id}">다시</button>
        <button class="danger-button" type="button" data-action="delete" data-id="${recommendation.id}">삭제</button>
      </div>
    </article>
  `;
}

function menuCard(menu) {
  return `
    <article class="menu-card">
      <div>
        <h3>${escapeHtml(menu.name)}</h3>
        <p>${escapeHtml(menu.author_name || "익명")} 등록 · ${formatDate(menu.created_at)}</p>
        <div class="card-meta">
          <span class="pill">${escapeHtml(menu.category)}</span>
          <span class="pill">${menu.calorie} kcal</span>
          <span class="pill hot">${spicyLabel(menu.spicy_level)}</span>
          <span class="pill green">한 줄 평 ${menu.review_count}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="ghost-button" type="button" data-action="menu-reviews" data-menu-id="${menu.id}">평 보기</button>
      </div>
    </article>
  `;
}

function renderHistory() {
  if (state.recommendations.length === 0) {
    els.historyList.innerHTML = `<div class="empty-state">아직 추천 기록이 없습니다. 왼쪽 버튼으로 첫 메뉴를 뽑아보세요.</div>`;
    return;
  }

  els.historyList.innerHTML = state.recommendations.map(recommendationCard).join("");
}

function renderMenus() {
  if (state.menus.length === 0) {
    els.menuList.innerHTML = `<div class="empty-state">등록된 메뉴가 없습니다.</div>`;
    return;
  }

  els.menuList.innerHTML = state.menus.map(menuCard).join("");
}

function reviewCard(review) {
  return `
    <article class="review-card">
      <div>
        <h3>${escapeHtml(review.reviewer_name)} · ${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</h3>
        <p>${escapeHtml(review.comment)}</p>
      </div>
      <button class="danger-button" type="button" data-action="delete-review" data-id="${review.id}">삭제</button>
    </article>
  `;
}

function renderDetail() {
  const recommendation = state.selectedRecommendation;

  if (!recommendation?.menu) {
    els.detailView.className = "detail-view empty-detail";
    els.detailView.innerHTML = `
      <h2>추천 기록을 선택해주세요</h2>
      <p>추천 기록 카드의 상세 버튼을 누르면 메뉴 정보와 한 줄 평을 볼 수 있습니다.</p>
    `;
    return;
  }

  const { menu } = recommendation;
  els.detailView.className = "detail-view";
  els.detailView.innerHTML = `
    <div class="detail-title-row">
      <div>
        <p class="eyebrow">${escapeHtml(recommendation.user_name)}님의 추천 결과</p>
        <h2>${escapeHtml(menu.name)}</h2>
        <p>${formatDate(recommendation.created_at)}에 ${escapeHtml(recommendation.result_method)} 방식으로 추천되었습니다.</p>
        <div class="detail-meta">
          <span class="pill">${escapeHtml(menu.category)}</span>
          <span class="pill">${menu.calorie} kcal</span>
          <span class="pill hot">${spicyLabel(menu.spicy_level)}</span>
          <span class="pill green">평균 ${menu.rating_average || 0}</span>
        </div>
      </div>
      <div class="detail-actions">
        <button class="secondary-button" type="button" data-action="reroll" data-id="${recommendation.id}">다시 추천</button>
        <button class="danger-button" type="button" data-action="delete" data-id="${recommendation.id}">기록 삭제</button>
      </div>
    </div>

    <form id="review-form" class="review-form">
      <label>
        작성자
        <input name="reviewer_name" type="text" placeholder="익명" />
      </label>
      <label>
        한 줄 평
        <input name="comment" type="text" placeholder="예: 오늘 컨디션에 딱 맞음" required />
      </label>
      <label>
        별점
        <input name="rating" type="number" min="1" max="5" step="1" value="5" />
      </label>
      <button class="secondary-button" type="submit">평 등록</button>
    </form>

    <div class="reviews-list">
      ${
        state.reviews.length
          ? state.reviews.map(reviewCard).join("")
          : `<div class="empty-state">아직 한 줄 평이 없습니다.</div>`
      }
    </div>
  `;

  document.querySelector("#review-form").addEventListener("submit", handleReviewSubmit);
}

async function loadRecommendations() {
  state.recommendations = await api("/recommendations");
  renderHistory();
}

async function loadMenus() {
  state.menus = await api("/menus");
  renderMenus();
}

async function loadDetail(id) {
  state.selectedRecommendationId = id;
  state.selectedRecommendation = await api(`/recommendations/${id}`);
  const menuId = state.selectedRecommendation.menu?.id;
  state.reviews = menuId ? await api(`/menus/${menuId}/reviews`) : [];
  renderDetail();
  switchTab("detail");
}

async function refreshAll() {
  await Promise.all([loadRecommendations(), loadMenus()]);
}

async function handleRecommend(event) {
  event.preventDefault();
  setLoading(true);
  setStatus("서버에서 메뉴를 고르는 중입니다.");

  try {
    const recommendation = await api("/recommendations", {
      method: "POST",
      body: JSON.stringify({
        user_name: els.userName.value,
        result_method: "hungry-button"
      })
    });

    renderResult(recommendation);
    await refreshAll();
    setStatus("추천 완료. 이제 고민은 서버가 가져갔습니다.");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
}

async function handleMenuSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  setLoading(true);
  setStatus("메뉴를 등록하는 중입니다.");

  try {
    const formData = new FormData(form);
    await api("/menus", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    form.reset();
    await loadMenus();
    setStatus("새 메뉴가 추천 후보에 들어갔습니다.");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
}

async function rerollRecommendation(id) {
  setLoading(true);
  setStatus("다시 뽑는 중입니다.");

  try {
    const recommendation = await api(`/recommendations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ result_method: "reroll" })
    });

    renderResult(recommendation);
    await refreshAll();

    if (state.selectedRecommendationId === id || state.activeTab === "detail") {
      await loadDetail(id);
    }

    setStatus("새 메뉴로 바꿨습니다.");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
}

async function deleteRecommendation(id) {
  setLoading(true);
  setStatus("추천 기록을 삭제하는 중입니다.");

  try {
    await api(`/recommendations/${id}`, { method: "DELETE" });
    await loadRecommendations();

    if (state.selectedRecommendationId === id) {
      state.selectedRecommendationId = null;
      state.selectedRecommendation = null;
      state.reviews = [];
      renderDetail();
      switchTab("history");
    }

    setStatus("추천 기록을 삭제했습니다.");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
}

async function handleReviewSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;

  if (!state.selectedRecommendation?.menu) {
    return;
  }

  setLoading(true);
  setStatus("한 줄 평을 저장하는 중입니다.");

  try {
    const formData = new FormData(form);
    await api(`/menus/${state.selectedRecommendation.menu.id}/reviews`, {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    form.reset();
    await loadDetail(state.selectedRecommendationId);
    await loadMenus();
    setStatus("한 줄 평을 저장했습니다.");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
}

async function deleteReview(id) {
  setLoading(true);
  setStatus("한 줄 평을 삭제하는 중입니다.");

  try {
    await api(`/reviews/${id}`, { method: "DELETE" });
    await loadDetail(state.selectedRecommendationId);
    await loadMenus();
    setStatus("한 줄 평을 삭제했습니다.");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
}

function handleWorkspaceClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const id = Number(button.dataset.id);
  const menuId = Number(button.dataset.menuId);

  if (action === "detail") {
    loadDetail(id).catch((error) => setStatus(error.message, "error"));
  }

  if (action === "reroll") {
    rerollRecommendation(id);
  }

  if (action === "delete") {
    deleteRecommendation(id);
  }

  if (action === "menu-reviews") {
    const recommendation = state.recommendations.find((item) => item.menu?.id === menuId);

    if (recommendation) {
      loadDetail(recommendation.id).catch((error) => setStatus(error.message, "error"));
    } else {
      setStatus("이 메뉴를 추천받은 기록이 있어야 상세 평을 볼 수 있습니다.", "error");
    }
  }

  if (action === "delete-review") {
    deleteReview(id);
  }
}

function bindEvents() {
  els.recommendForm.addEventListener("submit", handleRecommend);
  els.refreshHistory.addEventListener("click", () => {
    loadRecommendations()
      .then(() => setStatus("추천 기록을 새로 불러왔습니다."))
      .catch((error) => setStatus(error.message, "error"));
  });
  els.menuForm.addEventListener("submit", handleMenuSubmit);
  document.querySelector(".workspace").addEventListener("click", handleWorkspaceClick);
  els.tabButtons.forEach((button) => {
    button.id = `${button.dataset.tab}-tab-button`;
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });
}

async function init() {
  bindEvents();
  setStatus("앱을 불러오는 중입니다.");

  try {
    await refreshAll();
    renderResult(null);
    renderDetail();
    setStatus("준비 완료. 이제 메뉴는 버튼에게 맡기면 됩니다.");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

init();
