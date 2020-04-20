import { fetch } from 'apollo-server-env';
import ApollosConfig from '@apollosproject/config';
import { dataSource as RockConstants } from '../index';
import { buildGetMock } from '../test-utils';

ApollosConfig.loadJs({
  ROCK_MAPPINGS: {
    INTERACTIONS: {
      CHANNEL_NAME: 'Apollos App',
      COMPONENT_NAME: 'Apollos Content Item',
      CHANNEL_MEDIUM_TYPE_ID: 512,
    },
    ENTITY_TYPES: {
      ApollosGroup: 'Group',
    },
  },
});

describe('RockConstants', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });
  it("creates a content item Component if it doesn't exist", async () => {
    const dataSource = new RockConstants();
    dataSource.modelType = buildGetMock(
      { id: 101, friendlyName: 'Content Channel Item' },
      dataSource
    );
    dataSource.get = buildGetMock([[], { Id: 1 }], dataSource);
    dataSource.post = buildGetMock('1', dataSource);
    const result = await dataSource.contentItemInteractionComponent({
      contentItemId: 7,
      contentTitle: 'Some Title',
    });
    expect(result).toMatchSnapshot();
    expect(dataSource.modelType.mock.calls).toMatchSnapshot();
    expect(dataSource.get.mock.calls).toMatchSnapshot();
    expect(dataSource.post.mock.calls).toMatchSnapshot();
  });
  it('finds the content item Component if it exists', async () => {
    const dataSource = new RockConstants();
    dataSource.get = buildGetMock([{ Id: 1 }], dataSource);
    dataSource.post = jest.fn();
    dataSource.modelType = buildGetMock(
      { id: 101, friendlyName: 'Content Channel Item' },
      dataSource
    );
    const result = await dataSource.contentItemInteractionComponent({
      contentItemId: 7,
      contentTitle: 'Some Title',
    });
    expect(result).toMatchSnapshot();
    expect(dataSource.get.mock.calls).toMatchSnapshot();
    expect(dataSource.post.mock.calls.length).toBe(0);
  });
});
