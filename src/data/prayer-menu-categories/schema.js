import gql from 'graphql-tag';

const prayerMenuCategorySchema = gql`
  extend type Query {
    prayerMenuCategories: [PrayerMenuCategory]
  }
  type PrayerMenuCategory implements Node {
    id: ID!
    key: String!
    title: String!
    subtitle: String
    imageURL: String
    overlayColor: String @deprecated(reason: "Never changes")
  }
`;

export default prayerMenuCategorySchema;
