import { gql } from 'apollo-server';

import {
  createApolloServerConfig,
  Interfaces,
} from '@apollosproject/server-core';

import * as Analytics from '@apollosproject/data-connector-analytics';
import * as Scripture from '@apollosproject/data-connector-bible';
// import * as LiveStream from '@apollosproject/data-connector-church-online';
import * as Cloudinary from '@apollosproject/data-connector-cloudinary';
// import * as OneSignal from '@apollosproject/data-connector-onesignal';
import * as Search from '@apollosproject/data-connector-algolia-search';
import * as Pass from '@apollosproject/data-connector-passes';
import * as Cache from '@apollosproject/data-connector-redis-cache';
import * as Sms from '@apollosproject/data-connector-twilio';
import {
  Followings,
  Interactions,
  RockConstants,
  // ContentItem,
  // ContentChannel,
  Sharable,
  Auth,
  PersonalDevice,
  Template,
  AuthSms,
  // Campus,
  // Group,
  BinaryFiles,
  // Feature,
  // FeatureFeed,
  // ActionAlgorithm,
  // Event,
  // PrayerRequest,
  Persona,
  // Person as RockPerson,
} from '@apollosproject/data-connector-rock';

import {
  Comment,
  UserFlag,
  UserLike,
  Follow,
  Notification,
  NotificationPreference,
  Campus as PostgresCampus,
  Person as PostgresPerson,
} from '@apollosproject/data-connector-postgres';
import * as LiveStream from './live';
import * as RockPerson from './people';
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

// This modules ties together certain updates so they occurs in both Rock and Postgres.
// Will be eliminated in the future through an enhancement to the Shovel
import { Person, OneSignal } from './rockWithPostgres';

delete Feature.resolver.PrayerListFeature;
delete Feature.resolver.VerticalPrayerListFeature;

const data = {
  Interfaces,
  Followings,
  ContentChannel,
  ContentItem,
  Notification,
  NotificationPreference,
  RockPerson, // This entry needs to come before (postgres) Person
  BinaryFiles, // This entry needs to come before (postgres) Person
  PostgresPerson, // Postgres person for now, as we extend this dataSource in the 'rockWithPostgres' file
  Cloudinary,
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
  Pass,
  Search,
  Template,
  Campus,
  Group,
  Feature,
  FeatureFeed,
  ActionAlgorithm,
  Event,
  Cache,
  // PrayerRequest,
  Comment,
  UserLike,
  UserFlag,
  Follow,
  PostgresCampus,
  Persona,
  Person, // An extension of Postgres person. Will be eliminated in the near future so you can use just postgres/Person.
  Prayer,
  MatrixItem,
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
