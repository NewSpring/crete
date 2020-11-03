import { createGlobalId, resolverMerge } from '@apollosproject/server-core';
import ApollosConfig from '@apollosproject/config';
import { FeatureFeed } from '@apollosproject/data-connector-rock';

const resolverChanges = {
  Query: {
    homeFeedFeatures: (root, args, { dataSources }, info) => {
      info.cacheControl.setCacheHint({ maxAge: 0 });
      return dataSources.FeatureFeed.getFeed({
        type: 'apollosConfig',
        args: { section: 'HOME_FEATURES', ...args },
      });
    },
  },
};

const resolver = resolverMerge(resolverChanges, FeatureFeed);
class dataSource extends FeatureFeed.dataSource {
  getFromId = (id) => this.getFeed(JSON.parse(id));

  getFilteredFeatures = async (args) => {
    const { Person, Auth, Group } = this.context.dataSources;
    const config = ApollosConfig[args.section] || [];

    const { id } = await Auth.getCurrentPerson();
    const isStaff = await Person.isStaff(id);
    const testGroups = await Group.getTestGroups(id);

    return config.filter((feature) => {
      // filter staff only features
      const isStaffFeature = feature.algorithms.filter(
        ({ type }) => type === 'STAFF_NEWS'
      ).length;
      if (isStaffFeature && !isStaff) return false;
      // filter experimental features
      const isExperimentalFeature = feature.algorithms.filter(
        ({ type }) => type === 'UPCOMING_EVENTS'
      ).length;
      const isTester = testGroups.filter(
        (group) => group.name === 'Experimental Features'
      ).length;
      if (isExperimentalFeature && !isTester) return false;
      return true;
    });
  };

  getFeed = async ({ type = '', args = {} }) => {
    let getFeatures = () => [];
    const { ContentItem, Feature } = this.context.dataSources;

    if (type === 'apollosConfig') {
      getFeatures = async () => {
        const features = await this.getFilteredFeatures(args);
        return Feature.getFeatures(features, args);
      };
    }

    if (type === 'contentItem' && args.id) {
      const contentItem = await ContentItem.getFromId(args.id);
      getFeatures = () => ContentItem.getFeatures(contentItem);
    }

    return {
      __typename: 'FeatureFeed',
      id: createGlobalId(JSON.stringify({ type, args }), 'FeatureFeed'),
      getFeatures,
    };
  };
}

export { resolver, dataSource };
