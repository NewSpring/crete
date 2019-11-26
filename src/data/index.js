import { gql } from 'apollo-server';

import { createApolloServerConfig } from '@apollosproject/server-core';

import * as Analytics from '@apollosproject/data-connector-analytics';
import * as Scripture from '@apollosproject/data-connector-bible';
import * as LiveStream from '@apollosproject/data-connector-church-online';
import * as OneSignal from '@apollosproject/data-connector-onesignal';
import * as Search from '@apollosproject/data-connector-algolia-search';
import * as Pass from '@apollosproject/data-connector-passes';
import * as Cache from '@apollosproject/data-connector-redis-cache';
import * as Sms from '@apollosproject/data-connector-twilio';
import {
  Followings,
  ContentChannel,
  Sharable,
  PersonalDevice,
  Template,
  AuthSms,
  BinaryFiles,
  RockConstants,
  Event,
} from '@apollosproject/data-connector-rock';
import * as Person from './people';
import * as Auth from './auth';
import * as ContentItem from './content-items';
import * as Features from './features';
import * as Campus from './campuses';
import * as Group from './groups';
import * as Theme from './theme';
import * as MatrixItem from './matrix-items';
import * as PrayerRequest from './prayer-requests';
import * as PrayerMenuCategory from './prayer-menu-categories';

// This module is used to attach Rock User updating to the OneSignal module.
// This module includes a Resolver that overides a resolver defined in `OneSignal`
import * as OneSignalWithRock from './oneSignalWithRock';

const data = {
  Followings,
  ContentChannel,
  ContentItem,
  Auth,
  AuthSms,
  Sms,
  LiveStream,
  Theme,
  Scripture,
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
  BinaryFiles,
  Event,
  Cache,
  Features,
  Person,
  PrayerRequest,
  PrayerMenuCategory,
  MatrixItem,
};

const {
  dataSources,
  resolvers,
  schema,
  context,
  applyServerMiddleware,
  setupJobs,
} = createApolloServerConfig(data);

export {
  dataSources,
  resolvers,
  schema,
  context,
  applyServerMiddleware,
  setupJobs,
};

// the upload Scalar is added
export const testSchema = [
  gql`
    scalar Upload
  `,
  ...schema,
];
