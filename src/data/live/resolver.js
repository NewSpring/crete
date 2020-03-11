import { resolver as baseLive } from '@apollosproject/data-connector-church-online';
import { resolverMerge } from '@apollosproject/server-core';

const resolver = {
  Query: {
    liveStreams: (root, args, { dataSources }) =>
      dataSources.LiveStream.getLiveStreams(),
  },
};

export default resolverMerge(resolver, baseLive);
