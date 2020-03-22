/* eslint-disable import/first */
// appdynamics metrics
require('appdynamics').profile({
  controllerHostName: 'audrey202003220506028.saas.appdynamics.com',
  controllerPort: 443,

  // If SSL, be sure to enable the next line
  controllerSslEnabled: true,
  accountName: 'audrey202003220506028',
  accountAccessKey: process.env.APPDYNAMICS_KEY,
  applicationName: 'ns-crete-staging',
  tierName: 'graphql',
  nodeName: 'process', // The controller will automatically append the node name with a unique number
});

import dotenv from 'dotenv/config'; // eslint-disable-line
import config from './config'; // eslint-disable-line
import server from './server';

export { testSchema } from './server'; // eslint-disable-line import/prefer-default-export

// Use the port, if provided.
const { PORT } = process.env;
if (!PORT && process.env.NODE_ENV !== 'test')
  console.warn(
    'Add `ENV=4000` if you are having trouble connecting to the server. By default, PORT is random.'
  );

server.listen({ port: PORT }, () => {
  console.log(`🚀 Server ready at http://0.0.0.0:${PORT}`);
});
