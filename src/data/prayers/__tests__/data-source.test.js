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
});
