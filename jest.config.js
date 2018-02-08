const { createDefaultPreset } = require("ts-jest");

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["**/*.test.ts"],
  verbose: false,
  clearMocks: true,
  resetModules: true,
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/lib/",
    "/dist/",
    "/__fixtures__/",
    "/__tests__/",
    "/(__)?mock(s__)?/",
    "/__jest__/",
    ".?.min.js",
    "./src/index.ts",
  ],
  moduleDirectories: ["node_modules", "src"],
  transform: {
    ...createDefaultPreset().transform,
  },
  moduleFileExtensions: ["js", "ts"],
  testTimeout: 5000, // ms, default is 5000
};
