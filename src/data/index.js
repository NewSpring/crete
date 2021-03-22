import { gql } from 'apollo-server';

import {
  createApolloServerConfig,
  Interfaces,
} from '@apollosproject/server-core';

import * as Analytics from '@apollosproject/data-connector-analytics';
import * as Scripture from '@apollosproject/data-connector-bible';
// import * as LiveStream from '@apollosproject/data-connector-church-online';
// import * as Cloudinary from '@apollosproject/data-connector-cloudinary';

import * as OneSignal from '@apollosproject/data-connector-onesignal';
import * as Search from '@apollosproject/data-connector-algolia-search';
import * as Pass from '@apollosproject/data-connector-passes';
import * as Cache from '@apollosproject/data-connector-redis-cache';
import * as Sms from '@apollosproject/data-connector-twilio';
import {
  Followings,
  Interactions,
  RockConstants,
  // Person,
  // ContentItem,
  // ContentChannel,
  Sharable,
  Auth,
  PersonalDevice,
  Template,
  AuthSms,
  BinaryFiles,
  // FeatureFeed,
  // ActionAlgorithm,
  // PrayerRequest,
} from '@apollosproject/data-connector-rock';
import { Comment, UserFlag } from '@apollosproject/data-connector-postgres';
// import Auth from './auth';
import * as LiveStream from './live';
import * as Person from './people';
import * as ContentItem from './content-items';
import * as ContentChannel from './content-channel';
import * as Feature from './features';
import * as ActionAlgorithm from './action-algorithm';
import * as Campus from './campuses';
import * as Group from './groups';
import * as Event from './events';

import * as Theme from './theme';
import * as MatrixItem from './matrix-items';
import * as Prayer from './prayers';
import * as FeatureFeed from './feature-feeds';

// This module is used to attach Rock User updating to the OneSignal module.
// This module includes a Resolver that overides a resolver defined in `OneSignal`
import * as OneSignalWithRock from './oneSignalWithRock';

// TODO: Delete this line when we integrate core prayer.
delete Feature.resolver.PrayerListFeature;
delete Feature.resolver.VerticalPrayerListFeature;

const data = {
  Interfaces,
  Followings,
  ContentChannel,
  ContentItem,
  Auth,
  AuthSms,
  Sms,
  LiveStream,
  Theme,
  Scripture,
  Interactions,
  RockConstants,
  Sharable,
  Analytics,
  OneSignal,
  PersonalDevice,
  OneSignalWithRock,
  Pass,
  Search,
  Template,
  Campus,
  Group,
  Person,
  BinaryFiles,
  Prayer,
  MatrixItem,
  Feature,
  Event,
  Cache,
  FeatureFeed,
  ActionAlgorithm,
  Comment,
  UserFlag,
  // PrayerRequest,
};

const {
  dataSources,
  resolvers,
  schema,
  context,
  applyServerMiddleware,
  setupJobs,
  migrations,
} = createApolloServerConfig(data);

export {
  dataSources,
  resolvers,
  schema,
  context,
  applyServerMiddleware,
  setupJobs,
  migrations,
};

// the upload Scalar is added
export const testSchema = [
  gql`
    scalar Upload
  `,
  ...schema,
];
