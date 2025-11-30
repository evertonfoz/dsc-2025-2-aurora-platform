const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/test", "<rootDir>/src"],
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    "^@aurora/common$": "<rootDir>/../common/src",
    "^@aurora/common/(.*)$": "<rootDir>/../common/src/$1",
  },
};