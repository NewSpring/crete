import { Campus as originalCampus } from '@apollosproject/data-connector-rock';
import { resolverMerge } from '@apollosproject/server-core';
import { createAssetUrl } from '../utils';

const resolver = {
  Query: {
    campuses: (root, { location }, { dataSources }) =>
      dataSources.Campus.getPublicByLocation(location),
  },
  Campus: {
    image: ({ location }) =>
      location.image
        ? {
            uri: createAssetUrl(location.image),
          }
        : null,
  },
};

export default resolverMerge(resolver, originalCampus);
