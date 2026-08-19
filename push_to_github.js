#!/usr/bin/env node
/**
 * GitHub API pusher — no git binary needed
 * Usage: node push_to_github.js <GITHUB_TOKEN>
 * 
 * Pushes changed source files to the main branch of the repo
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const REPO = "Abdulkerim-web/Design-Flavor-Coffee-ERP-1-";
const BRANCH = "main";
const TOKEN = process.argv[2];

if (!TOKEN) {
  console.error("Usage: node push_to_github.js <GITHUB_TOKEN>");
  process.exit(1);
}

const FILES_TO_PUSH = [
  "src/pages/Production.tsx",
  "src/lib/supabase-api.ts",
  "src/services/operations.ts",
  "src/pages/Payments.tsx",
];

const BASE_DIR = path.join(__dirname);

function githubReq(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.github.com",
      path: apiPath,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Design-Flavor-ERP-Pusher/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };
    let data = "";
    const req = https.request(options, (res) => {
      res.on("data", (d) => (data += d));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function getFileSha(filePath) {
  const res = await githubReq("GET", `/repos/${REPO}/contents/${filePath}?ref=${BRANCH}`, null);
  if (res.status === 200 && res.data.sha) return res.data.sha;
  return null;
}

async function pushFile(filePath) {
  const absolutePath = path.join(BASE_DIR, filePath);
  const content = fs.readFileSync(absolutePath, "utf8");
  const encoded = Buffer.from(content).toString("base64");

  console.log(`Pushing ${filePath}...`);
  const existingSha = await getFileSha(filePath);

  const body = {
    message: `fix: real-time list update and correct DB inserts for ${path.basename(filePath)}`,
    content: encoded,
    branch: BRANCH,
    ...(existingSha ? { sha: existingSha } : {}),
  };

  const res = await githubReq("PUT", `/repos/${REPO}/contents/${filePath}`, body);
  if (res.status === 200 || res.status === 201) {
    console.log(`  ✓ ${filePath} pushed successfully`);
  } else {
    console.error(`  ✗ ${filePath} failed: HTTP ${res.status}`, JSON.stringify(res.data).slice(0, 200));
  }
}

async function main() {
  console.log(`Pushing ${FILES_TO_PUSH.length} files to ${REPO}/${BRANCH}...\n`);
  for (const f of FILES_TO_PUSH) {
    await pushFile(f);
  }
  console.log("\nDone! Vercel will auto-deploy in ~1 minute.");
}

main().catch(console.error);
