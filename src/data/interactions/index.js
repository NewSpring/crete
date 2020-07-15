import { createGlobalId } from '@apollosproject/server-core';
import { Interactions as baseInteractions } from '@apollosproject/data-connector-rock';
import Config from '@apollosproject/config';

const { ROCK_MAPPINGS } = Config;

class Interactions extends baseInteractions.dataSource {
  baseInteractionsMap = this.ADDITIONAL_INTERACTIONS_MAP;

  ADDITIONAL_INTERACTIONS_MAP = {
    ...this.baseInteractionsMap,
    ContentItem: {
      ...this.baseInteractionsMap.ContentItem,
      VIEW: this.addContentViewInteraction.bind(this),
    },
  };

  async addContentViewInteraction({ id, __type }) {
    const {
      dataSources: { RockConstants, Auth },
    } = this.context;
    const {
      title: componentName,
      contentChannelId: channelId,
    } = await this.request('ContentChannelItems')
      .find(id)
      .cache({ ttl: 86400 })
      .get();
    // TODO convert content channel ID to interaction channel ID
    const {
      id: componentId,
    } = await RockConstants.createOrFindInteractionComponent({
      componentName,
      channelId,
      entityId: parseInt(id, 10),
    });
    const currentUser = await Auth.getCurrentPerson();
    // await this.post('/Interactions', {
    // PersonAliasId: currentUser.primaryAliasId,
    // InteractionComponentId: componentId,
    // Operation: 'VIEW',
    // InteractionDateTime: new Date().toJSON(),
    // InteractionSummary: 'VIEW',
    // ForeignKey: createGlobalId(id, __type),
    // ChannelCustom1: 'corinth',
    // });
    return null;
  }
}

const { schema, resolver } = baseInteractions;
export { Interactions as dataSource, resolver, schema };
