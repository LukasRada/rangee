const esbuild = require("esbuild");
esbuild
  .build({
    entryPoints: ["./src/index.ts"],
    outfile: "dist/index.js",
    bundle: true,
    minify: false,
    platform: "browser",
    loader: {
      ".ts": "ts",
    },
    target: ["chrome58", "firefox57", "safari11", "edge16"],
  })
  .catch(() => process.exit(1));
