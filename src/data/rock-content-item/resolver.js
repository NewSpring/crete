import { ContentItem as originalContentItem } from '@apollosproject/data-connector-rock';
import { resolverMerge } from '@apollosproject/server-core';

import ApollosConfig from '@apollosproject/config';

const { ROCK_MAPPINGS } = ApollosConfig;

// TODO temp fix, remove after this is merged
// https://github.com/ApollosProject/apollos-prototype/pull/1061
const defaultResolvers = {};

const resolver = {
  Query: {
    contentItemFromSlug: (root, { slug }, { dataSources }) =>
      dataSources.ContentItem.getBySlug(slug),
  },
  Mutation: {
    saveNotesComment: (root, { contentID, blockID, text }, { dataSources }) =>
      dataSources.ContentItem.saveNotesComment(contentID, blockID, text),
  },
  DevotionalContentItem: {
    ...defaultResolvers,
    sharing: (root, args, { dataSources: { ContentItem } }) => ({
      url: ContentItem.getShareUrl(
        root,
        ROCK_MAPPINGS.DEVOTIONAL_SERIES_CHANNEL_ID
      ),
      title: 'Share via ...',
      message: `${root.title} - ${ContentItem.createSummary(root)}`,
    }),
    series: (root) => root.getDirectParent(),
    seriesConnection: async (root, args, { dataSources: { ContentItem } }) => {
      const series = root.getDirectParent();

      return {
        series,
        itemCount: ContentItem.getSeriesItemCount(series.id, contentChannelId),
        itemIndex: ContentItem.getSeriesItemIndex(
          series.id,
          contentChannelId,
          id
        ),
      };
    },
  },
  WeekendContentItem: {
    ...defaultResolvers,
    sharing: (root, args, { dataSources: { ContentItem } }) => ({
      url: ContentItem.getShareUrl(
        root,
        ROCK_MAPPINGS.SERMON_SERIES_CHANNEL_ID
      ),
      title: 'Share via ...',
      message: `${root.title} - ${ContentItem.createSummary(root)}`,
    }),
    // deprecated
    communicators: (root, args, { dataSources }) =>
      dataSources.RockContentItem.getCommunicators(root),
    guestCommunicators: (root, args, { dataSources }) =>
      dataSources.RockContentItem.getGuestCommunicators(root),
    sermonDate: (root, args, { dataSources }) =>
      dataSources.RockContentItem.getSermonDate(root),
    // deprecated
    series: (root) => root.getDirectParent(),
    seriesConnection: async (root, args, { dataSources: { ContentItem } }) => {
      const series = await root.getDirectParent();

      return {
        series,
        itemCount: ContentItem.getSeriesItemCount(series.id, contentChannelId),
        itemIndex: ContentItem.getSeriesItemIndex(
          series.id,
          contentChannelId,
          id,
          startDateTime
        ),
      };
    },
    sermonNotes: (root, args, { dataSources: { ContentItem } }) =>
      RockContentItem.getSermonNotes(root) || [],
  },
  UniversalContentItem: {
    ...defaultResolvers,
  },
  MediaContentItem: {
    ...defaultResolvers,
  },
  ContentSeriesContentItem: {
    ...defaultResolvers,
  },
  NotesBlock: {
    __resolveType: ({ __typename }) => __typename,
  },
};

export default resolverMerge(resolver, originalContentItem);
