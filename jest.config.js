module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  testMatch: ["<rootDir>/tests/**/TCS3000.test.ts"],
};
