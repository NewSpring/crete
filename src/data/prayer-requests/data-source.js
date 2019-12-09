import RockApolloDataSource from '@apollosproject/rock-apollo-data-source';
import ApollosConfig from '@apollosproject/config';
import moment from 'moment-timezone';
import { uniq } from 'lodash';
import { parseGlobalId } from '@apollosproject/server-core';
import bugsnagClient from '../../bugsnag';

const { ROCK, ROCK_MAPPINGS } = ApollosConfig;
export default class PrayerRequest extends RockApolloDataSource {
  resource = 'PrayerRequests';

  expanded = true;

  sortPrayers = (prayers) =>
    prayers.sort((a, b) => {
      if (!b.prayerCount || a.prayerCount > b.prayerCount) return 1;
      if (a.prayerCount === b.prayerCount)
        return moment(a.createdDateTime) > moment(b.createdDateTime) ? 1 : -1;
      return -1;
    });

  getInteractionComponent = async ({ prayerId }) => {
    const { RockConstants } = this.context.dataSources;
    const { id: entityTypeId } = await this.request('EntityTypes')
      .filter(`Name eq 'Rock.Model.PrayerRequest'`)
      .select('Id')
      .first();

    const channel = await RockConstants.createOrFindInteractionChannel({
      channelName: ROCK_MAPPINGS.INTERACTIONS.CHANNEL_NAME,
      entityTypeId,
    });
    return RockConstants.createOrFindInteractionComponent({
      componentName: `${ROCK_MAPPINGS.INTERACTIONS.PRAYER_REQUEST} - ${prayerId}`,
      channelId: channel.id,
      entityId: parseInt(prayerId, 10),
    });
  };

  createInteraction = async ({ prayerId }) => {
    const { Auth } = this.context.dataSources;

    const interactionComponent = await this.getInteractionComponent({
      prayerId,
    });

    const currentUser = await Auth.getCurrentPerson();
    const { requestedByPersonAliasId } = await this.getFromId(prayerId);

    // determine whether to send notification
    // Rock is triggering the workflow based on the Summary field
    // if it's older than 2 hours ago
    // TODO this check is taking on average 2.5 sec and will only get slower
    // we need a better algorithm
    let time;
    try {
      const { interactionDateTime } = await this.request('Interactions')
        .filter(`InteractionData eq '${requestedByPersonAliasId}'`)
        .andFilter(`InteractionSummary eq 'PrayerNotificationSent'`)
        .orderBy('InteractionDateTime', 'desc')
        .select('InteractionDateTime')
        .first();
      time = interactionDateTime;
    } catch (e) {
      // report error for time out
      bugsnagClient.notify(
        new Error('Sorting interactions failed, did not send notification.'),
        {
          metaData: { prayerId },
          severity: 'warning',
        }
      );
    }

    const summary =
      !time || moment(time).add(2, 'hours') < moment()
        ? 'PrayerNotificationSent'
        : '';

    this.post('/Interactions', {
      PersonAliasId: currentUser.primaryAliasId,
      InteractionComponentId: interactionComponent.id,
      InteractionSessionId: this.context.sessionId,
      Operation: 'Pray',
      InteractionDateTime: new Date().toJSON(),
      InteractionSummary: summary,
      InteractionData: `${requestedByPersonAliasId}`,
    });
  };

  // QUERY ALL PrayerRequests
  getAll = async () => {
    const {
      dataSources: { Auth },
    } = this.context;

    const { primaryAliasId } = await Auth.getCurrentPerson();

    const prayers = await this.request()
      .filter(`RequestedByPersonAliasId ne ${primaryAliasId}`)
      .andFilter(`IsActive eq true`)
      .andFilter(`IsApproved eq true`)
      .andFilter(
        `ExpirationDate gt datetime'${moment
          .tz(ROCK.TIMEZONE)
          .format()}' or ExpirationDate eq null`
      )
      .get();
    return this.sortPrayers(prayers);
  };

  getAllByCampus = async (id = '') => {
    const {
      dataSources: { Auth, Campus },
    } = this.context;

    const { id: personId, primaryAliasId } = await Auth.getCurrentPerson();

    let campusID;
    if (id === '') {
      campusID = (await Campus.getForPerson({ personId })).id;
    } else {
      campusID = parseGlobalId(id).id;
    }

    const prayers = await this.request('PrayerRequests/Public')
      .filter(
        `(CampusId eq ${campusID}) and (RequestedByPersonAliasId ne ${primaryAliasId})`
      )
      .get();
    return this.sortPrayers(prayers);
  };

