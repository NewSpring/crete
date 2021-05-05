import { ContentItem as originalContentItem } from '@apollosproject/data-connector-rock';
import { resolverMerge } from '@apollosproject/server-core';

import ApollosConfig from '@apollosproject/config';

const { ROCK_MAPPINGS } = ApollosConfig;

// TODO temp fix, remove after this is merged
// https://github.com/ApollosProject/apollos-prototype/pull/1061
const defaultResolvers = {
  sharing: (root, args, { dataSources: { ContentItem } }) => ({
    url: ContentItem.getShareUrl(root),
    title: 'Share via ...',
    message: `${root.title} - ${ContentItem.createSummary(root)}`,
  }),

  theme: (root, input, { dataSources }) =>
    dataSources.ContentItem.getTheme(root),

  htmlContent: (root, input, { dataSources }) =>
    dataSources.ContentItem.createHTMLContent(root.content) ||
    dataSources.ContentItem.createSummary(root),

  childContentItemsConnection: async (root, args, { dataSources }) => {
    const cursor = await dataSources.ContentItem.getCursorByParentContentItemId(
      root.id
    );

    if (
      ROCK_MAPPINGS.CAMPAIGN_CHANNEL_IDS.includes(root.contentChannelId) ||
      root.contentChannelId === ROCK_MAPPINGS.DEVOTIONAL_SERIES_CHANNEL_ID
    ) {
      cursor.orderBy('StartDateTime', 'desc');
    } else {
      cursor.orderBy('Order');
    }
    return dataSources.ContentItem.paginate({
      cursor,
      args,
    });
  },
};

const resolver = {
  Query: {
    contentItemFromSlug: (root, { slug }, { dataSources }) =>
      dataSources.ContentItem.getBySlug(slug),
    contentChannels: async (
      root,
      args,
      { dataSources: { ContentChannel, RockPerson, Auth } },
      { cacheControl }
    ) => {
      cacheControl.setCacheHint({ maxAge: 0 });
      let channels = await ContentChannel.getRootChannels();

      // if not staff, strip out staff channel
      try {
        const { id: personId } = await Auth.getCurrentPerson();
        const isStaff = await RockPerson.isStaff(personId);
        if (!isStaff) channels = channels.filter(({ id }) => id !== 513);
      } catch (e) {
        return channels.filter(({ id }) => id !== 513);
      }

      return channels;
    },
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
    scriptures: async (
      { attributeValues: { scriptures } = {} },
      args,
      { dataSources }
    ) => dataSources.ContentItem.getContentItemScriptures(scriptures),
    // deprecated
    series: ({ id }, args, { dataSources: { ContentItem } }) =>
      ContentItem.getSeries(id, ROCK_MAPPINGS.DEVOTIONAL_SERIES_CHANNEL_ID),
    seriesConnection: async (
      { id, contentChannelId },
      args,
      { dataSources: { ContentItem } }
    ) => {
      const series = await ContentItem.getSeries(
        id,
        ROCK_MAPPINGS.DEVOTIONAL_SERIES_CHANNEL_ID
      );

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
    siblingContentItemsConnection: async ({ id }, args, { dataSources }) => {
      const series = await dataSources.ContentItem.getSeries(
        id,
        ROCK_MAPPINGS.DEVOTIONAL_SERIES_CHANNEL_ID
      );
      const cursor = await dataSources.ContentItem.getCursorByParentContentItemId(
        series.id
      );
      return dataSources.ContentItem.paginate({
        cursor: cursor.orderBy('StartDateTime', 'desc'),
        args,
      });
    },
    features: (root, args, { dataSources: { ContentItem } }) =>
      ContentItem.getFeatures(root),
    featureFeed: ({ id }, args, { dataSources: { FeatureFeed } }) =>
      FeatureFeed.getFeed({ type: 'contentItem', args: { id } }),
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
    communicator: async (
      { attributeValues: { communicators } = {} },
      args,
      { dataSources }
    ) => {
      const speakers = await dataSources.ContentItem.getCommunicators(
        communicators
      );
      return speakers[0] || null;
    },
    communicators: (
      { attributeValues: { communicators } = {} },
      args,
      { dataSources }
    ) => dataSources.ContentItem.getCommunicators(communicators),
    guestCommunicators: (
      { attributeValues: { communicators } = {} },
      args,
      { dataSources }
    ) => dataSources.ContentItem.getGuestCommunicators(communicators),
    sermonDate: ({ attributeValues: { actualDate: { value } = {} } = {} }) =>
      value,
    // deprecated
    series: ({ id }, args, { dataSources: { ContentItem } }) =>
      ContentItem.getSeries(id, ROCK_MAPPINGS.SERMON_SERIES_CHANNEL_ID),
    seriesConnection: async (
      { id, contentChannelId, startDateTime },
      args,
      { dataSources: { ContentItem } }
    ) => {
      const series = await ContentItem.getSeries(
        id,
        ROCK_MAPPINGS.SERMON_SERIES_CHANNEL_ID
      );

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
    siblingContentItemsConnection: async ({ id }, args, { dataSources }) => {
      const series = await dataSources.ContentItem.getSeries(
        id,
        ROCK_MAPPINGS.SERMON_SERIES_CHANNEL_ID
      );
      const cursor = await dataSources.ContentItem.getCursorByParentContentItemId(
        series.id
      );
      return dataSources.ContentItem.paginate({
        cursor: cursor.orderBy('Order'),
        args,
      });
    },
    sermonNotes: (
      { id, attributeValues: { sermonNotes } },
      args,
      { dataSources: { ContentItem } }
    ) => (sermonNotes ? ContentItem.getSermonNotes(id, sermonNotes) : []),
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
