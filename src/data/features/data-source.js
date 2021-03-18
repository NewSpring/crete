import { Feature as baseFeatures } from '@apollosproject/data-connector-rock';
import ApollosConfig from '@apollosproject/config';

export default class Feature extends baseFeatures.dataSource {
  getHomeFeedFeatures = async () => {
    // Deprecated. Used in the old homeFeedFeatures query.
    const { RockPerson, Auth, Group } = this.context.dataSources;
    const config = ApollosConfig.HOME_FEATURES || [];

    const { id } = await Auth.getCurrentPerson();
    const isStaff = await RockPerson.isStaff(id);
    const testGroups = await Group.getTestGroups(id);

    const features = config
      .filter(({ type }) => type === 'ActionList')
      .filter((feature) => {
        // filter staff only features
        const isStaffFeature = feature.algorithms.filter(
          ({ type }) => type === 'STAFF_NEWS'
        ).length;
        if (isStaffFeature && !isStaff) return false;
        // filter experimental features
        const isExperimentalFeature = feature.algorithms.filter(
          ({ type }) => type === 'EXPERIMENTAL_UPCOMING_EVENTS'
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
  };
}
