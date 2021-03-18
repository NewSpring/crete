import { Group as baseGroup } from '@apollosproject/data-connector-rock';
import { resolverMerge } from '@apollosproject/server-core';

const resolver = {
  Person: {
    testGroups: ({ originId }, args, { dataSources: { Group } }) =>
      Group.getTestGroups(originId),
    isInReadMyBible: ({ originId }, args, { dataSources: { Group } }) =>
      Group.getForReadMyBible(originId),
  },
};
export default resolverMerge(resolver, baseGroup);
