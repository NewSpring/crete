import { ApolloServer } from 'apollo-server-express';
import ApollosConfig from '@apollosproject/config';
import express from 'express';
import { RockLoggingExtension } from '@apollosproject/rock-apollo-data-source';
import bugsnag, { bugsnagMiddleware } from './bugsnag';

import {
  resolvers,
  schema,
  testSchema,
  context,
  dataSources,
  applyServerMiddleware,
  setupJobs,
} from './data';

export { resolvers, schema, testSchema };

const isDev =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

const extensions = isDev ? [() => new RockLoggingExtension()] : [];

const cacheOptions = isDev
  ? {}
  : {
      cacheControl: {
        stripFormattedExtensions: false,
        calculateHttpHeaders: true,
        defaultMaxAge: 3600,
      },
    };

const { ENGINE } = ApollosConfig;

const apolloServer = new ApolloServer({
  typeDefs: schema,
  resolvers,
  dataSources,
  context,
  introspection: true,
  extensions,
  debug: true,
  formatError: (error) => {
    const productionError = error;
    const {
      extensions: {
        exception: { stacktrace = [] },
      },
    } = error;
    bugsnag.notify(error, {
      metaData: {
        Rock: { rockUrl: ApollosConfig.ROCK.API_URL },
        'GraphQL Info': { path: error.path },
        'Custom Stacktrace': {
          trace: stacktrace.join('\n'),
        },
      },
    });
    if (stacktrace) {
      delete productionError.extensions.exception.stacktrace;
    }
    return productionError;
  },
  playground: {
    settings: {
      'editor.cursorShape': 'line',
    },
  },
  ...cacheOptions,
  engine: {
    apiKey: ENGINE.API_KEY,
  },
});

const app = express();

// This must be the first piece of middleware in the stack.
// It can only capture errors in downstream middleware
app.use(bugsnagMiddleware.requestHandler);

applyServerMiddleware({ app, dataSources, context });
setupJobs({ app, dataSources, context });

apolloServer.applyMiddleware({ app });
apolloServer.applyMiddleware({ app, path: '/' });

// This must be the last piece of middleware.
app.use(bugsnagMiddleware.errorHandler);

export default app;
