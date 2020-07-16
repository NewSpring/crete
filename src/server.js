import { ApolloServer } from 'apollo-server-express';
import ApollosConfig from '@apollosproject/config';
import express from 'express';
import { RockLoggingExtension } from '@apollosproject/rock-apollo-data-source';
import { get, fromPairs } from 'lodash';
import bugsnag, { bugsnagMiddleware } from './bugsnag';
// TODO find out what this is
// import { setupUniversalLinks } from '@apollosproject/server-core';
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

// NOTE this is an effort to find the auth bug, this can come out once we have it.
const report = (error, metaData, beforeSend) => {
  bugsnag.notify(error, {
    metaData: {
      Rock: { rockUrl: ApollosConfig.ROCK.API_URL },
      ...metaData,
    },
    beforeSend,
  });
};
const plugins = [
  {
    requestDidStart() {
      return {
        didEncounterErrors({ errors, request }) {
          const headers = fromPairs(Array.from(request.http.headers.entries()));
          errors.forEach((error) => {
            isDev && console.log(error); // eslint-disable-line
            report(
              error,
              {
                'GraphQL Info': {
                  query: request.query,
                  location: JSON.stringify(error.locations),
                  variables: request.variables,
                  operationName: request.operationName,
                  headers,
                },
                'Auth Error Info': get(
                  error,
                  'extensions.exception.userContext'
                ),
              },
              (err) => {
                const ip = get(headers, 'fastly-client-ip', 'unknown');
                err.user = { // eslint-disable-line
                  id: ip,
                  appVersion: get(headers, 'user-agent', 'unknown'),
                };
              }
            );
          });
        },
      };
    },
  },
];

const apolloServer = new ApolloServer({
  typeDefs: schema,
  resolvers,
  dataSources,
  context,
  introspection: true,
  extensions,
  plugins,
  debug: true,
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
// Comment out if you don't want the API serving apple-app-site-association or assetlinks manifests.
// setupUniversalLinks({ app });

apolloServer.applyMiddleware({ app });
apolloServer.applyMiddleware({ app, path: '/' });

// This must be the last piece of middleware.
app.use(bugsnagMiddleware.errorHandler);

export default app;
