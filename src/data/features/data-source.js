import { Feature as baseFeatures } from '@apollosproject/data-connector-rock';

export default class Feature extends baseFeatures.dataSource {
  getHomeFeedFeatures = async () => {
    // Deprecated. Used in the old homeFeedFeatures query.
    const { FeatureFeed } = this.context.dataSources;

    const features = await FeatureFeed.getFilteredFeatures({
      section: 'HOME_FEATURES',
    });
    return Promise.all(
      features
        .filter(({ type }) => type === 'ActionList')
        .map((featureConfig) => this.createActionListFeature(featureConfig))
    );
  };
}
