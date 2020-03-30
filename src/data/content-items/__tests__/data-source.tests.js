import personMock from '../../mocks/person';
import notesMock from '../../mocks/notes';
import ContentItem from '../data-source';

describe('Content data source', () => {
  let DataSource;
  beforeEach(() => {
    DataSource = new ContentItem();
    DataSource.context = {
      dataSources: {
        Auth: { getCurrentPerson: () => personMock },
      },
    };
  });
  it('gets sermon notes', async () => {
    DataSource.request = () => ({
      filter: () => ({ get: () => notesMock }),
    });
    expect(await DataSource.getUserSermonNotes()).toMatchSnapshot();
  });
});
