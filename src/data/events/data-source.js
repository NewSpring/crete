import { Event as baseEvent } from '@apollosproject/data-connector-rock';
import ApollosConfig from '@apollosproject/config';

const { ROCK_MAPPINGS } = ApollosConfig;

export default class Event extends baseEvent.dataSource {
  getImage = async (eventItemId) => {
    const { ContentItem } = this.context.dataSources;
    // get corrsponding events on the public calendar
    const calendarItem = await this.request('EventCalendarItems')
      .cache({ ttl: 60 })
      .filter(`EventItemId eq ${eventItemId}`)
      .andFilter(`EventCalendarId eq ${ROCK_MAPPINGS.PUBLIC_CALENDAR_ID}`)
      .first();
    if (!Object.keys(calendarItem.attributeValues).length) return null;
    return ContentItem.getCoverImage(calendarItem);
  };
}
