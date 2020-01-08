import { graphql } from 'graphql';
import { createTestHelpers } from '@apollosproject/server-core/lib/testUtils';
import { Group, Auth } from '@apollosproject/data-connector-rock';
import * as Person from '../index';
import oneRockPerson from '../../mocks/person';

const { getSchema, getContext } = createTestHelpers({ Person, Group, Auth });

describe('Person resolver', () => {
  const context = getContext();
  context.dataSources.Person.isStaff = () => true;
  context.dataSources.Group.getByPerson = () => [{ id: 1, name: 'Group1' }];
  context.dataSources.Auth.getCurrentPerson = () =>
    Promise.resolve(oneRockPerson);
  const schema = getSchema();

  it('gets a person', async () => {
    const query = `
      {
        currentUser {
          profile {
            id
            isGroupLeader
            isStaff
            photo {
              uri
            }
          }
        }
      }
    `;
    const result = await graphql(schema, query, {}, context);
    expect(result).toMatchSnapshot();
  });
});
