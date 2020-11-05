import ApollosConfig from '@apollosproject/config';
import { dataSource as FeatureDataSource } from '../index';
import { dataSource as FeedDataSource } from '../../feature-feed';

ApollosConfig.loadJs({
  HOME_FEATURES: [
    {
      title: 'Staff news',
      algorithms: [{ type: 'STAFF_NEWS' }],
      type: 'ActionList',
    },
    {
      title: 'Events',
      algorithms: [{ type: 'UPCOMING_EVENTS' }],
      type: 'ActionList',
    },
  ],
});

describe('Feature data sources', () => {
  let Feature;
  let FeatureFeed;
  beforeEach(() => {
    Feature = new FeatureDataSource();
    FeatureFeed = new FeedDataSource();
    FeatureFeed.context = { dataSources: {} };
    FeatureFeed.context.dataSources = {
      Auth: { getCurrentPerson: () => ({ id: 1 }) },
      Person: { isStaff: () => true },
      Group: {
        getTestGroups: () => [{ id: 1, name: 'Experimental Features' }],
      },
    };
    Feature.context = { dataSources: { FeatureFeed } };
  });
  it('gets available features', async () => {
    expect(await Feature.getHomeFeedFeatures()).toMatchSnapshot();
  });
  it('gets available as non-staff', async () => {
    FeatureFeed.context.dataSources.Person.isStaff = () => false;
    expect(await Feature.getHomeFeedFeatures()).toMatchSnapshot();
  });
});
