import {
  dataSource,
  schema,
  resolver as baseResolver,
} from '@apollosproject/data-connector-passes';

const resolver = {
  ...baseResolver,
  Pass: {
    ...baseResolver.Pass,
    passkitFileUrl: () => null,
  },
};

export { resolver, dataSource, schema };
