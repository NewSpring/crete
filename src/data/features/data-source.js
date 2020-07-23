import { Feature as baseFeatures } from '@apollosproject/data-connector-rock';
import ApollosConfig from '@apollosproject/config';

export default class Feature extends baseFeatures.dataSource {
  baseAlgorithms = this.ACTION_ALGORITHIMS;

  ACTION_ALGORITHIMS = {
    ...this.baseAlgorithms,
    STAFF_NEWS: this.contentChannelAlgorithm.bind(this),
  };

  async getHomeFeedFeatures() {
    const { Person, Auth, Group } = this.context.dataSources;
    const { id } = await Auth.getCurrentPerson();
    const isStaff = await Person.isStaff(id);
    const testGroups = await Group.getTestGroups(id);

    const features = ApollosConfig.HOME_FEATURES.filter((feature) => {
      // filter staff only features
      const isStaffFeature = feature.algorithms.filter(
        ({ type }) => type === 'STAFF_NEWS'
      ).length;
      if (isStaffFeature && !isStaff) return false;
      // filter experimental features
      const isExperimentalFeature = feature.algorithms.filter(
        ({ type }) => type === 'UPCOMING_EVENTS'
      ).length;
      const isTester = testGroups.filter(
        (group) => group.name === 'Experimental Features'
      ).length;
      if (isExperimentalFeature && !isTester) return false;
      return true;
    });
    return Promise.all(
      features.map((featureConfig) =>
        this.createActionListFeature(featureConfig)
      )
    );
  }
}
