import { readFileSync, writeFileSync } from "node:fs";

// Regenerates updates.json for Firefox self-distribution auto-update.
// The manifest's update_url points at this file (served via raw.githubusercontent);
// Firefox polls it and offers the update_link when a newer version exists.

const REPO = "lttr/firefox-markdown";

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { version } = manifest;
const id = manifest.browser_specific_settings.gecko.id;

const updates = {
  addons: {
    [id]: {
      updates: [
        {
          version,
          update_link: `https://github.com/${REPO}/releases/download/v${version}/markdown_renderer-${version}.xpi`,
        },
      ],
    },
  },
};

writeFileSync("updates.json", JSON.stringify(updates, null, 2) + "\n");
console.log(`updates.json written for ${id} v${version}`);
