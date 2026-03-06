import type { Config } from 'jest';

// The Prisma client is generated into the root node_modules (one level up).
// We map @prisma/client and .prisma/client to the root-generated client so
// that ts-jest can resolve the model types produced by `prisma generate`.
const rootNodeModules = '<rootDir>/../../node_modules';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { diagnostics: false }],
  },
  moduleNameMapper: {
    '^@prisma/client$': `${rootNodeModules}/@prisma/client`,
    '^@prisma/client/(.*)$': `${rootNodeModules}/@prisma/client/$1`,
    '^\\.prisma/client/(.*)$': `${rootNodeModules}/.prisma/client/$1`,
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};

export default config;
