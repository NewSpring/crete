import PrayerDataSource from '../data-source';
import {
  threeSortedPrayers,
  threeUnsortedPrayers,
  menuCategories,
} from '../../mocks/prayer';

describe('PrayerRequest data sources', () => {
  let Prayer;
  beforeEach(() => {
    Prayer = new PrayerDataSource();
    Prayer.context = { dataSources: {} };
  });
  it('sorts prayers by count and date', () => {
    expect(threeSortedPrayers).toEqual(
      Prayer.sortPrayers(threeUnsortedPrayers)
    );
  });
  it('gets prayer menu categories', async () => {
    Prayer.request = () => ({
      filter: () => ({
        orderBy: () => ({
          get: jest.fn(() => menuCategories),
        }),
      }),
    });
    Prayer.context.dataSources.Auth = {
      getCurrentPerson: () => ({ id: 'Person123' }),
    };
    Prayer.context.dataSources.Campus = {
      getForPerson: () => ({ name: 'Web' }),
    };
    expect(await Prayer.getPrayerMenuCategories()).toMatchSnapshot();

    Prayer.context.dataSources.Campus = {
      getForPerson: () => ({ name: 'Greenville' }),
    };
    expect(await Prayer.getPrayerMenuCategories()).toMatchSnapshot();
  });
  it('gets an empty list of saved prayers', async () => {
    Prayer.context.dataSources.Followings = {
      getFollowingsForCurrentUser: () => ({ get: () => [] }),
    };
    const cursor = await Prayer.bySaved();
    expect(await cursor.get()).toMatchSnapshot();
    expect(await cursor.count()).toMatchSnapshot();
  });
  it('answers a prayer', async () => {
    Prayer.patch = () => null;
    Prayer.getFromId = () => ({ id: 1, answer: 'answer' });
    expect(await Prayer.answer(1, 'answer')).toMatchSnapshot();
  });
  it('removes a prayer answer', async () => {
    Prayer.patch = () => null;
    Prayer.getFromId = () => ({ id: 1, answer: '' });
    expect(await Prayer.answer(1, null)).toMatchSnapshot();
  });
  it('creates an initial prayer interaction', async () => {
    Prayer.context.dataSources.Auth = {
      getCurrentPerson: () => ({ id: 'Person123' }),
    };
    Prayer.post = () => '';
    Prayer.fetch = () => jest.fn();
    Prayer.getInteractionComponent = () => ({ id: 1 });
    expect(await Prayer.createInteraction(123456)).toMatchSnapshot();
  });
  it('creates a prayer interaction', async () => {
    Prayer.context.dataSources.Auth = {
      getCurrentPerson: () => ({ id: 'Person123' }),
    };
    Prayer.post = () => '12-31-2019 01:01:01AM';
    Prayer.fetch = () => jest.fn();
    Prayer.getInteractionComponent = () => ({ id: 1 });
    expect(await Prayer.createInteraction(123456)).toMatchSnapshot();
  });
});
