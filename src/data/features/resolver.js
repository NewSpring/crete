import { Feature } from '@apollosproject/data-connector-rock';
import { resolverMerge, createGlobalId } from '@apollosproject/server-core';

const resolver = {
  CardListItem: {
    labelText: ({ subtitle }) => subtitle.split(' - ').pop(),
  },
  ActionListAction: {
    subtitle: () => null,
  },
  // This was moved from data-connector-rock to data-connector-postgres
  // There are no specific overides.
  // We should delete it as soon as we bump the postgres package version.
  AddCommentFeature: {
    initialPrompt: ({ id, data }) =>
      data?.initialPrompt || JSON.parse(id).initialPrompt,
    addPrompt: ({ id, data }) => data?.addPrompt || JSON.parse(id).addPrompt,
    relatedNode: async (
      { id, parentType, parentId },
      args,
      { models: { Node }, dataSources },
      info
    ) => {
      if (parentType && parentId) {
        return Node.get(
          createGlobalId(parentId, parentType),
          dataSources,
          info
        );
      }
      const { relatedNode } = JSON.parse(id);
      return Node.get(
        createGlobalId(relatedNode.id, relatedNode.__type),
        dataSources,
        info
      );
    },
  },
  CommentListFeature: {
    comments: ({ id, data, parentType, parentId }, args, { dataSources }) => {
      // Old mechanism, based on Rock.
      if (!data) {
        return dataSources.Comment.getForNode(JSON.parse(id));
      }
      // New mechanism, based on Postgres
      return dataSources.Comment.getForNode({
        parentId,
        parentType,
        flagLimit: data.flagLimit,
      });
    },
  },
};

export default resolverMerge(resolver, Feature);
