import { Campus as apollosCampus } from '@apollosproject/data-connector-rock';
import { report } from '@apollosproject/bugsnag';

export default class Campus extends apollosCampus.dataSource {
  getPublicByLocation = async (location) => {
    const allCampuses = await this.getByLocation(location);

    // check public attribute first
    const campuses = allCampuses.filter((campus) => {
      const { attributeValues: { public: { value } = {} } = {} } = campus;
      if (!value) {
        report(
          new Error('cannot determine if campus is public'),
          {
            metaData: { campus },
            severity: 'warning',
          },
          () => ({})
        );

        // fall back is filter out if there's no location or image
        return !!(
          campus.location.longitude &&
          campus.location.latitude &&
          campus.location.image
        );
      }
      return value === 'True';
    });
    return campuses;
  };
}
