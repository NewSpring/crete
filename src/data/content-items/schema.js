import { ContentItem } from '@apollosproject/data-connector-rock';
import gql from 'graphql-tag';

export default gql`
  ${ContentItem.schema}

  type SeriesConnection {
    series: ContentItem
    itemCount: Int
    itemIndex(id: String): Int
  }

  type SermonNote {
    id: ID!
    featureID: String
    text: String
  }

  extend type WeekendContentItem {
    communicator: Person @deprecated(reason: "Use communicators")
    communicators: [Person]
    guestCommunicators: [String]
    sermonDate: String
    series: ContentItem @deprecated(reason: "Use seriesConnection")
    seriesConnection: SeriesConnection
    userSermonNotes: [SermonNote] @cacheControl(maxAge: 0)
  }

  extend type DevotionalContentItem {
    series: ContentItem @deprecated(reason: "Use seriesConnection")
    seriesConnection: SeriesConnection
  }

  extend type VideoMedia {
    thumbnail: ImageMedia
  }

  extend type Query {
    contentItemFromSlug(slug: String!): ContentItem
  }

  extend type Mutation {
    saveSermonNote(contentID: ID!, featureID: ID!, text: String): SermonNote
  }
`;
