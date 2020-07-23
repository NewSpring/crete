import ApollosConfig from '@apollosproject/config';
import { dataSource as EventDataSource } from '../index';

ApollosConfig.loadJs({
  ROCK_MAPPINGS: {
    PUBLIC_CALENDAR_ID: 1,
  },
});

describe('Event data sources', () => {
  let Event;
  beforeEach(() => {
    Event = new EventDataSource();
    Event.context = { dataSources: {} };
    Event.context.dataSources = {
      ContentItem: {
        getCoverImage: () => ({
          __typename: 'ImageMedia',
          key: 'coverImage',
          name: 'Cover Image',
          sources: [{ uri: 'https://fakeimages.com/?coolpic1' }],
        }),
      },
    };
  });
  it('gets an event image', async () => {
    Event.request = () => ({
      cache: () => ({
        filter: () => ({
          andFilter: () => ({
            first: () => ({
              id: 1,
              name: 'some event',
              attributeValues: { coverImage: { value: 'image1' } },
            }),
          }),
        }),
      }),
    });
    expect(await Event.getImage({ eventItemId: 1 })).toMatchSnapshot();
  });
  it('return null for the image with no attributes', async () => {
    Event.request = () => ({
      cache: () => ({
        filter: () => ({
          andFilter: () => ({
            first: () => ({
              id: 1,
              name: 'some event',
              attributeValues: {},
            }),
          }),
        }),
      }),
    });
    expect(await Event.getImage({ eventItemId: 1 })).toMatchSnapshot();
  });
});
