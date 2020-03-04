import { Group as baseGroup } from '@apollosproject/data-connector-rock';
import ApollosConfig from '@apollosproject/config';

const { ROCK_MAPPINGS } = ApollosConfig;

export default class Group extends baseGroup.dataSource {
  groupTypeMap = {
    Serving: ROCK_MAPPINGS.SERVING_GROUP_TYPE_ID,
    Community: ROCK_MAPPINGS.COMMUNITY_GROUP_TYPE_ID,
    Family: ROCK_MAPPINGS.FAMILY_GROUP_TYPE_ID,
    Fuse: ROCK_MAPPINGS.FUSE_GROUP_TYPE_ID,
    Rally: ROCK_MAPPINGS.RALLY_GROUP_TYPE_ID,
    Mentoring: ROCK_MAPPINGS.MENTORING_GROUP_TYPE_ID,
  };

  getGroupTypeIds = () => Object.values(this.groupTypeMap);

  getTestGroups = async (personID) => {
    // all possible test groups
    const testGroupFilters = ROCK_MAPPINGS.APP_TEST_GROUPS.map(
      (group) => `GroupId eq ${Object.values(group)[0]}`
    );
    // just the test groups that the person is in
    const associations = await this.request('GroupMembers')
      .filterOneOf(testGroupFilters)
      .andFilter(`PersonId eq ${personID}`)
      .get();
    if (!associations.length) return [];
    // assemble the OData filter
    const groupFilters = associations.map(({ groupId }) => `Id eq ${groupId}`);
    return this.request()
      .filterOneOf(groupFilters)
      .get();
  };
}
