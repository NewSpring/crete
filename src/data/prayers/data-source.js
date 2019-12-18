import RockApolloDataSource from '@apollosproject/rock-apollo-data-source';
import ApollosConfig from '@apollosproject/config';
import moment from 'moment-timezone';
import { uniq } from 'lodash';
import bugsnagClient from '../../bugsnag';

const { ROCK, ROCK_MAPPINGS } = ApollosConfig;
export default class Prayer extends RockApolloDataSource {
  resource = 'PrayerRequests';

  expanded = true;

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

  sortPrayers = (prayers) =>
    prayers.sort((a, b) => {
      if (!b.prayerCount || a.prayerCount > b.prayerCount) return 1;
      if (a.prayerCount === b.prayerCount)
        return moment(a.createdDateTime) > moment(b.createdDateTime) ? 1 : -1;
      return -1;
    });

  getPrayerMenuCategories = async () => {
    const {
      dataSources: { Auth, Campus },
    } = this.context;

    const allCategories = await this.request('ContentChannelItems')
      .filter(
        `ContentChannelId eq ${ROCK_MAPPINGS.PRAYER_MENU_CATEGORIES_CHANNEL_ID}`
      )
      .orderBy('Order')
      .get();
    let filteredCategories = allCategories || [];

    const { id } = await Auth.getCurrentPerson();

    // filter out campus
    const campus = await Campus.getForPerson({ personId: id });
    if (campus && campus.name === 'Web')
      filteredCategories = allCategories.filter(
        (category) =>
          category.attributeValues.requiresCampusMembership.value === 'False'
      );
    // filter out groups
    // TODO: need a GraphQL enpoint that says if I'm in any groups
    // https://github.com/ApollosProject/apollos-prototype/issues/676
    return filteredCategories;
  };

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
    let summary;
    try {
      const { interactionDateTime: time } = await this.request('Interactions')
        .filter(`InteractionData eq '${requestedByPersonAliasId}'`)
        .andFilter(`InteractionSummary eq 'PrayerNotificationSent'`)
        .orderBy('InteractionDateTime', 'desc')
        .select('InteractionDateTime')
        .first();
      summary =
        moment(time).add(2, 'hours') < moment() ? 'PrayerNotificationSent' : '';
    } catch (e) {
      bugsnagClient.notify(
        new Error('Sorting interactions failed, did not send notification.'),
        {
          metaData: { prayerId },
          severity: 'warning',
        }
      );
      summary = '';
    }

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

  getPrayers = async (type) => {
    const {
      dataSources: { Auth, Group },
    } = this.context;

    if (type === 'SAVED') return this.getSavedPrayers();

    const {
      id: personId,
      primaryAliasId,
      primaryCampusId,
    } = await Auth.getCurrentPerson();

    // TODO: need to fix this endpoint to use IsPublic vs IsAnonymous
    if (type === 'GROUP')
      return this.getFromGroups(Group.getGroupTypeIds(), personId);

    const prayers = await this.request()
      .filter(
        `RequestedByPersonAliasId ${
          type === 'USER' ? 'eq' : 'ne'
        } ${primaryAliasId}`
      )
      .andFilter(`IsActive eq true`)
      .andFilter(`IsApproved eq true`)
      .andFilter(
        `ExpirationDate gt datetime'${moment
          .tz(ROCK.TIMEZONE)
          .format()}' or ExpirationDate eq null`
      )
      .andFilter(type === 'CAMPUS' ? `CampusId eq ${primaryCampusId}` : '')
      .get();

    return this.sortPrayers(prayers);
  };

  getFromGroups = async (groupTypeIds, personId) => {
    const prayers = await this.request(
      `PrayerRequests/GetForGroupMembersOfPersonInGroupTypes/${personId}?groupTypeIds=${groupTypeIds}&excludePerson=true`
    ).get();
    return this.sortPrayers(prayers);
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

  incrementPrayed = async (id) => {
    try {
      await this.put(`PrayerRequests/Prayed/${id}`, {});
      return this.getFromId(id);
    } catch (e) {
      bugsnagClient.notify(new Error('Increment prayer failed.'), {
        metaData: { id },
        severity: 'warning',
      });
      return null;
    }
  };

  flag = async (id) => {
    try {
      await this.put(`PrayerRequests/Flag/${id}`, {});
      return this.getFromId(id);
    } catch (e) {
      bugsnagClient.notify(new Error('Flag prayer failed.'), {
        metaData: { id },
        severity: 'warning',
      });
      return null;
    }
  };

  delete = async (id) => {
    try {
      this.expanded = false;
      const deletedPrayer = await this.getFromId(id);
      await this.delete(`PrayerRequests/${id}`);
      return deletedPrayer;
    } catch (e) {
      bugsnagClient.notify(new Error('Delete prayer failed.'), {
        metaData: { id },
        severity: 'warning',
      });
      return null;
    }
  };

  add = async ({ text, isAnonymous }) => {
    const {
      dataSources: { Auth },
    } = this.context;
    const {
      primaryAliasId,
      nickName,
      firstName,
      lastName,
      email,
      primaryCampusId,
    } = await Auth.getCurrentPerson();

    try {
      const prayerId = await this.post('/PrayerRequests', {
        FirstName: nickName || firstName,
        LastName: lastName,
        Email: email,
        Text: text,
        CategoryId: ROCK_MAPPINGS.GENERAL_PRAYER_CATEGORY_ID,
        CampusId: primaryCampusId || ROCK_MAPPINGS.WEB_CAMPUS_ID,
        IsPublic: !isAnonymous,
        RequestedByPersonAliasId: primaryAliasId,
        CreatedByPersonAliasId: primaryAliasId,
        IsApproved: true,
        IsActive: true,
        AllowComments: false,
        IsUrgent: false,
        EnteredDateTime: moment()
          .tz(ROCK.TIMEZONE)
          .format(),
        ApprovedOnDateTime: moment()
          .tz(ROCK.TIMEZONE)
          .format(),
        ExpirationDate: moment()
          .tz(ROCK.TIMEZONE)
          .add(2, 'weeks')
          .format(),
      });
      return this.getFromId(prayerId);
    } catch (e) {
      bugsnagClient.notify(new Error('Adding prayer failed.'), {
        metaData: { primaryAliasId, text, isAnonymous },
        severity: 'warning',
      });
      return null;
    }
  };
}
