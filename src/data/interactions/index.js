import { parseGlobalId } from '@apollosproject/server-core';
import { Interactions as baseInteractions } from '@apollosproject/data-connector-rock';
import Config from '@apollosproject/config';

const { ROCK_MAPPINGS } = Config;

class Interactions extends baseInteractions.dataSource {
  baseInteractionsMap = this.ADDITIONAL_INTERACTIONS_MAP;

  ADDITIONAL_INTERACTIONS_MAP = {
    ContentItem: {
      ...this.baseInteractionsMap.ContentItem,
      VIEW: this.addContentViewInteraction.bind(this),
    },
    ...this.baseInteractionsMap,
  };

  async addContentViewInteraction({ id: nodeId }) {
    const {
      dataSources: { RockConstants, Auth },
    } = this.context;
    const { id, __type } = parseGlobalId(nodeId);
    console.log(__type);
    // const entityType = await RockConstants.modelType(__type);
    // const interactionComponent = await RockConstants.interactionComponent({
    // entityId: id,
    // entityTypeId: entityType.id,
    // entityTypeName: entityType.friendlyName,
    // });
    const interactionComponent = RockConstants.createOrFindInteractionComponent(
      {
        componentName: `${ROCK_MAPPINGS.INTERACTIONS.COMPONENT_NAME} - ${id}`,
        channelId: ROCK_MAPPINGS.INTERACTIONS.CHANNEL_IDS[__type],
        entityId: parseInt(id, 10),
      }
    );
    // TODO get the right interaction component complete with the right channel
    // based on the content item type
    const currentUser = await Auth.getCurrentPerson();
    // await this.post('/Interactions', {
    // PersonAliasId: currentUser.primaryAliasId,
    // InteractionComponentId: interactionComponent.id,
    // InteractionSessionId: this.context.sessionId,
    // Operation: 'VIEW',
    // InteractionDateTime: new Date().toJSON(),
    // InteractionSummary: 'VIEW',
    // ForeignKey: nodeId,
    // });
    return null;
  }
}

const { schema, resolver } = baseInteractions;
export { Interactions as dataSource, resolver, schema };
