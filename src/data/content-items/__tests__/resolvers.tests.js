import { graphql } from 'graphql';
import { fetch } from 'apollo-server-env';

import { createGlobalId } from '@apollosproject/server-core';
import { createTestHelpers } from '@apollosproject/server-core/lib/testUtils';

import {
  featuresSchema,
  mediaSchema,
  themeSchema,
  scriptureSchema,
  liveSchema,
  peopleSchema,
} from '@apollosproject/data-schema';

import { ContentChannel, Sharable } from '@apollosproject/data-connector-rock';

import * as ContentItem from '../index';

class Cache {
  get = () => Promise.resolve(null);

  set = () => Promise.resolve(null);

  initialize({ context }) {
    this.context = context;
  }
}

const { getSchema, getContext } = createTestHelpers({
  ContentChannel,
  ContentItem,
  Sharable,
  Cache: { dataSource: Cache },
});

const contentItemFragment = `
  fragment ContentItemFragment on ContentItem {
    id
    __typename
    title
    summary
    coverImage {
      name
      key
      sources {
        uri
      }
    }
    images {
      __typename # Typenames here to increase test coverage
      name
      key
      sources {
        __typename
        uri
      }
    }
    videos {
      __typename
      name
      key
      sources {
        __typename
        uri
      }
      embedHtml
    }
    audios {
      __typename
      name
      key
      sources {
        __typename
        uri
      }
    }
    htmlContent
    childContentItemsConnection {
      edges {
        node {
          id
          __typename
        }
        cursor
      }
      pageInfo {
        startCursor
        endCursor
      }
    }
    parentChannel {
      id
      __typename
    }
    sharing {
      __typename
      url
      title
      message
    }
  }
`;

describe('UniversalContentItem', () => {
  let schema;
  let context;
  beforeEach(() => {
    fetch.resetMocks();
    fetch.mockRockDataSourceAPI();
    schema = getSchema([
      featuresSchema,
      themeSchema,
      mediaSchema,
      scriptureSchema,
      liveSchema,
      peopleSchema,
    ]);
    context = getContext();
    context.dataSources.ContentItem.getShareUrl = jest.fn(
      () => 'https://newspring.cc/whatever'
    );
    context.dataSources.ContentItem.getCommunicators = jest.fn(() => [
      {
        firstName: 'first',
        lastName: 'last',
      },
    ]);
    context.dataSources.ContentItem.getGuestCommunicators = jest.fn(() => [
      'guest communicator',
    ]);
    context.dataSources.ContentItem.getContentItemScriptures = jest.fn(() => [
      {
        html: '<p><i>1</i>In the beginning...</p>',
      },
    ]);
  });

  it('gets a newspring content item', async () => {
    const query = `
      query {
        node(id: "${createGlobalId(1, 'UniversalContentItem')}") {
          ...ContentItemFragment
        }
      }
      ${contentItemFragment}
    `;

    const rootValue = {};
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });

  it('gets a newspring MediaContentItem item', async () => {
    const query = `
      query {
        node(id: "${createGlobalId(1, 'MediaContentItem')}") {
          ...ContentItemFragment
        }
      }
      ${contentItemFragment}
    `;
    const rootValue = {};
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });

  it('gets a newspring ContentSeriesContentItem item', async () => {
    const query = `
      query {
        node(id: "${createGlobalId(1, 'ContentSeriesContentItem')}") {
          ...ContentItemFragment
        }
      }
      ${contentItemFragment}
    `;
    const rootValue = {};
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });

  it('gets a newspring devotional item', async () => {
    const query = `
      query {
        node(id: "${createGlobalId(123, 'DevotionalContentItem')}") {
          id
          ... on DevotionalContentItem {
            id
            title
            scriptures {
              html
            }
          }
        }
      }
    `;
    const rootValue = {};
    const result = await graphql(schema, query, rootValue, context);
    expect(result).toMatchSnapshot();
  });

  it('gets a newspring weekend content item', async () => {
    const query = `
      query {
        node(id: "${createGlobalId(1, 'WeekendContentItem')}") {
          id
          ... on WeekendContentItem {
            title
            communicators {
              firstName
              lastName
            }
            guestCommunicators
            sermonDate
            features {
              __typename
              id
              ... on ScriptureFeature {
                scriptures {
                  reference
                }
              }
              ... on TextFeature {
                body
              }
            }
          }
        }
      }
    `;
    const rootValue = {};
    const result = await graphql(schema, query, rootValue, context);
    console.log('result = ', result);
    expect(result).toMatchSnapshot();
  });
});
