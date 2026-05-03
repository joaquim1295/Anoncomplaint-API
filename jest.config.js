/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.js"],
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  modulePathIgnorePatterns: ["<rootDir>/AnonComplaint-Vibcoded/", "<rootDir>/mobile/"],
  watchPathIgnorePatterns: ["<rootDir>/AnonComplaint-Vibcoded/", "<rootDir>/mobile/"],
  // jsx "preserve" (Next) leaves JSX untransformed; tests need a Node-friendly emit.
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
          strict: true,
        },
      },
    ],
  },
};