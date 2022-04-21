import { Campus as originalCampus } from '@apollosproject/data-connector-rock';
import { resolverMerge } from '@apollosproject/server-core';
import { createAssetUrl } from '../utils';

const resolver = {
  Campus: {
    image: ({ location }) =>
      location.image
        ? {
            // this is custom, Newspring stores campus images in S3
            uri: createAssetUrl(location.image),
          }
        : null,
  },
};

export default resolverMerge(resolver, originalCampus);
