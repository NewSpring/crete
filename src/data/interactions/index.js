import { parseGlobalId } from '@apollosproject/server-core';
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
    if (!(__type in ROCK_MAPPINGS.INTERACTIONS.CHANNEL_IDS)) return null;
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
    // ForeignKey: id,
    // });
    return null;
  }
}

const { schema, resolver } = baseInteractions;
export { Interactions as dataSource, resolver, schema };
