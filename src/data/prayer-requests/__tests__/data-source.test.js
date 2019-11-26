import { dataSource as PrayerRequestDataSource } from '../index';

describe('PrayerRequest data sources', () => {
  it('sorts prayers by count and date', () => {
    const dataSource = new PrayerRequestDataSource();
    const originalData = [
      {
        text: 'prayer1',
        prayerCount: 2,
        createdDateTime: '2019-05-30T09:41:44.607',
      },
      {
        text: 'prayer2',
        prayerCount: 2,
        createdDateTime: '2019-05-29T09:41:44.607',
      },
      {
        text: 'prayer3',
        prayerCount: 1,
        createdDateTime: '2019-05-30T09:41:44.607',
      },
    ];
    const sortedData = [
      {
        text: 'prayer3',
        prayerCount: 1,
        createdDateTime: '2019-05-30T09:41:44.607',
      },
      {
        text: 'prayer2',
        prayerCount: 2,
        createdDateTime: '2019-05-29T09:41:44.607',
      },
      {
        text: 'prayer1',
        prayerCount: 2,
        createdDateTime: '2019-05-30T09:41:44.607',
      },
    ];
    expect(sortedData).toEqual(dataSource.sortPrayers(originalData));
  });
});
