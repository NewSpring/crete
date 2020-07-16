const ApolloServer = require.requireActual('@apollosproject/config').default;

ApolloServer.loadJs({
  ROCK: {
    API_URL: 'https://apollosrock.newspring.cc/api',
    API_TOKEN: 'some-rock-token',
    IMAGE_URL: 'https://apollosrock.newspring.cc/GetImage.ashx',
    SHARE_URL: 'https://newspring.cc',
    TIMEZONE: 'America/New_York',
  },
  ROCK_CONSTANTS: {
    IMAGE: 10,
    AUDIO_FILE: 77,
    VIDEO_FILE: 79,
  },
  ROCK_MAPPINGS: {
    FEED_CONTENT_CHANNEL_IDS: [1, 2, 3, 4, 6, 8],
    SERIES_CONTENT_CHANNEL_TYPE_IDS: [6, 7],
    CONTENT_ITEM: {
      ContentSeriesContentItem: {
        EntityType: 'ContentChannelItem',
        ContentChannelId: [18, 20],
      },
      DevotionalContentItem: {
        EntityType: 'ContentChannelItem',
        ContentChannelId: [17],
      },
      MediaContentItem: {
        EntityType: 'ContentChannelItem',
      },
      UniversalContentItem: {
        EntityType: 'ContentChannelItem',
      },
      ContentItem: {
        EntityType: 'ContentChannelItem',
      },
      WeekendContentItem: {
        EntityType: 'ContentChannelItem',
      },
    },
  },
  WISTIA: {
    API_URL: 'https://api.wistia.com/v1/medias',
    API_KEY: 'XXXXXXX',
  },
});

export default ApolloServer;
