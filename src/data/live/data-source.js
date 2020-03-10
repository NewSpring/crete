// import { dataSource as baseLive } from '@apollosproject/data-connector-church-online';
import RockApolloDataSource from '@apollosproject/rock-apollo-data-source';
import ApollosConfig from '@apollosproject/config';

const { CHURCH_ONLINE, ROCK_MAPPINGS } = ApollosConfig;

export default class LiveStream extends RockApolloDataSource {

  webViewUrl = () => {
    return CHURCH_ONLINE.WEB_VIEW_URL;
  };

  async getLiveStream() {
    return {
      isLive: async () =>
        (await this.post(
          `Lava/RenderTemplate`,
          `{[ scheduledcontent schedulecategoryid:'${ROCK_MAPPINGS.SUNDAY_SERMON_SCHEDULE_CATEGORY_ID}' showwhen:'both' ]}{{ IsLive }}{[ endscheduledcontent ]}`
        )) === 'true',
      eventStartTime: null,
      media: () => null,
      webViewUrl: this.webViewUrl,
    };
  }

  async getLiveStreams() {
    const { ContentItem } = this.context.dataSources;
    // This logic is a little funky right now.
    // The follow method looks at the sermon feed and the `getLiveStream` on this module
    // If we have data in the sermon feed, and the `getLiveStream.isLive` is true
    // this returns an array of livestreams
    const liveItems = await ContentItem.getActiveLiveStreamContent();
    return Promise.all(
      liveItems.map(async (item) => ({
        contentItem: item,
        ...(await this.getLiveStream()),
      }))
    );
  }
}
