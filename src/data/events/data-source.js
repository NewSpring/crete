import { Event as baseEvent } from '@apollosproject/data-connector-rock';

export default class Event extends baseEvent.dataSource {
  getImage = async (eventItemId) => {
    const { ContentItem } = this.context.dataSources;
    const event = await this.request('EventItems')
      .cache({ ttl: 60 })
      .find(eventItemId)
      .get();
    if (!Object.keys(event.attributeValues).length) return null;
    return ContentItem.getImages(event);
  };
}
