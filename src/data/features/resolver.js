import { Features as baseFeatures } from '@apollosproject/data-connector-rock';
import { resolverMerge } from '@apollosproject/server-core';

const resolver = {
  HeaderFeature: {
    sharing: ({ body }) => ({
      title: 'Share via...',
      message: body.replace(/__(.*)__/gm, (match, p1) => p1),
    }),
  },
  TextFeature: {
    sharing: ({ body }) => ({
      title: 'Share via...',
      message: body.replace(/__(.*)__/gm, (match, p1) => p1),
    }),
  },
};

export default resolverMerge(resolver, baseFeatures);
