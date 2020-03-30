import { ContentItem as oldContentItem } from '@apollosproject/data-connector-rock';
import { get, flatten } from 'lodash';
import ApollosConfig from '@apollosproject/config';
import { createGlobalId, parseGlobalId } from '@apollosproject/server-core';
import { parseKeyValueAttribute } from '@apollosproject/rock-apollo-data-source';
import sanitizeHtmlNode from 'sanitize-html';
import Color from 'color';
import { createAssetUrl } from '../utils';

const { ROCK, ROCK_CONSTANTS, ROCK_MAPPINGS, WISTIA } = ApollosConfig;

export default class ContentItem extends oldContentItem.dataSource {
  getContentItemScriptures = async ({ value: matrixItemGuid }) => {
    const {
      dataSources: { Scripture, MatrixItem },
    } = this.context;
    if (!matrixItemGuid) return null;
    const matrixItems = await MatrixItem.getItemsFromGuid(matrixItemGuid);
    const references = await Promise.all(
      matrixItems.map(
        async ({
          attributeValues: {
            book: { value: bookGuid },
            reference: { value: reference },
          } = {},
        }) => {
          const { value: book } = await this.request('/DefinedValues')
            .filter(`Guid eq guid'${bookGuid}'`)
            .first();
          return `${book} ${reference}`;
        }
      )
    );

    const query = references.join(',');
    return query !== '' ? Scripture.getScriptures(query) : null;
  };

  getWistiaAssetUrls = async (wistiaHashedId) => {
    const media = await this.request(
      `${WISTIA.API_URL}/${wistiaHashedId}.json?access_token=${WISTIA.API_KEY}`
    ).get();
    const assetUrls = { video: '', thumbnail: '' };

    if (!media) return assetUrls;
    media.assets.forEach((asset) => {
      if (asset.type === 'HlsVideoFile' && asset.height === 720)
        assetUrls.video = asset.url.replace('.bin', '.m3u8');
      else if (asset.type === 'IphoneVideoFile')
        assetUrls.video = asset.url.replace('.bin', '/file.mp4');
      if (asset.type === 'StillImageFile')
        assetUrls.thumbnail = asset.url.replace('.bin', '/file.jpeg');
    });
    return assetUrls;
  };

  attributeIsVideo = ({ key, attributes }) =>
    attributes[key].fieldTypeId === ROCK_CONSTANTS.WISTIA;

  attributeIsImage = ({ key, attributeValues, attributes }) => {
    try {
      return (
        attributes[key].fieldTypeId === ROCK_CONSTANTS.S3_ASSET &&
        !get(JSON.parse(attributeValues[key].value), 'Key', '')
          .split('/')
          .includes('audio') &&
        !get(JSON.parse(attributeValues[key].value), 'Key', '')
          .split('/')
          .includes('video')
      );
    } catch (error) {
      return attributes[key].fieldTypeId === ROCK_CONSTANTS.S3_ASSET;
    }
  };

  attributeIsAudio = ({ key, attributeValues, attributes }) => {
    try {
      return (
        attributes[key].fieldTypeId === ROCK_CONSTANTS.S3_ASSET &&
        get(JSON.parse(attributeValues[key].value), 'Key', '')
          .split('/')
          .includes('audio')
      );
    } catch (error) {
      return attributes[key].fieldTypeId === ROCK_CONSTANTS.S3_ASSET;
    }
  };

  getImages = ({ attributeValues, attributes }) => {
    const imageKeys = Object.keys(attributes).filter((key) =>
      this.attributeIsImage({
        key,
        attributeValues,
        attributes,
      })
    );
    return imageKeys.map((key) => ({
      __typename: 'ImageMedia',
      key,
      name: attributes[key].name,
      sources: attributeValues[key].value
        ? [
            {
              uri: createAssetUrl(JSON.parse(attributeValues[key].value)),
            },
          ]
        : [],
    }));
  };

  getVideos = ({ attributeValues, attributes }) => {
    const videoKeys = Object.keys(attributes).filter((key) =>
      this.attributeIsVideo({
        key,
        attributeValues,
        attributes,
      })
    );

    return Promise.all(
      videoKeys.map(async (key) => {
        let urls = {};
        if (attributeValues[key].value)
          urls = await this.getWistiaAssetUrls(attributeValues[key].value);
        return {
          __typename: 'VideoMedia',
          key,
          name: attributes[key].name,
          embedHtml: get(attributeValues, 'videoEmbed.value', null),
          sources: urls.video ? [{ uri: urls.video }] : [],
          thumbnail: {
            __typename: 'ImageMedia',
            sources: urls.thumbnail ? [{ uri: urls.thumbnail }] : [],
          },
        };
      })
    );
  };

