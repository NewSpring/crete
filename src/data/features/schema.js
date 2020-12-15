import gql from 'graphql-tag';
import { Feature } from '@apollosproject/data-connector-rock';

export default gql`
  ${Feature.schema}

  type NoteFeature implements Feature & Node {
    id: ID! @deprecated(reason: "NoteFeature no longer supported")
    order: Int

    placeholder: String
  }

  type HeaderFeature implements Feature & Node {
    id: ID! @deprecated(reason: "NoteFeature no longer supported")
    order: Int

    body: String
    sharing: SharableFeature
  }

  extend type Query {
    readFeedFeatures: FeatureFeed @cacheControl(maxAge: 0)
  }
`;
