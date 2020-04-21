import { ContentItem } from '@apollosproject/data-connector-rock';
import gql from 'graphql-tag';

export default gql`
  ${ContentItem.schema}

  type SeriesConnection {
    series: ContentItem
    itemCount: Int
    itemIndex(id: String): Int
  }

  interface SermonNote {
    id: ID!
    allowsCustomNote: Boolean
  }

  type TextNote implements SermonNote {
    id: ID!
    allowsCustomNote: Boolean

    text: String
    isHeader: Boolean
  }

  type ScriptureNote implements SermonNote {
    id: ID!
    allowsCustomNote: Boolean

    scripture: Scripture
  }

  type SavedSermonNote {
    id: ID!
    parent: SermonNote
    text: String
  }

  extend type WeekendContentItem {
    communicator: Person @deprecated(reason: "Use communicators")
    communicators: [Person]
    guestCommunicators: [String]
    sermonDate: String
    series: ContentItem @deprecated(reason: "Use seriesConnection")
    seriesConnection: SeriesConnection
    sermonNotes: [SermonNote]
    savedSermonNotes: [SavedSermonNote] @cacheControl(maxAge: 0)
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
    saveSermonNote(contentID: ID!, parentID: ID!, text: String): SavedSermonNote
  }
`;
