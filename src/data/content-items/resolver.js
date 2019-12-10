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
};

const resolver = {
  Query: {
    contentItemFromSlug: (root, { slug }, { dataSources }) =>
      dataSources.ContentItem.getBySlug(slug),
    contentChannels: async (
      root,
      args,
      { dataSources: { ContentChannel, Person, Auth } }
    ) => {
      let channels = await ContentChannel.getRootChannels();

      // if not staff, strip out staff channel
      const { id: personId } = await Auth.getCurrentPerson();
      const isStaff = await Person.isStaff(personId);
      if (!isStaff) channels = channels.filter(({ id }) => id !== 513);

      return channels;
    },
  },
  // ContentItem: {
  // __resolveType: (root, { dataSources: { ContentItem } }) =>
  // ContentItem.resolveType(root),
  // },
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
};

export default resolverMerge(resolver, originalContentItem);
