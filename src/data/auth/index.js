import { Auth } from '@apollosproject/data-connector-rock';
import dataSource from './data-source';

const { schema, resolver, contextMiddleware } = Auth;

export { schema, resolver, dataSource, contextMiddleware };
