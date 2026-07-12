import { createRequire } from "module";
import { readFileSync } from "fs";
import { dirname } from "path";

const require = createRequire(import.meta.url);

// Top-level packages our server routes import. Their transitive deps are
// resolved below so the standalone bundle ships everything needed at runtime.
const SERVER_PACKAGES = [
  "@vreden/youtube_scraper",
  "yt-search",
  "googleapis",
  "youtube-ext",
  "youtubei.js",
  "@distube/ytdl-core",
  "fluent-ffmpeg",
  "next-auth",
];

// Next.js standalone output with Turbopack does not always trace runtime
// dependencies of server-only packages (e.g. cheerio, axios), which makes the
// deployed container crash with "Cannot find module ...". We compute the full
// dependency closure and force it into the trace so the Docker image is
// self-contained.
function dependencyClosure(roots) {
  const seen = new Set();
  const visit = (pkg, fromDir) => {
    if (seen.has(pkg)) return;
    // Resolve the package's own directory. Reading package.json via the file
    // system (not require) is important: many packages use an "exports" map
    // that blocks require("pkg/package.json"), which would silently truncate
    // the dependency graph.
    let pkgDir;
    try {
      pkgDir = dirname(
        require.resolve(`${pkg}/package.json`, {
          paths: fromDir ? [fromDir] : undefined,
        })
      );
    } catch {
      try {
        // Fall back to resolving the entry point, then walking to its root.
        const entry = require.resolve(pkg, {
          paths: fromDir ? [fromDir] : undefined,
        });
        pkgDir = entry.slice(0, entry.indexOf(`node_modules/${pkg}`)) +
          `node_modules/${pkg}`;
      } catch {
        return; // optional/unresolved dep
      }
    }
    seen.add(pkg);
    let meta;
    try {
      meta = JSON.parse(readFileSync(`${pkgDir}/package.json`, "utf8"));
    } catch {
      return;
    }
    const deps = {
      ...(meta.dependencies || {}),
      ...(meta.optionalDependencies || {}),
    };
    for (const dep of Object.keys(deps)) visit(dep, pkgDir);
  };
  roots.forEach((r) => visit(r));
  return [...seen];
}

const tracedPackages = dependencyClosure(SERVER_PACKAGES).map(
  (pkg) => `./node_modules/${pkg}/**/*`
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api/**/*": tracedPackages,
  },
};

export default nextConfig;
