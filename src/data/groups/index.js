import { Group } from '@apollosproject/data-connector-rock';
import schema from './schema';
import dataSource from './data-source';

const { resolver } = Group;

export { schema, resolver, dataSource };
