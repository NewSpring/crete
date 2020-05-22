import dotenv from 'dotenv/config'; // eslint-disable-line
import config from './config'; // eslint-disable-line
import server from './server';

// memory leak dumps
import leakdump from '../scripts/leakdump.js'; // eslint-disable-line

export { testSchema } from './server'; // eslint-disable-line import/prefer-default-export

// Rookout debug
const rookout = require('rookout');

rookout.start({
  token: process.env.ROOKOUT_KEY,
  labels: { env: process.env.ENVIRONMENT || 'development' },
});

// Use the port, if provided.
const { PORT } = process.env;
if (!PORT && process.env.NODE_ENV !== 'test')
  console.warn(
    'Add `PORT=XXXX` if you are having trouble connecting to the server. By default, PORT is 4000.'
  );

server.listen({ port: PORT || 4000 }, () => {
  console.log(`🚀 Server ready at http://0.0.0.0:${PORT || 4000}`);
});
