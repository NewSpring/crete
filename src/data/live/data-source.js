// import { dataSource as baseLive } from '@apollosproject/data-connector-church-online';
import RockApolloDataSource from '@apollosproject/rock-apollo-data-source';
import ApollosConfig from '@apollosproject/config';

const { CHURCH_ONLINE, ROCK_MAPPINGS, LIVING_AS_ONE } = ApollosConfig;

export default class LiveStream extends RockApolloDataSource {
  async getLiveStream() {
    const stream =
      (await this.post(
        `Lava/RenderTemplate`,
        `{[ scheduledcontent schedulecategoryid:'${
          ROCK_MAPPINGS.SUNDAY_SERMON_SCHEDULE_CATEGORY_ID
        }' showwhen:'both' ]}{{ IsLive }}{[ endscheduledcontent ]}`
      )) === 'true';
    return {
      isLive: stream,
      eventStartTime: null,
      media: { sources: [{ uri: LIVING_AS_ONE.STREAM_URL }] },
      webViewUrl: CHURCH_ONLINE.WEB_VIEW_URL,
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
        // TODO put this back once we determine if it's the cause of the memory leak
        // ...(await this.getLiveStream()),
        // ... and remove these four lines
        isLive: false,
        eventStartTime: null,
        media: { sources: [{ uri: LIVING_AS_ONE.STREAM_URL }] },
        webViewUrl: CHURCH_ONLINE.WEB_VIEW_URL,
      }))
    );
  }
}
