export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
        // 151002: ts-jest suggests isolatedModules for NodeNext, but enabling
        // it in the shared tsconfig breaks its own ESM transform. The warning
        // is cosmetic here since ts-jest transpiles one file at a time anyway.
        diagnostics: { ignoreCodes: [151002] },
      },
    ],
  },
};
