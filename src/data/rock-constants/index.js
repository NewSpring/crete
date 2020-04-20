import { RockConstants as apollosRockConstants } from '@apollosproject/data-connector-rock';

class RockConstants extends apollosRockConstants.dataSource {
  async createOrFindInteractionComponent({
    componentName,
    channelId,
    entityId,
  }) {
    return this.findOrCreate({
      model: 'InteractionComponents',
      objectAttributes: {
        Name: componentName,
        InteractionChannelId: channelId,
        EntityId: entityId,
      },
    });
  }
}

// eslint-disable-next-line import/prefer-default-export
export { RockConstants as dataSource };
