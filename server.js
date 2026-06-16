const http = require("http");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const seedMenus = [
  {
    id: 1,
    name: "김치찌개",
    category: "한식",
    calorie: 650,
    spicy_level: 3,
    author_name: "기본",
    created_at: "2026-06-16T00:00:00.000Z"
  },
  {
    id: 2,
    name: "짜장면",
    category: "중식",
    calorie: 820,
    spicy_level: 0,
    author_name: "기본",
    created_at: "2026-06-16T00:00:00.000Z"
  },
  {
    id: 3,
    name: "치킨",
    category: "패스트푸드",
    calorie: 1200,
    spicy_level: 2,
    author_name: "기본",
    created_at: "2026-06-16T00:00:00.000Z"
  },
  {
    id: 4,
    name: "쌀국수",
    category: "아시안",
    calorie: 540,
    spicy_level: 1,
    author_name: "기본",
    created_at: "2026-06-16T00:00:00.000Z"
  },
  {
    id: 5,
    name: "제육볶음",
    category: "한식",
    calorie: 760,
    spicy_level: 4,
    author_name: "기본",
    created_at: "2026-06-16T00:00:00.000Z"
  },
  {
    id: 6,
    name: "돈까스",
    category: "일식",
    calorie: 900,
    spicy_level: 0,
    author_name: "기본",
    created_at: "2026-06-16T00:00:00.000Z"
  },
  {
    id: 7,
    name: "떡볶이",
    category: "분식",
    calorie: 680,
    spicy_level: 5,
    author_name: "기본",
    created_at: "2026-06-16T00:00:00.000Z"
  },
  {
    id: 8,
    name: "샐러드 볼",
    category: "가벼운식사",
    calorie: 430,
    spicy_level: 0,
    author_name: "기본",
    created_at: "2026-06-16T00:00:00.000Z"
  }
];

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function now() {
  return new Date().toISOString();
}

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      menus: seedMenus,
      recommendations: [],
      reviews: [],
      counters: {
        menus: seedMenus.length + 1,
        recommendations: 1,
        reviews: 1
      }
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
}

async function loadDb() {
  ensureDatabase();
  const file = await fsp.readFile(DB_FILE, "utf8");
  const db = JSON.parse(file);

  db.menus ||= [];
  db.recommendations ||= [];
  db.reviews ||= [];
  db.counters ||= { menus: 1, recommendations: 1, reviews: 1 };

  return db;
}

async function saveDb(db) {
  await fsp.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function nextId(db, key) {
  const id = db.counters[key] || 1;
  db.counters[key] = id + 1;
  return id;
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message, detail) {
  sendJson(res, statusCode, { error: message, detail });
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("요청 본문이 너무 큽니다."));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON 형식이 올바르지 않습니다."));
      }
    });
    req.on("error", reject);
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
}

