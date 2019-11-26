import { ContentItem } from '@apollosproject/data-connector-rock';

import ApollosConfig from '@apollosproject/config';

class PrayerMenuCategory extends ContentItem.dataSource {
  getPrayerMenuCategories = async () => {
    const {
      dataSources: { Auth, Campus },
    } = this.context;
    const { ROCK_MAPPINGS } = ApollosConfig;

    const allCategories = await this.request()
      .filter(
        `ContentChannelId eq ${ROCK_MAPPINGS.PRAYER_MENU_CATEGORIES_CHANNEL_ID}`
      )
      .orderBy('Order')
      .get();
    let filteredCategories = allCategories || [];

    const { id } = await Auth.getCurrentPerson();

    // filter out campus
    const campus = await Campus.getForPerson({ personId: id });
    if (campus && campus.name === 'Web')
      filteredCategories = allCategories.filter(
        (category) =>
          category.attributeValues.requiresCampusMembership.value === 'False'
      );
    // filter out groups
    // TODO: need a GraphQL enpoint that says if I'm in any groups
    // https://github.com/ApollosProject/apollos-prototype/issues/676
    return filteredCategories;
  };
}

export default PrayerMenuCategory;
