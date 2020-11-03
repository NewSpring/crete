import { Feature } from '@apollosproject/data-connector-rock';
import { resolverMerge } from '@apollosproject/server-core';

const resolver = {
  CardListItem: {
    labelText: ({ subtitle }) => subtitle.split(' - ').pop(),
  },
};

export default resolverMerge(resolver, Feature);
