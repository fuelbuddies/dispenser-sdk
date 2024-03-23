module.exports = {
    transform: {
      '^.+\\.(t|j)sx?$': '@swc/jest',
    },
    testMatch: ["<rootDir>/tests/**/GateX.test.ts"],
  }