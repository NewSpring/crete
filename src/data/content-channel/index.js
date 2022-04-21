import { ContentChannel } from '@apollosproject/data-connector-rock';

import { resolverMerge } from '@apollosproject/server-core';

const { dataSource, schema } = ContentChannel;

const resolver = resolverMerge(
  {
    ContentChannel: {
      // this is custom, Newspring channels in Rock
      // are in the form "Newspring - Sermons"
      name: (root) => root.name.split(' - ').pop(),
    },
  },
  ContentChannel
);

export { dataSource, schema, resolver };
