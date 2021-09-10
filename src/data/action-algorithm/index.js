import { ActionAlgorithm } from '@apollosproject/data-connector-rock';
import ApollosConfig from '@apollosproject/config';
import { get, flatten } from 'lodash';

const { schema, resolver } = ActionAlgorithm;

class dataSource extends ActionAlgorithm.dataSource {
  ACTION_ALGORITHMS = {
    ...this.ACTION_ALGORITHMS,
    CAMPAIGN_ITEMS: this.campaignItemsAlgorithm.bind(this),
    EXPERIMENTAL_UPCOMING_EVENTS: this.experimentalUpcomingEventsAlgorithm.bind(
      this
    ),
  };

  async experimentalUpcomingEventsAlgorithm(...args) {
    const { Feature, Auth, Group } = this.context.dataSources;

    Feature.setCacheHint({
      maxAge: 0,
      scope: 'PRIVATE',
    });

    const { id } = await Auth.getCurrentPerson();
    const testGroups = await Group.getTestGroups(id);
    const isTester = testGroups.filter(
      (group) => group.name === 'Experimental Features'
    ).length;

    if (!isTester) {
      return [];
    }
    return this.upcomingEventsAlgorithm.call(this, ...args);
  }

  async campaignItemsAlgorithm({ limit = 1 } = {}) {
    const { ContentItem } = this.context.dataSources;

    const channels = await ContentItem.byContentChannelIds(
      ApollosConfig.ROCK_MAPPINGS.CAMPAIGN_CHANNEL_IDS
    ).get();

    const items = flatten(
      await Promise.all(
        channels.map(async ({ id, title }) => {
          const childItemsCursor = await ContentItem.getCursorByParentContentItemId(
            id
          );

          const childItems = await childItemsCursor
            .orderBy('StartDateTime', 'desc') // Custom for newspring. We are ordering by startDateTime here.
            .top(limit)
            .expand('ContentChannel')
            .get();

          return childItems.map((item) => ({
            ...item,
            channelSubtitle: title,
          }));
        })
      )
    );

    return items.map((item, i) => ({
      id: `${item.id}${i}`,
      title: item.title,
      subtitle: get(item, 'contentChannel.name'),
      relatedNode: { ...item, __type: ContentItem.resolveType(item) },
      image: ContentItem.getCoverImage(item),
      action: 'READ_CONTENT',
      summary: ContentItem.createSummary(item),
    }));
  }
}

export { dataSource, schema, resolver };
