import { ContentChannel } from '@apollosproject/data-connector-rock';

import { resolverMerge } from '@apollosproject/server-core';

const { dataSource, schema } = ContentChannel;

const resolver = resolverMerge(
  {
    ContentChannel: {
      name: (root) => root.name.split(' - ').pop(),
    },
  },
  ContentChannel
);

export { dataSource, schema, resolver };
