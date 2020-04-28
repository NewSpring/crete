import personMock from '../../mocks/person';
import notesMock from '../../mocks/notes';
import ContentDataSource from '../data-source';

describe('ContentItem data sources', () => {
  let ContentItem;
  beforeEach(() => {
    ContentItem = new ContentDataSource();
    ContentItem.context = {
      dataSources: {
        Auth: { getCurrentPerson: () => personMock },
      },
    };
  });
  it('gets sermon notes', async () => {
    ContentItem.context.dataSources.MatrixItem = {
      getItemsFromGuid: () => [
        {
          id: 1,
          attributeValues: {
            noteType: { value: 'header' },
            text: { value: '1. this is point one' },
            book: { value: '' },
            reference: { value: '' },
            translation: { value: '' },
            addNoteField: { value: 'False' },
          },
        },
        {
          id: 2,
          attributeValues: {
            noteType: { value: 'text' },
            text: { value: 'this is a subpoint' },
            book: { value: '' },
            reference: { value: '' },
            translation: { value: '' },
            addNoteField: { value: 'True' },
          },
        },
        {
          id: 3,
          attributeValues: {
            noteType: { value: 'scripture' },
            text: { value: '' },
            book: { value: '1234-234-234' },
            reference: { value: '3:5-6' },
            translation: { value: '23423-23423-23423' },
            addNoteField: { value: 'True' },
          },
        },
      ],
    };
    ContentItem.request = () => ({
      filter: () => ({ first: () => 'Genesis OR NIV' }),
    });
    ContentItem.context.dataSources.Scripture = {
      getScriptures: () => [
        { content: '<p>verse<p>', reference: 'Genesis 1:1' },
      ],
    };
    ContentItem.getSermonNoteComments = () => ({
      'TextNote:559b23fd0aa90e81b1c023e72e230fa1': {
        id: 'Note:123',
        text: 'custom note comment',
      },
    });
    expect(
      await ContentItem.getSermonNotes(1, { value: '235234-234234-234243' })
    ).toMatchSnapshot();
  });
});
