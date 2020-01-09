import ApollosConfig from '@apollosproject/config';
import GroupDataSource from '../data-source';

ApollosConfig.loadJs({
  ROCK_MAPPINGS: {
    SERVING_GROUP_TYPE_ID: 23,
    COMMUNITY_GROUP_TYPE_ID: 25,
    FAMILY_GROUP_TYPE_ID: 10,
    FUSE_GROUP_TYPE_ID: 60,
    RALLY_GROUP_TYPE_ID: 141,
    MENTORING_GROUP_TYPE_ID: 149,
  },
});

describe('Group data sources', () => {
  let Group;
  beforeEach(() => {
    Group = new GroupDataSource();
    Group.context = { dataSources: {} };
  });
  it('gets a map of group type IDs', () => {
    expect(Group.getGroupTypeIds()).toMatchSnapshot();
  });
});
