import { createGlobalId, parseGlobalId } from '@apollosproject/server-core';
import { isNumber } from 'lodash';

export default {
  Query: {
    prayers: (root, args, { dataSources }) =>
      dataSources.PrayerRequest.getAll(),
    campusPrayers: (root, args, { dataSources }) =>
      dataSources.PrayerRequest.getAllByCampus(),
    userPrayers: (root, args, { dataSources }) =>
      dataSources.PrayerRequest.getFromCurrentPerson(),
    groupPrayers: (root, args, { dataSources }) =>
      dataSources.PrayerRequest.getFromGroups(),
    savedPrayers: (root, args, { dataSources }) =>
      dataSources.PrayerRequest.getSavedPrayers(),
  },
  Mutation: {
    addPrayer: (root, args, { dataSources }) =>
      dataSources.PrayerRequest.add(args),
    deletePrayer: (root, { nodeId }, { dataSources }) =>
      dataSources.PrayerRequest.deletePrayer(parseGlobalId(nodeId)),
    incrementPrayerCount: async (root, { nodeId }, { dataSources }) => {
      const { id: prayerId } = parseGlobalId(nodeId);

      const prayer = await dataSources.PrayerRequest.incrementPrayed(prayerId);

      // TODO: createInteraction needs to be way faster
      // does 10 data calls and sometimes it times out
      //
      // create the interaction to trigger a notification
      await dataSources.PrayerRequest.createInteraction({
        prayerId,
      });

      return prayer;
    },
    flagPrayer: (root, { nodeId }, { dataSources }) => {
      const { id: parsedId } = parseGlobalId(nodeId);
      return dataSources.PrayerRequest.flag(parsedId);
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
  PrayerRequest: {
    id: ({ id }, args, context, { parentType }) =>
      createGlobalId(id, parentType.name),
    startTime: ({ enteredDateTime }) => enteredDateTime,
    campus: ({ campusId }, args, { dataSources }) =>
      isNumber(campusId) ? dataSources.Campus.getFromId(campusId) : null,
    isAnonymous: ({ attributeValues: { isAnonymous: { value } = {} } = {} }) =>
      value === 'True',
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
  },
};
