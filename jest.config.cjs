/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.(test|spec).(ts|tsx)", "**/*.(test|spec).(ts|tsx)"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  moduleNameMapper: {
    "\\.(css|less|scss)$": "<rootDir>/src/test/styleMock.ts",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },
  collectCoverageFrom: [
    "src/lib/kioskAnalytics.ts",
    "src/lib/choreOfflineSnapshot.ts",
    "src/lib/choreAnalyticsAgentData.ts",
    "src/lib/choreA11y.ts",
    "src/lib/choreLocale.ts",
  ],
};