  getAudios = ({ attributeValues, attributes }) => {
    const audioKeys = Object.keys(attributes).filter((key) =>
      this.attributeIsAudio({
        key,
        attributeValues,
        attributes,
      })
    );
    return audioKeys.map((key) => ({
      __typename: 'AudioMedia',
      key,
      name: attributes[key].name,
      sources: attributeValues[key].value
        ? [
            {
              uri: createAssetUrl(JSON.parse(attributeValues[key].value)),
            },
          ]
        : [],
    }));
  };

  getShareUrl = async ({ id, contentChannelId }, parentChannelId) => {
    const contentChannel = await this.context.dataSources.ContentChannel.getFromId(
      contentChannelId
    );
    const childSlug = await this.request('ContentChannelItemSlugs')
      .filter(`ContentChannelItemId eq ${id}`)
      .first();
    let series;
    let seriesSlug;
    if (parentChannelId) {
      series = await this.getSeries(id, parentChannelId);
      seriesSlug = await this.request('ContentChannelItemSlugs')
        .filter(`ContentChannelItemId eq ${series.id}`)
        .first();
    }
    return `${ROCK.SHARE_URL + contentChannel.channelUrl}/${
      series ? `${seriesSlug.slug}/` : ''
    }${childSlug.slug}`;
  };

  getSeries = async (childId, channelId) => {
    // get all children and of all possible parents
    const children = await this.request('ContentChannelItemAssociations')
      .filter(`ChildContentChannelItemId eq ${childId}`)
      .select('ContentChannelItemId')
      .get();

    // create list of parent Id filters
    const parentFilters = children.map(
      ({ contentChannelItemId }) => `Id eq ${contentChannelItemId}`
    );

    // find parent from the list of Id filters and the given channel
    return this.request()
      .filterOneOf(parentFilters)
      .andFilter(`ContentChannelId eq ${channelId}`)
      .first();
  };

  getSeriesItemData = async (seriesId, childChannelId) => {
    // get all possible children for a given parent
    const children = await this.request('ContentChannelItemAssociations')
      .filter(`ContentChannelItemId eq ${seriesId}`)
      .expand('ChildContentChannelItem')
      .get();

    // find the right children
    return children.filter(
      ({ childContentChannelItem: { contentChannelId } = {} }) =>
        contentChannelId === childChannelId
    );
  };

  getSeriesItemCount = async (seriesId, childChannelId) => {
    const items = await this.getSeriesItemData(seriesId, childChannelId);
    return items.length;
  };

  getSeriesItemIndex = async (
    seriesId,
    childChannelId,
    childId,
    dateToFind
  ) => {
    const items = await this.getSeriesItemData(seriesId, childChannelId);

    // sort by date and return the right one
    if (dateToFind) {
      let index;
      const sortedItems = items.sort(
        (a, b) =>
          new Date(a.childContentChannelItem.startDateTime) -
          new Date(b.childContentChannelItem.startDateTime)
      );
      sortedItems.forEach(({ childContentChannelItem }, i) => {
        if (dateToFind === childContentChannelItem.startDateTime) index = i;
      });
      return index + 1;
    }

    // get the order of a specific child
    return items.find(
      ({ childContentChannelItemId }) => childContentChannelItemId === childId
    ).order;
  };

  getFeatures({ attributeValues }) {
    const features = [];
    const { Features } = this.context.dataSources;

    const rawFeatures = get(attributeValues, 'features.value', '');
    parseKeyValueAttribute(rawFeatures).forEach(({ key, value }, i) => {
      const [type, modifier] = key.split('/');
      switch (type) {
        case 'scripture':
          features.push(
            Features.createScriptureFeature({
              reference: value,
              version: modifier,
              id: `${attributeValues.features.id}-${i}`,
            })
          );
          break;
        case 'text':
          features.push(
            Features.createTextFeature({
              text: value,
              id: `${attributeValues.features.id}-${i}`,
            })
          );
          break;
        case 'note':
          features.push(
            Features.createNoteFeature({
              placeholder: value,
              id: `${attributeValues.features.id}-${parseInt(modifier, 10)}`,
            })
          );
          break;
        case 'header':
          features.push(
            Features.createHeaderFeature({
              body: value,
              id: `${attributeValues.features.id}-${i}`,
            })
          );
          break;
        default:
          console.warn(`Received invalid feature key: ${key}`);
      }
    });
    return features;
  }

  getCommunicators = async ({ value: matrixItemGuid } = {}) => {
    const {
      dataSources: { MatrixItem },
    } = this.context;
    if (!matrixItemGuid) return [];
    const matrixItems = await MatrixItem.getItemsFromGuid(matrixItemGuid);
    const communicators = await Promise.all(
      matrixItems.map(async (item) => {
        const {
          attributeValues: {
            communicator: { value: personAliasGuid } = {},
          } = {},
        } = item;
        // some lines may be guest communicators
        if (personAliasGuid === '') return null;
        const { personId } = await this.request('/PersonAlias')
          .filter(`Guid eq guid'${personAliasGuid}'`)
          .first();
        return this.context.dataSources.Person.getFromId(personId);
      })
    );
    // filter out null lines
    return communicators.filter((person) => person);
  };

