import bugsnag from '@bugsnag/js';
import bugsnagExpress from '@bugsnag/plugin-express';

// we use a fake bugsnag key in the testing environment
const isTest = process.env.NODE_ENV === 'test';

const bugsnagClient = bugsnag({
  apiKey: isTest
    ? 'c9d60ae4c7e70c4b6c4ebd3e8056d2b8'
    : process.env.BUGSNAG_API_KEY,
  notifyReleaseStages: ['production', 'staging'],
  releaseStage: process.env.BUGSNAG_STAGE || 'development',
});

bugsnagClient.use(bugsnagExpress);

const bugsnagMiddleware = bugsnagClient.getPlugin('express');

export { bugsnagClient as default, bugsnagMiddleware };
