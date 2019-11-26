import { graphql } from 'graphql';
import { fetch } from 'apollo-server-env';
import { createTestHelpers } from '@apollosproject/server-core/lib/testUtils';

import { peopleSchema, campusSchema } from '@apollosproject/data-schema';
import * as PrayerRequest from '../index';

import prayerRequestSchema from '../schema';
import authMock from '../../authMock';
import campusMock from '../../campusMock';

const { getSchema, getContext } = createTestHelpers({
  PrayerRequest,
  Auth: { dataSource: authMock },
  Person: { dataSource: authMock },
  Campus: { dataSource: campusMock },
});

const currentPersonResMock = jest.fn(() =>
  Promise.resolve({
    id: 1,
    firstName: 'Isaac',
    lastName: 'Hardy',
  })
);

const onePrayerResMock = jest.fn(() =>
  Promise.resolve({
    id: 'PrayerRequest:b36e55d803443431e96bb4b5068147ec',
    firstName: 'Isaac',
    lastName: 'Hardy',
    text: 'Pray this works.',
    requestedByPersonAliasId: 447217,
    campusId: 16,
    categoryId: 2,
    flagCount: 0,
    prayerCount: 4,
    attributeValues: {
      isAnonymous: {
        value: 'True',
      },
    },
  })
);

const twoPrayerResMock = jest.fn(() =>
  Promise.resolve([
    {
      id: 'PrayerRequest:b36e55d803443431e96bb4b5068147ec',
      firstName: 'Isaac',
      lastName: 'Hardy',
      text: 'Pray this works.',
      requestedByPersonAliasId: 447217,
      enteredDateTime: '2019-07-02T13:08:02.035',
      campusId: 16,
      categoryId: 2,
      flagCount: 0,
      prayerCount: 4,
      attributeValues: {
        isAnonymous: {
          value: 'True',
        },
      },
    },
    {
      id: 'PrayerRequest:57c465ee3cd69524d729569b338607de',
      firstName: 'Rich',
      lastName: 'Dubee',
      text: 'Help me',
      requestedByPersonAliasId: 447217,
      enteredDateTime: '2019-07-03T13:08:02.035',
      campusId: 16,
      categoryId: 2,
      flagCount: 0,
      prayerCount: 4,
      attributeValues: {
        isAnonymous: {
          value: 'True',
        },
      },
    },
  ])
);
describe('PrayerRequest resolver', () => {
  let schema;
  let context;
  let rootValue;
  beforeEach(() => {
    fetch.resetMocks();
    fetch.mockRockDataSourceAPI();
    schema = getSchema([prayerRequestSchema, peopleSchema, campusSchema]);
    context = getContext();
    context.dataSources.Person.getFromAliasId = currentPersonResMock;
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

    context.dataSources.PrayerRequest.getAll = twoPrayerResMock;
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
    context.dataSources.PrayerRequest.getAllByCampus = twoPrayerResMock;
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

    context.dataSources.PrayerRequest.getFromCurrentPerson = twoPrayerResMock;
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

    context.dataSources.PrayerRequest.getFromGroups = twoPrayerResMock;
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });

  it('creates a new prayer', async () => {
    const query = `
      mutation {
        addPrayer(
          firstName: "Test"
          lastName: "Bro"
          text: "Jesus Rocks"
          campusId: "Campus:4f68015ba18662a7409d1219a4ce013e"
          categoryId: 1
          isAnonymous: true
        ) {
          id
          firstName
          text
        }
      }
    `;
    context.dataSources.PrayerRequest.add = onePrayerResMock;
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
    context.dataSources.PrayerRequest.incrementPrayed = onePrayerResMock;
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
    context.dataSources.PrayerRequest.flag = onePrayerResMock;
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });
});
