import { graphql } from 'graphql';
import { createTestHelpers } from '@apollosproject/server-core/lib/testUtils';
import { peopleSchema } from '@apollosproject/data-schema';
import * as Campus from '../index';

const { getSchema, getContext } = createTestHelpers({ Campus });

describe('Campus', () => {
  const context = getContext();
  context.dataSources.Campus.getPublicByLocation = jest.fn(() =>
    Promise.resolve([
      { location: { image: { path: 'https://fake-image-url.com' } } },
    ])
  );
  const schema = getSchema([peopleSchema]);
  it('gets campuses', async () => {
    const query = `
      query {
        campuses {
          image {
            uri
          }
        }
      }
    `;
    const result = await graphql(schema, query, {}, context);
    expect(result).toMatchSnapshot();
  });
});
