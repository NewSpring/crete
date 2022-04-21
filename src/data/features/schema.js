import gql from 'graphql-tag';
import { Feature } from '@apollosproject/data-connector-rock';

export default gql`
  ${Feature.schema}

  extend type Query {
    readFeedFeatures: FeatureFeed @cacheControl(maxAge: 0)
  }
`;