  getGuestCommunicators = async ({ value: matrixItemGuid } = {}) => {
    const {
      dataSources: { MatrixItem },
    } = this.context;
    if (!matrixItemGuid) return [];
    const matrixItems = await MatrixItem.getItemsFromGuid(matrixItemGuid);
    const guests = matrixItems.map(
      ({
        attributeValues: { guestCommunicator: { value: name } = {} } = {},
      } = {}) => name
    );
    // some lines may be communicators, filter those out
    return guests.filter((name) => name !== '');
  };

  getBySlug = async (slug) => {
    // try to expand short link first
    const link = await this.request('PageShortLinks')
      .filter(`Token eq '${slug}'`)
      .first();
    const path = link
      ? link.url.split('/')[link.url.split('/').length - 1]
      : '';

    // get content item
    const contentItemSlug = await this.request('ContentChannelItemSlugs')
      .filter(`Slug eq '${path !== '' ? path : null || slug}'`)
      .first();
    if (!contentItemSlug) throw new Error(`Slug "${slug}" does not exist.`);

    return this.getFromId(`${contentItemSlug.contentChannelItemId}`);
  };

  async getTheme({ id, attributeValues: { backgroundColor } }) {
    const primary = get(backgroundColor, 'value');
    const type = Color(primary).luminosity() > 0.5 ? 'LIGHT' : 'DARK';

    const theme = {
      type,
      colors: {
        primary,
      },
    };

    if (!primary && id) {
      const parentItemsCursor = await this.getCursorByChildContentItemId(id);
      if (parentItemsCursor) {
        const parentItems = await parentItemsCursor.get();
        if (parentItems.length) {
          const parentThemes = flatten(
            await Promise.all(parentItems.map((i) => this.getTheme(i)))
          ).filter((v) => v);
          if (parentThemes && parentThemes.length) return parentThemes[0];
        }
      }
    }

    // if there's still no primary color set in the CMS, we want to return a null theme so that
    // the front end uses its default theme:
    if (!theme.colors.primary) return null;

    return theme;
  }

  coreSummaryMethod = this.createSummary;

  createSummary = (root) => {
    const { attributeValues } = root;
    const summary = get(attributeValues, 'summary.value', '');
    if (summary !== '') {
      return sanitizeHtmlNode(summary, {
        allowedTags: [],
        allowedAttributes: [],
      });
    }
    return this.coreSummaryMethod(root);
  };

  getUserSermonNotes = async (contentID) => {
    const { Auth } = this.context.dataSources;
    const { primaryAliasId } = await Auth.getCurrentPerson();
    const rockNotes = await this.request('Notes')
      .filter(
        `CreatedByPersonAliasId eq ${primaryAliasId} and EntityId eq ${contentID} and NoteTypeId eq ${ROCK_MAPPINGS.SERMON_NOTE_TYPE_ID}`
      )
      .get();
    console.log(rockNotes);

    return rockNotes.map(({ id, text: data }) => {
      const { apollosFeatureID, text } = JSON.parse(data);
      return {
        id: createGlobalId(id, 'Note'),
        featureID: apollosFeatureID,
        text,
      };
    });
  };

  saveSermonNote = async (contentID, featureID, text) => {
    const { Auth } = this.context.dataSources;
    const { primaryAliasId } = await Auth.getCurrentPerson();
    const data = JSON.stringify({
      apollosFeatureID: featureID,
      text,
    });
    // find a saved note for the feature
    const contentNotes = await this.request('Notes')
      .filter(`CreatedByPersonAliasId eq ${primaryAliasId}`)
      .andFilter(`EntityId eq ${parseGlobalId(contentID).id}`)
      .andFilter(`NoteTypeId eq ${ROCK_MAPPINGS.SERMON_NOTE_TYPE_ID}`)
      .get();
    const featureNotes = contentNotes.filter((note) => {
      const { apollosFeatureID } = JSON.parse(note.text);
      return apollosFeatureID === featureID;
    });
    // if there's already a saved note, simply overwrite
    let noteID;
    if (featureNotes.length) {
      await this.patch(`Notes/${featureNotes[0].id}`, {
        Text: data,
      });
      noteID = featureNotes[0].id;
    } else
      noteID = await this.post('Notes', {
        IsSystem: false,
        NoteTypeId: 46,
        EntityId: parseGlobalId(contentID).id,
        Text: data,
        CreatedByPersonAliasId: primaryAliasId,
      });
    const note = await this.request('Notes')
      .find(noteID)
      .get();
    return {
      id: createGlobalId(note.id, 'Note'),
      featureID,
      text,
    };
  };
}
