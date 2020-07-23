import { Event } from '@apollosproject/data-connector-rock';
import resolver from './resolver';
import dataSource from './data-source';

const { schema } = Event;

export { schema, resolver, dataSource };
