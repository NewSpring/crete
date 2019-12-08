import { graphql } from 'graphql';
import { createTestHelpers } from '@apollosproject/server-core/lib/testUtils';
import { Auth } from '@apollosproject/data-connector-rock';

import * as Person from '../index';

import oneRockPerson from '../../mocks/person';

// define here any classes with dataSource functions you need to overwrite
const { getSchema, getContext } = createTestHelpers({
  Person,
  Auth,
});

describe('the Person resolver', () => {
  let schema;
  let context;
  let rootValue;
  beforeEach(() => {
    // any extra schemas necessary
    schema = getSchema([]);
    context = getContext();
    rootValue = {};
  });

  it('gets a person', async () => {
    const query = `
      {
        currentUser {
          id
          profile {
            photo {
              uri
            }
          }
        }
      }
    `;
    context.dataSources.Auth.getCurrentPerson = () =>
      Promise.resolve(oneRockPerson);

    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });
});
