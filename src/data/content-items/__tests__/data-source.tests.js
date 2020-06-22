import ApollosConfig from '@apollosproject/config';
import personMock from '../../mocks/person';
import ContentDataSource from '../data-source';

ApollosConfig.loadJs({
  BIBLE_API: {
    BIBLE_ID: {
      ESV: 'f421fe261da7624f-01',
      NIV: '71c6eab17ae5b667-01',
      CSB: 'a556c5305ee15c3f-01',
      WEB: '9879dbb7cfe39e4d-01',
    },
  },
});

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
  it('gets scripture references', async () => {
    ContentItem.context = {
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
    ContentItem.request = () => ({
      filter: () => ({
        first: () => Promise.resolve({ value: 'John' }),
      }),
    });
    await ContentItem.getContentItemScriptures({
      value: 'FAKEGUID123',
    });
    expect(
      ContentItem.context.dataSources.Scripture.getScriptures.mock.calls
    ).toMatchSnapshot();
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
            allowsComment: { value: 'False' },
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
            allowsComment: { value: 'True' },
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
            allowsComment: { value: 'True' },
          },
        },
        {
          id: 4,
          attributeValues: {
            noteType: { value: 'scripture' },
            text: { value: '' },
            book: { value: 'John' },
            reference: { value: '3:16' },
            translation: { value: '' },
            allowsComment: { value: 'True' },
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
    ContentItem.getNotesComments = () => ({
      'TextNote:559b23fd0aa90e81b1c023e72e230fa1': {
        id: 'Note:123',
        text: 'custom note comment',
      },
    });
    expect(
      await ContentItem.getSermonNotes(1, { value: '235234-234234-234243' })
    ).toMatchSnapshot();
  });
  it('gets sermon notes comments', async () => {
    ContentItem.request = () => ({
      filter: () => ({
        andFilter: () => ({
          andFilter: () => ({
            get: () => [
              {
                id: 1,
                text:
                  '{"apollosBlockID": "NotesTextBlock:123", "text": "this is a comment"}',
              },
              {
                id: 2,
                text:
                  '{"apollosBlockID": "NotesScriptureBlock:123", "text": "this is another comment"}',
              },
            ],
          }),
        }),
      }),
    });
    expect(await ContentItem.getNotesComments(1)).toMatchSnapshot();
  });
});
