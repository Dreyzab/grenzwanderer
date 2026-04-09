import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

const PORT = Number(process.env.PORT ?? "8080");
const CACHE_ROOT =
  process.env.SCENE_GEN_CACHE_ROOT ??
  path.join(process.cwd(), "tmp", "scene-gen-cache");
const PROMPT_VERSION = process.env.SCENE_GEN_PROMPT_VERSION ?? "karlsruhe-v1";
const RELEASE_PROFILE = process.env.SCENE_GEN_RELEASE_PROFILE ?? "karlsruhe_event";

const SCENE_PROMPTS = {
  karlsruhe_event_arrival:
    "Early morning Karlsruhe station in 1905, steam, newspaper seller, sharp detective arrival, sepia illustration.",
  sandbox_banker_pilot:
    "Fin de siecle Karlsruhe bank interior, tense robbery aftermath, ledgers, brass, investigative mood.",
  sandbox_dog_pilot:
    "Karlsruhe Rathaus district, missing mayoral dog case, civic square, brisk public intrigue.",
  sandbox_missing_aroma_pilot:
    "Historic bakery in Karlsruhe, missing spice aroma, warm ovens, investigative atmosphere.",
};

const respondJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(`${JSON.stringify(payload)}\n`);
};

const safeSegment = (value) =>
  value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";

const buildPrompt = ({ caseId, pointId, scenarioId }) =>
  SCENE_PROMPTS[scenarioId] ??
  `Detective event artwork for ${caseId} at ${pointId}, scenario ${scenarioId}, prompt-only release render.`;

const buildCacheKey = ({ caseId, pointId, scenarioId }) =>
  `${RELEASE_PROFILE}/${caseId}/${pointId}/${scenarioId}/${PROMPT_VERSION}`;

const buildStorageDirectory = ({ caseId, pointId, scenarioId }) =>
  path.join(
    CACHE_ROOT,
    safeSegment(RELEASE_PROFILE),
    safeSegment(caseId),
    safeSegment(pointId),
    safeSegment(scenarioId),
    "prompt_only",
    safeSegment(PROMPT_VERSION),
  );

const encodeSvgDataUrl = (svg) =>
  `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;

const renderSceneSvg = ({ caseId, pointId, scenarioId, prompt }) => {
  const paletteSeed = createHash("sha256")
    .update(`${caseId}:${pointId}:${scenarioId}`, "utf8")
    .digest("hex");
  const accent = `#${paletteSeed.slice(0, 6)}`;
  const secondary = `#${paletteSeed.slice(6, 12)}`;
  const label = `${caseId} :: ${pointId}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="${scenarioId}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accent}" />
      <stop offset="100%" stop-color="${secondary}" />
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)" />
  <rect x="72" y="72" width="1456" height="756" rx="40" fill="rgba(12,10,9,0.58)" stroke="rgba(245,245,244,0.18)" />
  <text x="120" y="180" fill="#f5f5f4" font-family="Georgia, serif" font-size="42">Grenzwanderer Karlsruhe Event</text>
  <text x="120" y="250" fill="#fde68a" font-family="Georgia, serif" font-size="28">${scenarioId}</text>
  <text x="120" y="320" fill="#e7e5e4" font-family="Arial, sans-serif" font-size="24">${label}</text>
  <foreignObject x="120" y="380" width="1280" height="260">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; font-size: 28px; line-height: 1.45; color: #fafaf9;">
      ${prompt}
    </div>
  </foreignObject>
  <text x="120" y="760" fill="#d6d3d1" font-family="Arial, sans-serif" font-size="20">Prompt version: ${PROMPT_VERSION}</text>
</svg>`;
};

const ensureSceneResult = (requestPayload) => {
  const prompt = buildPrompt(requestPayload);
  const cacheKey = buildCacheKey(requestPayload);
  const storageDirectory = buildStorageDirectory(requestPayload);
  const resultPath = path.join(storageDirectory, "result.json");

  mkdirSync(storageDirectory, { recursive: true });

  try {
    const cached = JSON.parse(readFileSync(resultPath, "utf8"));
    if (
      cached &&
      typeof cached.imageUrl === "string" &&
      typeof cached.cacheKey === "string" &&
      typeof cached.promptVersion === "string"
    ) {
      return cached;
    }
  } catch (_error) {
    // Cache miss or corrupted file. Rebuild below.
  }

  const svg = renderSceneSvg({
    ...requestPayload,
    prompt,
  });
  const result = {
    imageUrl: encodeSvgDataUrl(svg),
    cacheKey,
    promptVersion: PROMPT_VERSION,
  };

  writeFileSync(path.join(storageDirectory, "scene.svg"), svg, "utf8");
  writeFileSync(
    path.join(storageDirectory, "request.json"),
    `${JSON.stringify(
      {
        releaseProfile: RELEASE_PROFILE,
        input: {
          ...requestPayload,
          imageInput: null,
        },
        prompt,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  return result;
};

const parseRequestBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) {
    throw new Error("Request body is required");
  }

  const parsed = JSON.parse(rawBody);
  if (
    !parsed ||
    typeof parsed.caseId !== "string" ||
    typeof parsed.pointId !== "string" ||
    typeof parsed.scenarioId !== "string" ||
    parsed.mode !== "prompt_only"
  ) {
    throw new Error(
      "Body must include { caseId, pointId, scenarioId, mode: 'prompt_only' }",
    );
  }

  return {
    caseId: parsed.caseId.trim(),
    pointId: parsed.pointId.trim(),
    scenarioId: parsed.scenarioId.trim(),
    mode: "prompt_only",
  };
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/healthz") {
    respondJson(response, 200, {
      ok: true,
      releaseProfile: RELEASE_PROFILE,
      promptVersion: PROMPT_VERSION,
    });
    return;
  }

  if (
    request.method === "POST" &&
    (url.pathname === "/scene/generate" || url.pathname === "/api/scene/generate")
  ) {
    try {
      const payload = await parseRequestBody(request);
      const result = ensureSceneResult(payload);
      respondJson(response, 200, result);
    } catch (error) {
      respondJson(response, 400, {
        error: error instanceof Error ? error.message : "Invalid request",
      });
    }
    return;
  }

  respondJson(response, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(
    `[scene-gen] listening on :${PORT} releaseProfile=${RELEASE_PROFILE} promptVersion=${PROMPT_VERSION}`,
  );
});
