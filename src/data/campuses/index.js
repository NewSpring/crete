import { Campus } from '@apollosproject/data-connector-rock';
import resolver from './resolver';

const { schema, dataSource } = Campus;

export { schema, resolver, dataSource };
