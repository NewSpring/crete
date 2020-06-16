import { Feature } from '@apollosproject/data-connector-rock';
import dataSource from './data-source';
import schema from './schema';

const { resolver } = Feature;

export { schema, resolver, dataSource };
