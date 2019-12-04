import { graphql } from 'graphql';
import { fetch } from 'apollo-server-env';
import { createTestHelpers } from '@apollosproject/server-core/lib/testUtils';

import { peopleSchema, campusSchema } from '@apollosproject/data-schema';
import * as PrayerRequest from '../index';

import prayerRequestSchema from '../schema';
import authMock from '../../authMock';
import campusMock from '../../campusMock';
import oneRockPrayer, { twoRockPrayers } from '../../mocks/prayer';
import oneRockPerson from '../../mocks/person';

const { getSchema, getContext } = createTestHelpers({
  PrayerRequest,
  Auth: { dataSource: authMock },
  Person: { dataSource: authMock },
  Campus: { dataSource: campusMock },
});

describe('PrayerRequest resolver', () => {
  let schema;
  let context;
  let rootValue;
  beforeEach(() => {
    fetch.resetMocks();
    fetch.mockRockDataSourceAPI();
    schema = getSchema([prayerRequestSchema, peopleSchema, campusSchema]);
    context = getContext();
    context.dataSources.Person.getFromAliasId = jest.fn(() =>
      Promise.resolve(oneRockPerson)
    );
    context.dataSources.PrayerRequest.createInteraction = jest.fn(() => null);
    rootValue = {};
  });

  it('gets all public prayer requests', async () => {
    const query = `
      query {
        prayers {
          id
          firstName
          lastName
          text
          requestedByPersonAliasId
          campus {
            id
            name
          }
          categoryId
          flagCount
          prayerCount
          isAnonymous
          person {
            id
            firstName
            lastName
          }
        }
      }
    `;

    context.dataSources.PrayerRequest.getAll = jest.fn(() =>
      Promise.resolve(twoRockPrayers)
    );
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });

  it('gets all public prayer requests by campus', async () => {
    const query = `
      query {
        campusPrayers {
          id
          firstName
          text
          campus {
            id
            name
          }
        }
      }
    `;
    context.dataSources.PrayerRequest.getAllByCampus = jest.fn(() =>
      Promise.resolve(twoRockPrayers)
    );
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });

  it('gets all prayers from current person', async () => {
    const query = `
      query {
        userPrayers {
          id
          firstName
          text
        }
      }
    `;

    context.dataSources.PrayerRequest.getFromCurrentPerson = jest.fn(() =>
      Promise.resolve(twoRockPrayers)
    );
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });

  it('gets all prayers from groups', async () => {
    const query = `
      query {
        groupPrayers {
          id
          firstName
          text
        }
      }
    `;

    context.dataSources.PrayerRequest.getFromGroups = jest.fn(() =>
      Promise.resolve(twoRockPrayers)
    );
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });

  it('creates a new prayer', async () => {
    const query = `
      mutation {
        addPrayer(
          text: "Jesus Rocks"
          isAnonymous: true
        ) {
          id
          firstName
          text
        }
      }
    `;
    context.dataSources.PrayerRequest.add = jest.fn(() =>
      Promise.resolve(oneRockPrayer)
    );
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });

  it('increments prayed for a request', async () => {
    const query = `
      mutation {
        incrementPrayerCount(
          nodeId: "PrayerRequest:b36e55d803443431e96bb4b5068147ec"
        ) {
          id
          firstName
          text
        }
      }
    `;
    context.dataSources.PrayerRequest.incrementPrayed = jest.fn(() =>
      Promise.resolve(oneRockPrayer)
    );
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });

  it('flags a prayer request', async () => {
    const query = `
      mutation {
        flagPrayer(nodeId: "PrayerRequest:b36e55d803443431e96bb4b5068147ec") {
          id
          firstName
          text
        }
      }
    `;
    context.dataSources.PrayerRequest.flag = jest.fn(() =>
      Promise.resolve(oneRockPrayer)
    );
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });
});
