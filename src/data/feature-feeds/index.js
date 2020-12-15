import { FeatureFeed } from '@apollosproject/data-connector-rock';

const { resolver: coreResolver, dataSource } = FeatureFeed;

const resolver = {
  ...coreResolver,
  Query: {
    ...coreResolver.Query,
    readFeedFeatures: (root, args, { dataSources }) =>
      dataSources.FeatureFeed.getFeed({
        type: 'apollosConfig',
        args: { section: 'READ_TAB', ...args },
      }),
  },
};
export { dataSource, resolver };