function pickRandomMenu(db, previousMenuId) {
  if (db.menus.length === 0) {
    return null;
  }

  const candidates =
    db.menus.length > 1
      ? db.menus.filter((menu) => menu.id !== previousMenuId)
      : db.menus;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function menuReviewStats(db, menuId) {
  const reviews = db.reviews.filter((review) => review.menu_id === menuId);
  const ratingAverage =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return {
    review_count: reviews.length,
    rating_average: Number(ratingAverage.toFixed(1))
  };
}

function shapeMenu(db, menu) {
  return {
    ...menu,
    ...menuReviewStats(db, menu.id)
  };
}

function shapeRecommendation(db, recommendation) {
  const menu = db.menus.find((item) => item.id === recommendation.menu_id);

  return {
    ...recommendation,
    menu: menu ? shapeMenu(db, menu) : null
  };
}

function sortNewestFirst(items) {
  return [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function handleApi(req, res, pathname) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return true;
  }

  const db = await loadDb();
  const segments = pathname.split("/").filter(Boolean);

  if (req.method === "GET" && pathname === "/health") {
    sendJson(res, 200, { ok: true, service: "menu-recommendation" });
    return true;
  }

  if (req.method === "GET" && pathname === "/menus") {
    sendJson(res, 200, sortNewestFirst(db.menus).map((menu) => shapeMenu(db, menu)));
    return true;
  }

  if (req.method === "POST" && pathname === "/menus") {
    const body = await readBody(req);
    const name = normalizeText(body.name || body.menu_name);
    const category = normalizeText(body.category) || "기타";
    const calorie = Math.max(0, normalizeInteger(body.calorie, 0));
    const spicyLevel = Math.min(5, Math.max(0, normalizeInteger(body.spicy_level, 0)));
    const authorName = normalizeText(body.author_name) || "익명";

    if (!name) {
      sendError(res, 400, "메뉴 이름을 입력해주세요.");
      return true;
    }

    const menu = {
      id: nextId(db, "menus"),
      name,
      category,
      calorie,
      spicy_level: spicyLevel,
      author_name: authorName,
      created_at: now()
    };

    db.menus.push(menu);
    await saveDb(db);
    sendJson(res, 201, shapeMenu(db, menu));
    return true;
  }

  if (req.method === "GET" && pathname === "/recommendations") {
    const recommendations = sortNewestFirst(db.recommendations).map((recommendation) =>
      shapeRecommendation(db, recommendation)
    );
    sendJson(res, 200, recommendations);
    return true;
  }

  if (req.method === "POST" && pathname === "/recommendations") {
    const menu = pickRandomMenu(db);
    if (!menu) {
      sendError(res, 409, "추천할 메뉴가 없습니다. 먼저 메뉴를 등록해주세요.");
      return true;
    }

    const body = await readBody(req);
    const recommendation = {
      id: nextId(db, "recommendations"),
      user_name: normalizeText(body.user_name) || "배고픈 사람",
      result_method: normalizeText(body.result_method) || "random",
      menu_id: menu.id,
      created_at: now(),
      updated_at: now()
    };

    db.recommendations.push(recommendation);
    await saveDb(db);
    sendJson(res, 201, shapeRecommendation(db, recommendation));
    return true;
  }

  if (segments[0] === "recommendations" && segments.length === 2) {
    const recommendationId = normalizeInteger(segments[1], NaN);
    const recommendation = db.recommendations.find((item) => item.id === recommendationId);

    if (!recommendation) {
      sendError(res, 404, "추천 기록을 찾을 수 없습니다.");
      return true;
    }

    if (req.method === "GET") {
      sendJson(res, 200, shapeRecommendation(db, recommendation));
      return true;
    }

    if (req.method === "PATCH") {
      const body = await readBody(req);
      const nextMenu = pickRandomMenu(db, recommendation.menu_id);

      if (!nextMenu) {
        sendError(res, 409, "추천할 메뉴가 없습니다. 먼저 메뉴를 등록해주세요.");
        return true;
      }

      recommendation.menu_id = nextMenu.id;
      recommendation.result_method = normalizeText(body.result_method) || "reroll";
      recommendation.updated_at = now();
      await saveDb(db);
      sendJson(res, 200, shapeRecommendation(db, recommendation));
      return true;
    }

    if (req.method === "DELETE") {
      db.recommendations = db.recommendations.filter((item) => item.id !== recommendationId);
      await saveDb(db);
      sendJson(res, 200, { message: "추천 기록을 삭제했습니다." });
      return true;
    }
  }

  if (req.method === "GET" && segments[0] === "menus" && segments[2] === "reviews") {
    const menuId = normalizeInteger(segments[1], NaN);
    const menu = db.menus.find((item) => item.id === menuId);

    if (!menu) {
      sendError(res, 404, "메뉴를 찾을 수 없습니다.");
      return true;
    }

    sendJson(res, 200, sortNewestFirst(db.reviews.filter((review) => review.menu_id === menuId)));
    return true;
  }

  if (req.method === "POST" && segments[0] === "menus" && segments[2] === "reviews") {
    const menuId = normalizeInteger(segments[1], NaN);
    const menu = db.menus.find((item) => item.id === menuId);

    if (!menu) {
      sendError(res, 404, "메뉴를 찾을 수 없습니다.");
      return true;
    }

    const body = await readBody(req);
    const reviewerName = normalizeText(body.reviewer_name) || "익명";
    const comment = normalizeText(body.comment);
    const rating = Math.min(5, Math.max(1, normalizeInteger(body.rating, 5)));

    if (!comment) {
      sendError(res, 400, "한 줄 평을 입력해주세요.");
      return true;
    }

    const review = {
      id: nextId(db, "reviews"),
      menu_id: menuId,
      reviewer_name: reviewerName,
      comment,
      rating,
      created_at: now()
    };

    db.reviews.push(review);
    await saveDb(db);
    sendJson(res, 201, review);
    return true;
  }

  if (req.method === "DELETE" && segments[0] === "reviews" && segments.length === 2) {
    const reviewId = normalizeInteger(segments[1], NaN);
    const exists = db.reviews.some((review) => review.id === reviewId);

    if (!exists) {
      sendError(res, 404, "한 줄 평을 찾을 수 없습니다.");
      return true;
    }

    db.reviews = db.reviews.filter((review) => review.id !== reviewId);
    await saveDb(db);
    sendJson(res, 200, { message: "한 줄 평을 삭제했습니다." });
    return true;
  }

  if (["/menus", "/recommendations", "/reviews", "/health"].some((base) => pathname.startsWith(base))) {
    sendError(res, 404, "API 경로를 찾을 수 없습니다.");
    return true;
  }

  return false;
}

async function serveStatic(req, res, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const normalizedPath = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, normalizedPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendError(res, 403, "접근할 수 없는 경로입니다.");
    return;
  }

  try {
    const stat = await fsp.stat(filePath);

    if (stat.isDirectory()) {
      sendError(res, 404, "파일을 찾을 수 없습니다.");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream"
    });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    const indexPath = path.join(PUBLIC_DIR, "index.html");
    res.writeHead(200, {
      "Content-Type": contentTypes[".html"]
    });
    fs.createReadStream(indexPath).pipe(res);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = requestUrl.pathname;
    const handled = await handleApi(req, res, pathname);

    if (!handled) {
      await serveStatic(req, res, pathname);
    }
  } catch (error) {
    sendError(res, 500, "서버에서 문제가 발생했습니다.", error.message);
  }
});

ensureDatabase();
server.listen(PORT, () => {
  console.log(`Menu recommendation app is running at http://localhost:${PORT}`);
});
