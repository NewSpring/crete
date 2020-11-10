import ApollosConfig from '@apollosproject/config';
import { dataSource as FeatureDataSource } from '../index';
import { dataSource as FeedDataSource } from '../../feature-feed';
import { dataSource as ActionAlgorithm } from '../../action-algorithm';

async function expandResult(result) {
  let expandedResult = { ...result };
  if (result.cards && typeof result.cards === 'function') {
    expandedResult = { ...expandedResult, cards: await result.cards() };
  }
  if (result.actions && typeof result.actions === 'function') {
    expandedResult = { ...expandedResult, actions: await result.actions() };
  }
  if (result.heroCard && typeof result.heroCard === 'function') {
    expandedResult = { ...expandedResult, heroCard: await result.heroCard() };
  }
  if (result.prayers && typeof result.prayers === 'function') {
    expandedResult = { ...expandedResult, prayers: await result.prayers() };
  }

  return expandedResult;
}

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
  const getCursorByParentContentItemId = jest.fn(() => ({
    orderBy: () => ({
      top: () => ({
        expand: () => ({
          get: () => [
            {
              id: 1,
              title: 'first item',
              contentChannel: { name: 'content channel' },
            },
            {
              id: 2,
              title: 'second item',
              contentChannel: { name: 'content channel' },
            },
            {
              id: 3,
              title: 'third item',
              contentChannel: { name: 'content channel' },
            },
          ],
        }),
      }),
    }),
  }));
  const byContentChannelIds = jest.fn(() => ({
    get: () => [
      {
        id: 1,
        title: 'first item',
        contentChannel: { name: 'content channel' },
      },
      {
        id: 2,
        title: 'second item',
        contentChannel: { name: 'content channel' },
      },
      {
        id: 3,
        title: 'third item',
        contentChannel: { name: 'content channel' },
      },
    ],
  }));
  let context;
  beforeEach(() => {
    const ActionAlgo = new ActionAlgorithm();
    Feature = new FeatureDataSource();
    FeatureFeed = new FeedDataSource();
    context = { dataSources: {} };
    context.dataSources = {
      Auth: { getCurrentPerson: () => ({ id: 1 }) },
      ActionAlgorithm: ActionAlgo,
      Feature,
      Person: { isStaff: () => true },
      Group: {
        getTestGroups: () => [{ id: 1, name: 'Experimental Features' }],
      },
      FeatureFeed,
      ContentItem: {
        getCursorByParentContentItemId,
        byContentChannelIds,
        resolveType: () => 'UniversalContentItem',
        getCoverImage: () => null,
        createSummary: () => 'some summary',
      },
    };
    context.dataSources.ActionAlgorithm.initialize({ context });
    context.dataSources.Feature.initialize({ context });
    context.dataSources.FeatureFeed.initialize({ context });
  });
  it('gets available features', async () => {
    expect(await Feature.getHomeFeedFeatures()).toMatchSnapshot();
  });
  it('gets available as non-staff', async () => {
    FeatureFeed.context.dataSources.Person.isStaff = () => false;
    expect(await Feature.getHomeFeedFeatures()).toMatchSnapshot();
  });
  it('should create an ActionListFeature from a CAMPAIGN_ITEMS algorithm', async () => {
    const result = await Feature.createActionListFeature({
      algorithms: [
        {
          type: 'CAMPAIGN_ITEMS',
        },
      ],
      title: 'Test Featured Item',
      subtitle: "It's featured!",
    });

    expect(await expandResult(result)).toMatchSnapshot();
    expect(
      context.dataSources.ContentItem.getCursorByParentContentItemId.mock.calls
    ).toMatchSnapshot();
    expect(
      context.dataSources.ContentItem.byContentChannelIds.mock.calls
    ).toMatchSnapshot();
  });
});
