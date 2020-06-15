import { Feature as baseFeatures } from '@apollosproject/data-connector-rock';
import ApollosConfig from '@apollosproject/config';

export default class Feature extends baseFeatures.dataSource {
  baseAlgorithms = this.ACTION_ALGORITHIMS;

  ACTION_ALGORITHIMS = {
    ...this.baseAlgorithms,
    STAFF_NEWS: this.contentChannelAlgorithm.bind(this),
  };

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
