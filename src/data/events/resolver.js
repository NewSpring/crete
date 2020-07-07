import { Event as baseEvent } from '@apollosproject/data-connector-rock';
import { resolverMerge } from '@apollosproject/server-core';

const resolver = {
  Event: {
    image: ({ eventItemId }, args, { dataSources: { Event } }) =>
      Event.getImage(eventItemId),
  },
};
export default resolverMerge(resolver, baseEvent);
