import gql from 'graphql-tag';

const prayerSchema = gql`
  extend type Query {
    prayers(type: PrayerType): [Prayer]
    prayerFeed(first: Int, after: String, type: PrayerType): PrayersConnection
    prayerMenuCategories: [PrayerMenuCategory]
    campusPrayers: [Prayer] @deprecated(reason: "Use prayers(type:SAVED)")
    userPrayers: [Prayer] @deprecated(reason: "Use prayers(type:USER)")
    groupPrayers: [Prayer] @deprecated(reason: "Use prayers(type:GROUP)")
    savedPrayers: [Prayer] @deprecated(reason: "Use prayers(type:CAMPUS)")
  }
  extend type Mutation {
    addPrayer(text: String!, isAnonymous: Boolean): Prayer
    deletePrayer(nodeId: String!): Prayer
    incrementPrayerCount(nodeId: String!): Prayer
    flagPrayer(nodeId: String!): Prayer
    savePrayer(nodeId: String!): Prayer
    unSavePrayer(nodeId: String!): Prayer
  }

  type PrayerMenuCategory implements Node {
    id: ID!
    key: String!
    title: String!
    subtitle: String
    imageURL: String
    overlayColor: String @deprecated(reason: "Never changes")
  }

  enum PrayerType {
    CAMPUS
    USER
    GROUP
    SAVED
  }

  type Prayer implements Node {
    id: ID!
    firstName: String @deprecated(reason: "Use requestor.firstName")
    lastName: String @deprecated(reason: "Use requestor.lastName.")
    text: String!
    enteredDateTime: String! @deprecated(reason: "Use startTime")
    startTime: String!
    flagCount: Int
    prayerCount: Int
    categoryId: Int @deprecated(reason: "Not supported")
    campus: Campus @deprecated(reason: "Use requestor.campus")
    createdByPersonAliasId: Int @deprecated(reason: "Use requestor")
    requestedByPersonAliasId: Int @deprecated(reason: "Use requestor")
    person: Person @deprecated(reason: "Use requestor")
    requestor: Person
    isAnonymous: Boolean
    isSaved: Boolean @cacheControl(maxAge: 0)
    isPrayedFor: Boolean
  }

  type PrayersConnection {
    edges: [PrayersConnectionEdge]
    totalCount: Int
    pageInfo: PaginationInfo
  }

  type PrayersConnectionEdge {
    node: Prayer
    cursor: String
  }
`;

export default prayerSchema;
