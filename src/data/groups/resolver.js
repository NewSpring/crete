import { Group as baseGroup } from '@apollosproject/data-connector-rock';
import { resolverMerge } from '@apollosproject/server-core';

const resolver = {
  Person: {
    featureGroups: ({ id: personID }, args, { dataSources: { Group } }) =>
      Group.getFeatureGroups(personID),
  },
};
export default resolverMerge(resolver, baseGroup);
