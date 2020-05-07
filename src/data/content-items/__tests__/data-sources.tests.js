import ContentItem from '../data-source';

describe('the ContentItem data source', () => {
  it('gets scripture references', async () => {
    const dataSource = new ContentItem();
    dataSource.context = {
      dataSources: {
        Scripture: { getScriptures: jest.fn(() => null) },
        MatrixItem: {
          getItemsFromGuid: () =>
            Promise.resolve([
              {
                attributeValues: {
                  book: { value: 'JOHN' },
                  reference: { value: '10:10' },
                },
              },
              {
                attributeValues: {
                  book: { value: 'JOHN' },
                  reference: { value: '1:1' },
                },
              },
            ]),
        },
      },
    };
    dataSource.request = () => ({
      filter: () => ({
        first: () => Promise.resolve({ value: 'John' }),
      }),
    });
    await dataSource.getContentItemScriptures({
      value: 'FAKEGUID123',
    });
    expect(
      dataSource.context.dataSources.Scripture.getScriptures.mock.calls
    ).toMatchSnapshot();
  });
});
