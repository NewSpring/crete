import ApollosConfig from '@apollosproject/config';
import { dataSource as FeatureDataSource } from '../index';

ApollosConfig.loadJs({
  HOME_FEATURES: [
    {
      title: 'Staff news',
      algorithms: [{ type: 'STAFF_NEWS' }],
    },
    { title: 'Events', algorithms: [{ type: 'UPCOMING_EVENTS' }] },
  ],
});

describe('Feature data sources', () => {
  let Feature;
  beforeEach(() => {
    Feature = new FeatureDataSource();
    // Feature.createActionListFeature = () => null;
    Feature.context = { dataSources: {} };
    Feature.context.dataSources = {
      Auth: { getCurrentPerson: () => ({ id: 1 }) },
      Person: { isStaff: () => true },
      Group: {
        getTestGroups: () => [{ id: 1, name: 'Experimental Features' }],
      },
    };
  });
  it('gets available features', async () => {
    expect(await Feature.getHomeFeedFeatures()).toMatchSnapshot();
  });
});
