import { spawn } from "node:child_process";

const port = 48123;

const waitForHealth = async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/healthz`);
      if (response.ok) {
        return;
      }
    } catch (_error) {
      // Service is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("Scene generation service did not become healthy in time");
};

const proc = spawn("node", ["cloud_run/scene_gen/server.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: `${port}`,
    SCENE_GEN_RELEASE_PROFILE: "karlsruhe_event",
    SCENE_GEN_PROMPT_VERSION: "karlsruhe-smoke-v1",
  },
  stdio: "ignore",
  shell: process.platform === "win32",
});

try {
  await waitForHealth();

  const requestBody = {
    caseId: "quest_missing_aroma",
    pointId: "loc_ka_bakery",
    scenarioId: "sandbox_missing_aroma_pilot",
    mode: "prompt_only",
  };

  const firstResponse = await fetch(`http://127.0.0.1:${port}/scene/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  if (!firstResponse.ok) {
    throw new Error(
      `First scene generation request failed with ${firstResponse.status}`,
    );
  }
  const firstPayload = (await firstResponse.json()) as Record<string, string>;

  const secondResponse = await fetch(
    `http://127.0.0.1:${port}/scene/generate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(requestBody),
    },
  );
  if (!secondResponse.ok) {
    throw new Error(
      `Second scene generation request failed with ${secondResponse.status}`,
    );
  }
  const secondPayload = (await secondResponse.json()) as Record<string, string>;

  if (
    typeof firstPayload.imageUrl !== "string" ||
    !firstPayload.imageUrl.startsWith("data:image/svg+xml;base64,")
  ) {
    throw new Error("Scene generation did not return a usable imageUrl");
  }

  if (firstPayload.cacheKey !== secondPayload.cacheKey) {
    throw new Error(
      "Scene generation cacheKey changed between identical requests",
    );
  }

  const invalidResponse = await fetch(
    `http://127.0.0.1:${port}/scene/generate`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "prompt_only" }),
    },
  );

  if (invalidResponse.status !== 400) {
    throw new Error("Invalid scene generation request should return HTTP 400");
  }

  console.log(
    "[smoke:karlsruhe:scene-gen] Scene generation cache and failure surface look correct.",
  );
} finally {
  proc.kill();
}
