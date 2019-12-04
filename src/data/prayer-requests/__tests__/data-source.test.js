import { dataSource as Prayer } from '../index';
import { threeSortedPrayers, threeUnsortedPrayers } from '../../mocks/prayer';

describe('PrayerRequest data sources', () => {
  it('sorts prayers by count and date', () => {
    const dataSource = new Prayer();
    expect(threeSortedPrayers).toEqual(
      dataSource.sortPrayers(threeUnsortedPrayers)
    );
  });
});
