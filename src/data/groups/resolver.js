import { Group as baseGroup } from '@apollosproject/data-connector-rock';
import { resolverMerge } from '@apollosproject/server-core';

const resolver = {
  Person: {
    testGroups: ({ id: personID }, args, { dataSources: { Group } }) =>
      Group.getTestGroups(personID),
    isInReadMyBible: ({ id: personId }, args, { dataSources: { Group } }) =>
      Group.getForReadMyBible(personId),
  },
};
export default resolverMerge(resolver, baseGroup);
