import {
  createGlobalId,
  parseGlobalId,
  withEdgePagination,
} from '@apollosproject/server-core';
import { isNumber } from 'lodash';
import { createAssetUrl } from '../utils';

export default {
  Query: {
    // deprecated
    prayers: (root, { type }, { dataSources }) =>
      dataSources.Prayer.getPrayers(type),
    prayerFeed: (root, args, { dataSources }) =>
      dataSources.Prayer.paginate({
        cursor: dataSources.Prayer.byPrayerFeed(),
        args,
      }),
    prayerMenuCategories: (root, args, { dataSources }) =>
      dataSources.Prayer.getPrayerMenuCategories(),
    campusPrayers: (root, args, { dataSources }) =>
      dataSources.Prayer.getPrayers('CAMPUS'),
    userPrayers: (root, args, { dataSources }) =>
      dataSources.Prayer.getPrayers('USER'),
    groupPrayers: (root, args, { dataSources }) =>
      dataSources.Prayer.getPrayers('GROUP'),
    savedPrayers: (root, args, { dataSources }) =>
      dataSources.Prayer.getPrayers('SAVED'),
  },
  Mutation: {
    addPrayer: (root, args, { dataSources }) => dataSources.Prayer.add(args),
    deletePrayer: (root, { nodeId }, { dataSources }) =>
      dataSources.Prayer.deletePrayer(parseGlobalId(nodeId).id),
    incrementPrayerCount: async (root, { nodeId }, { dataSources }) => {
      const { id: prayerId } = parseGlobalId(nodeId);

      const prayer = await dataSources.Prayer.incrementPrayed(prayerId);

      // TODO: createInteraction needs to be way faster
      // does 10 data calls and sometimes it times out
      //
      // create the interaction to trigger a notification
      await dataSources.Prayer.createInteraction({
        prayerId,
      });

      return prayer;
    },
    flagPrayer: (root, { nodeId }, { dataSources }) => {
      const { id: parsedId } = parseGlobalId(nodeId);
      return dataSources.Prayer.flag(parsedId);
    },
    savePrayer: async (
      root,
      { nodeId },
      { dataSources, models: { Node } },
      info
    ) => {
      await dataSources.Followings.followNode({
        nodeId,
      });
      return Node.get(nodeId, dataSources, info);
    },
    unSavePrayer: async (
      root,
      { nodeId },
      { dataSources, models: { Node } },
      info
    ) => {
      await dataSources.Followings.unFollowNode({
        nodeId,
      });
      return Node.get(nodeId, dataSources, info);
    },
  },
  Prayer: {
    id: ({ id }, args, context, { parentType }) =>
      createGlobalId(id, parentType.name),
    startTime: ({ enteredDateTime }) => enteredDateTime,
    // deprecated
    campus: ({ campusId }, args, { dataSources }) =>
      isNumber(campusId) ? dataSources.Campus.getFromId(campusId) : null,
    isAnonymous: ({ isPublic }) => !isPublic,
    // deprecated
    person: ({ requestedByPersonAliasId }, args, { dataSources }) =>
      dataSources.Person.getFromAliasId(requestedByPersonAliasId),
    requestor: ({ requestedByPersonAliasId }, args, { dataSources }) =>
      dataSources.Person.getFromAliasId(requestedByPersonAliasId),
    flagCount: ({ flagCount }) =>
      (typeof flagCount === 'number' && flagCount) || 0,
    prayerCount: ({ prayerCount }) =>
      (typeof prayerCount === 'number' && prayerCount) || 0,
    isSaved: async ({ id }, args, { dataSources }) => {
      const followings = await dataSources.Followings.getFollowingsForCurrentUserAndNode(
        {
          nodeId: createGlobalId(id, 'PrayerRequest'),
        }
      );
      return followings.length > 0;
    },
    isPrayedFor: ({ id }, args, { dataSources }) =>
      dataSources.Prayer.isInteractedWith(id),
  },
  PrayerMenuCategory: {
    key: ({ itemGlobalKey }) => itemGlobalKey,
    subtitle: ({ attributeValues: { subtitle: { value } = {} } = {} }) => value,
    imageURL: ({ attributeValues: { imageSquare: { value } = {} } = {} }) =>
      createAssetUrl(JSON.parse(value)),
    overlayColor: ({
      attributeValues: { overlayColor: { value } = {} } = {},
    }) => value,
  },
  PrayerConnection: {
    totalCount: ({ getTotalCount }) => getTotalCount(),
    pageInfo: withEdgePagination,
  },
};
