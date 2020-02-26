import { dataSource as baseLive } from '@apollosproject/data-connector-church-online';

export default class LiveStream extends baseLive {
  async getLiveStream() {
    // TODO pull top two fields from Rock schedule
    return {
      isLive: true,
      eventStartTime: new Date().toJSON(),
      media: () =>
        this.mediaUrls.length
          ? {
              sources: this.mediaUrls.map((uri) => ({
                uri,
              })),
            }
          : null,
      webViewUrl: this.webViewUrl,
    };
  }
}
