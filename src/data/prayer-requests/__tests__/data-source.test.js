import PrayerDataSource from '../data-source';
import { threeSortedPrayers, threeUnsortedPrayers } from '../../mocks/prayer';

describe('PrayerRequest data sources', () => {
  let Prayer;
  beforeEach(() => {
    Prayer = new PrayerDataSource();
  });
  it('sorts prayers by count and date', () => {
    expect(threeSortedPrayers).toEqual(
      Prayer.sortPrayers(threeUnsortedPrayers)
    );
  });
});
