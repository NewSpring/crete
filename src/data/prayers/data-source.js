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
      componentName: `${
        ROCK_MAPPINGS.INTERACTIONS.PRAYER_REQUEST
      } - ${prayerId}`,
      channelId: channel.id,
      entityId: parseInt(prayerId, 10),
    });
  };

  createInteraction = async ({ prayerId }) => {
    const { Auth } = this.context.dataSources;

    const { id: interactionId } = await this.getInteractionComponent({
      prayerId,
    });

    const { primaryAliasId } = await Auth.getCurrentPerson();
    const { requestedByPersonAliasId } = await this.getFromId(prayerId);

    // determine whether to send notification
    // Rock is triggering the workflow based on the Summary field
    // if it's older than 2 hours ago
    let summary;
    try {
      const result = await this.post(
        'Lava/RenderTemplate',
        `{% sql %}
          SELECT TOP 1 i.InteractionDateTime
          FROM Interaction i
          WHERE i.InteractionSummary = 'PrayerNotificationSent'
          AND i.InteractionData = '${requestedByPersonAliasId}'
          AND i.Operation = 'Pray'
          ORDER BY i.InteractionDateTime DESC
        {% endsql %}{% for result in results %}{{ result.InteractionDateTime }}{% endfor %}`
      );
      summary =
        moment(result, 'MM/DD/YYYY HH:mm:ss a').add(2, 'hours') < moment()
          ? 'PrayerNotificationSent'
          : '';
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
      PersonAliasId: primaryAliasId,
      InteractionComponentId: interactionId,
      InteractionSessionId: this.context.sessionId,
      Operation: 'Pray',
      InteractionDateTime: moment().format('MM/DD/YYYY HH:mm:ss'),
      InteractionSummary: summary,
      InteractionData: `${requestedByPersonAliasId}`,
    });
  };

  isInteractedWith = async (prayerId) => {
    const { Auth } = this.context.dataSources;
    const { id } = await this.getInteractionComponent({
      prayerId,
    });
    const { primaryAliasId } = await Auth.getCurrentPerson();
    const interaction = await this.request('Interactions')
      .filter(`InteractionComponentId eq ${id}`)
      .andFilter(`PersonAliasId eq ${primaryAliasId}`)
      .select('Id')
      .first();
    return !!interaction;
  };

  byPrayerFeed = async (type) => {
    const {
      dataSources: { Auth, Group },
    } = this.context;

    if (type === 'SAVED') return this.bySaved();

    const {
      id: personId,
      primaryAliasId,
      primaryCampusId,
    } = await Auth.getCurrentPerson();
    if (type === 'GROUP')
      return this.byGroups(Group.getGroupTypeIds(), personId);

    return this.request()
      .filter(
        `RequestedByPersonAliasId ${
          type === 'USER' ? 'eq' : 'ne'
        } ${primaryAliasId}`
      )
      .andFilter(`IsActive eq true`)
      .andFilter(`IsApproved eq true`)
      .andFilter(
        type !== 'USER'
          ? `ExpirationDate gt datetime'${moment
              .tz(ROCK.TIMEZONE)
              .format()}' or ExpirationDate eq null`
          : ''
      )
      .andFilter(type !== 'USER' ? `Answer eq null or Answer eq ''` : '')
      .andFilter(type === 'CAMPUS' ? `CampusId eq ${primaryCampusId}` : '')
      .sort(
        type === 'USER'
          ? [{ field: 'EnteredDateTime', direction: 'desc' }]
          : [
              { field: 'PrayerCount', direction: 'asc' },
              { field: 'EnteredDateTime', direction: 'asc' },
            ]
      );
  };

  // deprecated
  getPrayers = async (type) => {
    const prayersCursor = await this.byPrayerFeed(type);
    const prayers = await prayersCursor.get();
    return this.sortPrayers(prayers);
  };

  byGroups = async (groupTypeIds, personId) =>
    // TODO: need to fix this endpoint to use IsPublic vs IsAnonymous
    // right now I don't think it will pull any anonymous prayers
    this.request(
      `PrayerRequests/GetForGroupMembersOfPersonInGroupTypes/${personId}?groupTypeIds=${groupTypeIds}&excludePerson=true`
    );

  bySaved = async () => {
    const {
      dataSources: { Followings },
    } = this.context;

    const followedPrayersRequest = await Followings.getFollowingsForCurrentUser(
      {
        type: 'PrayerRequest',
      }
    );

    const entities = await followedPrayersRequest.get();
    if (!entities.length) return this.request().empty();

    const entityIds = entities.map((entity) => entity.entityId);
    return this.request()
      .filterOneOf(uniq(entityIds).map((id) => `Id eq ${id}`))
      .andFilter(`IsActive eq true`)
      .andFilter(`IsApproved eq true`);
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

  deletePrayer = async (id) => {
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

  editPrayer = async ({ id, answer = null }) => {
    try {
      await this.patch(`/PrayerRequests/${id}`, {
        Answer: answer,
      });
      return this.getFromId(id);
    } catch (e) {
      bugsnagClient.notify(new Error('Editing prayer answer failed.'), {
        metaData: { rockPrayerID: id },
        severity: 'warning',
      });
      return null;
    }
  };
}
