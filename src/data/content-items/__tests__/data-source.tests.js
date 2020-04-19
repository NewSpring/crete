import ContentDataSource from '../data-source';

describe('ContentItem data sources', () => {
  let ContentItem;
  beforeEach(() => {
    ContentItem = new ContentDataSource();
    ContentItem.context = { dataSources: {} };
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
      getScriptures: () => [{ ref: 'GEN.1.1' }],
    };
    expect(
      await ContentItem.getSermonNotes({ value: '235234-234234-234243' })
    ).toMatchSnapshot();
  });
});
