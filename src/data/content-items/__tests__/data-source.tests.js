import personMock from '../../mocks/person';
import notesMock from '../../mocks/notes';
import ContentItem from '../data-source';

describe('Content data source', () => {
  let ContentItemDataSource;
  beforeEach(() => {
    ContentItemDataSource = new ContentItem();
    ContentItemDataSource.context = {
      dataSources: { Auth: { getCurrentPerson: () => personMock } },
    };
  });
  it('gets sermon notes', () => {
    ContentItemDataSource.request = () => ({
      filter: jest.fn(() => ({ get: () => notesMock })),
    });
    expect(ContentItemDataSource.getUserSermonNotes()).toMatchSnapshot();
  });
});
