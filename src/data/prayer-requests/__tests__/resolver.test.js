import { graphql } from 'graphql';
import { createTestHelpers } from '@apollosproject/server-core/lib/testUtils';
import { Followings } from '@apollosproject/data-connector-rock';
import {
  contentItemSchema,
  contentChannelSchema,
  themeSchema,
  scriptureSchema,
} from '@apollosproject/data-schema';

import * as PrayerRequest from '../index';
import * as Person from '../../people';
import * as Campus from '../../campuses';

import oneRockPrayer, { twoRockPrayers } from '../../mocks/prayer';
import oneRockPerson from '../../mocks/person';
import oneRockCampus from '../../mocks/campus';

// define here any classes with dataSource functions you need to overwrite
const { getSchema, getContext } = createTestHelpers({
  PrayerRequest,
  Person,
  Campus,
  Followings,
});

describe('PrayerRequest resolver', () => {
  let schema;
  let context;
  let rootValue;
  beforeEach(() => {
    // any extra schemas necessary
    schema = getSchema([
      contentItemSchema,
      contentChannelSchema,
      themeSchema,
      scriptureSchema,
    ]);
    context = getContext();
    rootValue = {};
  });

  it('gets all public prayer requests', async () => {
    const query = `
      query {
        prayers {
          id
          text
          campus {
            id
            name
          }
          startTime
          flagCount
          prayerCount
          isAnonymous
          isSaved
          requestor {
            id
            firstName
            lastName
          }
          person {
            id
          }
        }
      }
    `;

    context.dataSources.PrayerRequest.getPrayers = jest.fn(() =>
      Promise.resolve(twoRockPrayers)
    );
    context.dataSources.Campus.getFromId = jest.fn(() =>
      Promise.resolve(oneRockCampus)
    );
    context.dataSources.Person.getFromAliasId = jest.fn(() =>
      Promise.resolve(oneRockPerson)
    );
    context.dataSources.Followings.getFollowingsForCurrentUserAndNode = jest.fn(
      () => Promise.resolve([{ text: 'fake prayer' }])
    );
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });

  it('gets all public prayer requests by campus', async () => {
    const query = `
      query {
        campusPrayers {
          id
          text
          campus {
            id
            name
          }
        }
      }
    `;
    context.dataSources.PrayerRequest.getPrayers = jest.fn(() =>
      Promise.resolve(twoRockPrayers)
    );
    context.dataSources.Campus.getFromId = jest.fn(() =>
      Promise.resolve(oneRockCampus)
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

    context.dataSources.PrayerRequest.getPrayers = jest.fn(() =>
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
          text
        }
      }
    `;

    context.dataSources.PrayerRequest.getPrayers = jest.fn(() =>
      Promise.resolve(twoRockPrayers)
    );
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });
  it('gets all saved prayers', async () => {
    const query = `
      query {
        savedPrayers {
          id
          text
        }
      }
    `;

    context.dataSources.PrayerRequest.getPrayers = jest.fn(() =>
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
  it('deletes a prayer', async () => {
    const query = `
      mutation {
        deletePrayer(
          nodeId: "PrayerRequest:b36e55d803443431e96bb4b5068147ec"
        ) {
          id
          text
        }
      }
    `;
    context.dataSources.PrayerRequest.delete = jest.fn(() =>
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
          text
        }
      }
    `;
    context.dataSources.PrayerRequest.createInteraction = jest.fn(() => null);
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
  it('saves a prayer', async () => {
    const query = `
      mutation {
        savePrayer(nodeId: "PrayerRequest:b36e55d803443431e96bb4b5068147ec") {
          id
          text
        }
      }
    `;
    context.dataSources.Followings.followNode = jest.fn(() => null);
    context.models.Node.get = jest.fn(() => Promise.resolve(oneRockPrayer));
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });
  it('unsaves a prayer', async () => {
    const query = `
      mutation {
        unSavePrayer(nodeId: "PrayerRequest:b36e55d803443431e96bb4b5068147ec") {
          id
          text
        }
      }
    `;
    context.dataSources.Followings.unFollowNode = jest.fn(() => null);
    context.models.Node.get = jest.fn(() => Promise.resolve(oneRockPrayer));
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });
});