  // QUERY PrayerRequests from Current Person
  getFromCurrentPerson = async () => {
    try {
      const {
        dataSources: { Auth },
      } = this.context;

      const { primaryAliasId } = await Auth.getCurrentPerson();

      const prayers = await this.request('PrayerRequests/Public')
        .filter(`RequestedByPersonAliasId eq ${primaryAliasId}`)
        .get();
      // Sort user prayers by date - newest first
      return prayers.sort((a, b) =>
        moment(a.createdDateTime) < moment(b.createdDateTime) ? 1 : -1
      );
    } catch (err) {
      throw new Error(err);
    }
  };

  // QUERY PrayerRequests from groups
  getFromGroups = async () => {
    const {
      dataSources: { Auth, Group },
    } = this.context;

    const groupTypeIds = Group.getGroupTypeIds();
    const { id } = await Auth.getCurrentPerson();

    const prayers = await this.request(
      `PrayerRequests/GetForGroupMembersOfPersonInGroupTypes/${id}?groupTypeIds=${groupTypeIds}&excludePerson=true`
    ).get();
    return this.sortPrayers(prayers);
  };

  getFromId = (id) =>
    this.request()
      .find(id)
      .get();

  getFromIds = (ids) => {
    const idsFilter = ids.map((id) => `Id eq ${id}`);
    return this.request()
      .filterOneOf(idsFilter)
      .get();
  };

  getSavedPrayers = async () => {
    const {
      dataSources: { Followings },
    } = this.context;

    const followedPrayersRequest = await Followings.getFollowingsForCurrentUser(
      {
        type: 'PrayerRequest',
      }
    );

    const entities = await followedPrayersRequest.get();
    if (!entities.length) return [];

    const entityIds = entities.map((entity) => entity.entityId);
    const prayers = await this.getFromIds(uniq(entityIds));

    // filter out flagged prayers
    return prayers.filter(
      (prayer) => !prayer.flagCount || prayer.flagCount === 0
    );
  };

  // MUTATION increment prayed, for a request
  incrementPrayed = async (parsedId) => {
    try {
      await this.put(`PrayerRequests/Prayed/${parsedId}`, {});
      return this.getFromId(parsedId);
    } catch (e) {
      throw new Error(`Unable to increment prayer!`);
    }
  };

  // MUTATION flag a prayer request
  flag = async (parsedId) => {
    try {
      await this.put(`PrayerRequests/Flag/${parsedId}`, {});
      return this.getFromId(parsedId);
    } catch (e) {
      throw new Error(`Unable to flag prayer!`);
    }
  };

  // MUTATION Delete a prayer request
  deletePrayer = async (parsedId) => {
    try {
      this.expanded = false;
      const deletedPrayer = await this.getFromId(parsedId);
      await this.delete(`PrayerRequests/${parsedId}`);
      return deletedPrayer;
    } catch (e) {
      throw new Error(`Unable to delete prayer!`);
    }
  };

  // MUTATION add public prayer request
  add = async ({ text, isAnonymous }) => {
    const {
      dataSources: { Auth },
    } = this.context;
    const {
      primaryAliasId,
      nickName,
      firstName,
      lastName,
      primaryCampusId,
    } = await Auth.getCurrentPerson();

    try {
      const prayerId = await this.post('/PrayerRequests', {
        FirstName: nickName || firstName, // Required by Rock
        LastName: lastName,
        Text: text,
        CategoryId: ROCK_MAPPINGS.GENERAL_PRAYER_CATEGORY_ID,
        // default to web campus
        CampusId: primaryCampusId || ROCK_MAPPINGS.WEB_CAMPUS_ID,
        IsPublic: !isAnonymous,
        RequestedByPersonAliasId: primaryAliasId,
        IsApproved: true,
        IsActive: true,
        EnteredDateTime: moment()
          .tz(ROCK.TIMEZONE)
          .format(), // Required by Rock
      });
      return this.getFromId(prayerId);
    } catch (e) {
      throw new Error(`Unable to create prayer request!`);
    }
  };
}
