import gql from 'graphql-tag';

const prayerSchema = gql`
  extend type Query {
    prayer(id: ID!): Prayer
    prayers(type: PrayerType): [Prayer]
      @deprecated(reason: "Use paginated version: prayerFeed")
    prayerFeed(first: Int, after: String, type: PrayerType): PrayersConnection
      @cacheControl(maxAge: 0)
    prayerMenuCategories: [PrayerMenuCategory] @cacheControl(maxAge: 0)
  }

  extend type Mutation {
    addPrayer(text: String!, isAnonymous: Boolean): Prayer
    answerPrayer(id: ID!, answer: String!): Prayer
    interactWithPrayer(id: ID!, action: PrayerAction!): Prayer
    deletePrayer(nodeId: String!): Prayer
      @deprecated(reason: "Use interactWithPrayer(action:DELETE)")
    incrementPrayerCount(nodeId: String!): Prayer
      @deprecated(reason: "Use interactWithPrayer(action:INCREMENT)")
    flagPrayer(nodeId: String!): Prayer
      @deprecated(reason: "Use interactWithPrayer(action:FLAG)")
    savePrayer(nodeId: String!): Prayer
      @deprecated(reason: "Use interactWithPrayer(action:SAVE)")
    unSavePrayer(nodeId: String!): Prayer
      @deprecated(reason: "Use interactWithPrayer(action:UNSAVE)")
  }

  enum PrayerAction {
    DELETE
    INCREMENT
    FLAG
    SAVE
    UNSAVE
    REMOVE_ANSWER
  }

  type PrayerMenuCategory implements Node {
    id: ID!
    key: String!
    title: String!
    subtitle: String
    imageURL: String
  }

  enum PrayerType {
    CAMPUS
    USER
    GROUP
    SAVED
  }

  type Prayer implements Node {
    id: ID!
    text: String!
    answer: String
    startTime: String!
    flagCount: Int
    prayerCount: Int
    campus: Campus @deprecated(reason: "Use requestor.campus")
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
