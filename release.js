import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

// One-shot release: bump version, regenerate updates.json, commit, tag, push.
// CI (.github/workflows/sign.yml) then signs on AMO and publishes the release.
//
// Usage:
//   pnpm release            # patch bump (1.1.6 -> 1.1.7)
//   pnpm release minor      # 1.1.6 -> 1.2.0
//   pnpm release major      # 1.1.6 -> 2.0.0
//   pnpm release 1.4.2      # explicit version

const run = (cmd) => execSync(cmd, { stdio: "pipe" }).toString().trim();

// --- preflight ---------------------------------------------------------------
const branch = run("git rev-parse --abbrev-ref HEAD");
if (branch !== "master") {
  console.error(`Refusing to release from '${branch}'; switch to master.`);
  process.exit(1);
}
if (run("git status --porcelain")) {
  console.error("Working tree is dirty; commit or stash first.");
  process.exit(1);
}

// --- compute next version ----------------------------------------------------
const arg = process.argv[2] ?? "patch";
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const [maj, min, pat] = manifest.version.split(".").map(Number);

const next = {
  major: `${maj + 1}.0.0`,
  minor: `${maj}.${min + 1}.0`,
  patch: `${maj}.${min}.${pat + 1}`,
}[arg] ?? arg;

if (!/^\d+\.\d+\.\d+$/.test(next)) {
  console.error(`Invalid version '${next}'. Use patch|minor|major or X.Y.Z.`);
  process.exit(1);
}

const tag = `v${next}`;
if (run("git tag -l " + tag)) {
  console.error(`Tag ${tag} already exists. Each AMO version is single-use.`);
  process.exit(1);
}

// --- write version into the two manifests + updates.json ---------------------
const bump = (file) => {
  const text = readFileSync(file, "utf8");
  const replaced = text.replace(
    /"version":\s*"\d+\.\d+\.\d+"/,
    `"version": "${next}"`,
  );
  writeFileSync(file, replaced);
};
bump("manifest.json");
bump("package.json");

// updates.json drives Firefox self-distribution auto-update: the manifest's
// update_url points here, and update_link resolves to the v<next> release asset.
const REPO = "lttr/firefox-markdown";
const id = manifest.browser_specific_settings.gecko.id;
const updates = {
  addons: {
    [id]: {
      updates: [
        {
          version: next,
          update_link: `https://github.com/${REPO}/releases/download/${tag}/markdown_renderer-${next}.xpi`,
        },
      ],
    },
  },
};
writeFileSync("updates.json", JSON.stringify(updates, null, 2) + "\n");

// --- build locally to fail fast before burning an AMO version ----------------
execSync("node build.js", { stdio: "inherit" });

// --- commit, tag, push -------------------------------------------------------
execSync("git add manifest.json package.json updates.json", { stdio: "inherit" });
execSync(`git commit -m "Release ${tag}"`, { stdio: "inherit" });
execSync(`git tag ${tag}`, { stdio: "inherit" });
execSync("git push origin master --tags", { stdio: "inherit" });

console.log(`\nTagged ${tag}. CI is signing on AMO and publishing the release.`);
console.log("Watch: gh run watch $(gh run list --workflow=sign.yml -L1 --json databaseId -q '.[0].databaseId')");
