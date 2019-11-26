import { Features as baseFeatures } from '@apollosproject/data-connector-rock';
import { createGlobalId } from '@apollosproject/server-core';
import ApollosConfig from '@apollosproject/config';

export default class Features extends baseFeatures.dataSource {
  baseAlgorithms = this.ACTION_ALGORITHIMS;

  ACTION_ALGORITHIMS = {
    ...this.baseAlgorithms,
    STAFF_NEWS: this.contentChannelAlgorithm.bind(this),
  };

  // eslint-disable-next-line class-methods-use-this
  createNoteFeature({ placeholder, id }) {
    return {
      placeholder,
      id: createGlobalId(id, 'NoteFeature'),
      __typename: 'NoteFeature',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  createHeaderFeature({ body, id }) {
    return {
      body,
      id: createGlobalId(id, 'HeaderFeature'),
      __typename: 'HeaderFeature',
    };
  }

  async getHomeFeedFeatures() {
    const { Person, Auth } = this.context.dataSources;
    const { id } = await Auth.getCurrentPerson();
    const isStaff = await Person.isStaff(id);

    const features = ApollosConfig.HOME_FEATURES.filter((feature) => {
      const staffOnly = feature.algorithms.filter(
        ({ type }) => type === 'STAFF_NEWS'
      );
      // if there are staff only features and I'm not on staff, filter out
      if (staffOnly.length && !isStaff) return false;
      // TODO filter out experimental if "experimental" header isn't present
      return true;
    });
    return Promise.all(
      features.map((featureConfig) =>
        this.createActionListFeature(featureConfig)
      )
    );
  }
}
