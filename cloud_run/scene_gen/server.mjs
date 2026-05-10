import { createHash, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import * as Sentry from "@sentry/node";

const PORT = Number(process.env.PORT ?? "8080");
const CACHE_ROOT =
  process.env.SCENE_GEN_CACHE_ROOT ??
  path.join(process.cwd(), "tmp", "scene-gen-cache");
const PROMPT_VERSION = process.env.SCENE_GEN_PROMPT_VERSION ?? "karlsruhe-v1";
const RELEASE_PROFILE =
  process.env.SCENE_GEN_RELEASE_PROFILE ?? "karlsruhe_event";
const SENTRY_DSN = process.env.SENTRY_DSN ?? "";
const SENTRY_ENABLED =
  String(process.env.SENTRY_ENABLED ?? "false").toLowerCase() === "true" &&
  SENTRY_DSN.length > 0;
const SENTRY_TRACES_SAMPLE_RATE = Number(
  process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0",
);

const APP_CHECK_ENFORCE =
  String(process.env.APP_CHECK_ENFORCE ?? "false").toLowerCase() === "true";
const APP_CHECK_PROJECT_NUMBER = process.env.APP_CHECK_PROJECT_NUMBER ?? "";
const APP_CHECK_BYPASS_SECRET = process.env.APP_CHECK_BYPASS_SECRET ?? "";

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: true,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "production",
    release: process.env.SENTRY_RELEASE ?? process.env.K_REVISION,
    tracesSampleRate: Number.isFinite(SENTRY_TRACES_SAMPLE_RATE)
      ? SENTRY_TRACES_SAMPLE_RATE
      : 0,
  });

  Sentry.setTag("service", "karlsruhe-scene-gen");
  Sentry.setTag("release_profile", RELEASE_PROFILE);
  Sentry.setTag("prompt_version", PROMPT_VERSION);
  Sentry.setTag("cloud_run.service", process.env.K_SERVICE ?? "unknown");
  Sentry.setTag("cloud_run.revision", process.env.K_REVISION ?? "unknown");
  Sentry.setTag("app_check.enforce", APP_CHECK_ENFORCE ? "true" : "false");
}

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequestError";
  }
}

// Lazy-init firebase-admin App Check on first request so unrelated cold starts
// (e.g. /healthz) stay fast. Init failures are retried on later requests.
let appCheckInit = null;
const getAppCheckVerifier = () => {
  if (appCheckInit) {
    return appCheckInit;
  }
  if (!APP_CHECK_PROJECT_NUMBER) {
    return Promise.resolve(null);
  }
  appCheckInit = (async () => {
    const [{ initializeApp, getApps }, { getAppCheck }] = await Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/app-check"),
    ]);
    if (getApps().length === 0) {
      initializeApp({ projectId: APP_CHECK_PROJECT_NUMBER });
    }
    return getAppCheck();
  })().catch((error) => {
    appCheckInit = null;
    throw error;
  });
  return appCheckInit;
};

const constantTimeEqual = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
};

const verifyAppCheck = async (request) => {
  if (!APP_CHECK_PROJECT_NUMBER && !APP_CHECK_BYPASS_SECRET) {
    if (APP_CHECK_ENFORCE) {
      return { ok: false, reason: "verifier_unconfigured" };
    }
    // Feature off entirely: no project number configured, no bypass secret.
    // Return ok=true so this code path is invisible until an operator enables
    // it via the runbook; avoids pre-rollout Sentry noise.
    return { ok: true, source: "disabled" };
  }

  if (APP_CHECK_BYPASS_SECRET) {
    const provided = request.headers["x-appcheck-bypass"];
    if (
      typeof provided === "string" &&
      constantTimeEqual(provided, APP_CHECK_BYPASS_SECRET)
    ) {
      return { ok: true, source: "bypass" };
    }
  }

  const token = request.headers["x-firebase-appcheck"];
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing_token" };
  }

  let verifier;
  try {
    verifier = await getAppCheckVerifier();
  } catch (error) {
    return {
      ok: false,
      reason: "verifier_init_failed",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  if (!verifier) {
    return { ok: false, reason: "verifier_unconfigured" };
  }

  try {
    await verifier.verifyToken(token);
    return { ok: true, source: "appcheck" };
  } catch (error) {
    return {
      ok: false,
      reason: "invalid_token",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

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

const captureException = (error, tags = {}) => {
  if (!SENTRY_ENABLED) {
    return;
  }

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(tags)) {
      scope.setTag(key, value);
    }
    Sentry.captureException(error);
  });
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
    throw new BadRequestError("Request body is required");
  }

  let parsed;
  try {
    parsed = JSON.parse(rawBody);
  } catch (_error) {
    throw new BadRequestError("Request body must be valid JSON");
  }

  if (
    !parsed ||
    typeof parsed.caseId !== "string" ||
    typeof parsed.pointId !== "string" ||
    typeof parsed.scenarioId !== "string" ||
    parsed.mode !== "prompt_only"
  ) {
    throw new BadRequestError(
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
    (url.pathname === "/scene/generate" ||
      url.pathname === "/api/scene/generate")
  ) {
    const verification = await verifyAppCheck(request);
    if (!verification.ok) {
      if (SENTRY_ENABLED) {
        Sentry.withScope((scope) => {
          scope.setTag("app_check.reason", verification.reason);
          scope.setTag(
            "app_check.enforced",
            APP_CHECK_ENFORCE ? "true" : "false",
          );
          scope.setTag("http.path", url.pathname);
          if (verification.error) {
            Sentry.captureException(verification.error);
          } else {
            Sentry.captureMessage(
              `app_check.${verification.reason}`,
              "warning",
            );
          }
        });
      }
      if (APP_CHECK_ENFORCE) {
        respondJson(response, 401, {
          error: "App Check verification required",
        });
        return;
      }
    }

    try {
      const payload = await parseRequestBody(request);
      const result = ensureSceneResult(payload);
      respondJson(response, 200, result);
    } catch (error) {
      if (error instanceof BadRequestError) {
        respondJson(response, 400, { error: error.message });
      } else {
        captureException(
          error instanceof Error ? error : new Error(String(error)),
          {
            "http.method": request.method,
            "http.path": url.pathname,
          },
        );
        respondJson(response, 500, { error: "Scene generation failed" });
      }
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

server.on("error", (error) => {
  captureException(error, { "server.phase": "listen" });
});

process.on("unhandledRejection", (reason) => {
  captureException(
    reason instanceof Error
      ? reason
      : new Error(`Unhandled rejection: ${String(reason)}`),
    { "process.phase": "unhandled_rejection" },
  );
});

process.on("uncaughtException", (error) => {
  captureException(error, { "process.phase": "uncaught_exception" });
  Sentry.flush(2_000).finally(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  Sentry.flush(2_000).finally(() => {
    process.exit(0);
  });
});
