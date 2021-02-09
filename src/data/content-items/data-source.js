import { ContentItem as oldContentItem } from '@apollosproject/data-connector-rock';
import { get, flatten } from 'lodash';
import ApollosConfig from '@apollosproject/config';
import { createGlobalId, parseGlobalId } from '@apollosproject/server-core';
import sanitizeHtmlNode from 'sanitize-html';
import Color from 'color';
import { createAssetUrl } from '../utils';

const {
  ROCK,
  ROCK_CONSTANTS,
  ROCK_MAPPINGS,
  WISTIA,
  BIBLE_API,
} = ApollosConfig;

export default class ContentItem extends oldContentItem.dataSource {
  getCursorByParentContentItemId = async (id) => {
    const associations = await this.request('ContentChannelItemAssociations')
      .filter(`ContentChannelItemId eq ${id}`)
      .cache({ ttl: 60 })
      .get();

    if (!associations || !associations.length) return this.request().empty();

    const cursor = this.getFromIds(
      associations.map(
        ({ childContentChannelItemId }) => childContentChannelItemId
      )
    );
    let sortByOrder = false;

    // If this is true, our transform will be activated.
    // The transform is the only wait to sort by `order`
    const originalOrderBy = cursor.orderBy;

    // Here we hijack the default behavior of the `.order` call, using it to set
    // a value that we are going to use to trigger the `transform`
    cursor.orderBy = (name, direction) => {
      if (name === 'Order') {
        sortByOrder = true;
      }
      // call is important here to preserve the original value of `this` (it should be `cursor`)
      return originalOrderBy.call(cursor, name, direction);
    };

    // Same as above.
    const originalSort = cursor.sort;
    cursor.sort = (sorts) => {
      if (sorts.map(({ field }) => field).includes('Order')) {
        sortByOrder = true;
      }
      return originalSort.call(cursor, sorts);
    };

    cursor.transform((results) => {
      // If we have called .orderBy or .sort w/ `order`, we do our in memory sort.
      if (sortByOrder) {
        return results.sort((a, b) => {
          /**
           * Find the Association Order for the given content channel items
           */
          const { order: orderA } = associations.find(
            (item) => item.childContentChannelItemId === a.id
          );
          const { order: orderB } = associations.find(
            (item) => item.childContentChannelItemId === b.id
          );
          return orderA - orderB;
        });
      }
      return results;
    });

    // Return the cursor.
    return cursor;
  };

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
          return `${book.toLowerCase()} ${reference}`;
        }
      )
    );

    // get one reference at a time. Bible.API doesn't do well with multiple references
    // in the same request
    return Promise.all(
      references.map(async (ref) => {
        const scriptures = await Scripture.getScriptures(ref);
        return scriptures.length ? scriptures[0] : null;
      })
    );
  };

  getWistiaAssetUrls = async (wistiaHashedId) => {
    const media = await this.request(
      `${WISTIA.API_URL}/${wistiaHashedId}.json?access_token=${WISTIA.API_KEY}`
    ).get();
    const assetUrls = { video: '', thumbnail: '' };

    if (!media) return assetUrls;
    media.assets.forEach((asset) => {
      // default to the 720p mp4 to use as an HLS
      if (asset.type === 'HdMp4VideoFile' && asset.height === 720)
        assetUrls.video = asset.url.replace('.bin', '.m3u8');
      else if (asset.type === 'IphoneVideoFile')
        assetUrls.video = asset.url.replace('.bin', '/file.mp4');
      if (asset.type === 'StillImageFile')
        assetUrls.thumbnail = asset.url.replace('.bin', '/file.jpeg');
    });
    // use https
    assetUrls.video = assetUrls.video.replace(
      'http://embed',
      'https://embed-ssl'
    );
    assetUrls.thumbnail = assetUrls.thumbnail.replace(
      'http://embed',
      'https://embed-ssl'
    );
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

  getNotesComments = async (rockContentID) => {
    const { Auth } = this.context.dataSources;
    const { primaryAliasId } = await Auth.getCurrentPerson();
    const comments = await this.request('Notes')
      .filter(`CreatedByPersonAliasId eq ${primaryAliasId}`)
      .andFilter(`EntityId eq ${rockContentID}`)
      .andFilter(`NoteTypeId eq ${ROCK_MAPPINGS.BLOCK_COMMENT_NOTE_TYPE_ID}`)
      .get();

    const commentsHash = {};
    comments.forEach(({ id, text: data }) => {
      const { apollosBlockID, text } = JSON.parse(data);
      commentsHash[apollosBlockID] = {
        id: createGlobalId(id, 'NotesBlockComment'),
        text,
      };
    });
    return commentsHash;
  };

  saveNotesComment = async (contentID, blockID, text) => {
    const { Auth } = this.context.dataSources;
    const { primaryAliasId } = await Auth.getCurrentPerson();

    const data = JSON.stringify({
      apollosBlockID: blockID,
      text,
    });

    // find a saved note for the parent
    const comments = await this.getNotesComments(parseGlobalId(contentID).id);
    const comment = comments[blockID];

    // if there's already a saved note, simply overwrite
    let rockNoteID;
    if (comment) {
      rockNoteID = parseGlobalId(comment.id).id;
      await this.patch(`Notes/${rockNoteID}`, {
        Text: data,
      });
    } else
      rockNoteID = await this.post('Notes', {
        IsSystem: false,
        NoteTypeId: ROCK_MAPPINGS.BLOCK_COMMENT_NOTE_TYPE_ID,
        EntityId: parseGlobalId(contentID).id,
        Text: data,
        CreatedByPersonAliasId: primaryAliasId,
      });
    const note = await this.request('Notes')
      .find(rockNoteID)
      .get();
    return {
      id: createGlobalId(note.id, 'NotesBlockComment'),
      text,
    };
  };

  async getFeatures(item) {
    const features = super.getFeatures(item);

    const parent = await this.getSeries(
      item.id,
      ROCK_MAPPINGS.DEVOTIONAL_SERIES_CHANNEL_ID
    );

    const parentCommentsEnabled = get(
      parent.attributeValues,
      'comments.value',
      'False'
    );
    if (
      parentCommentsEnabled === 'True' &&
      !features.some(({ __typename }) => __typename === 'AddCommentFeature') // We don't want two comment features
    ) {
      const { Feature } = this.context.dataSources;
      const nodeType = item.__type || this.resolveType(item);
      const flagLimit = get(ApollosConfig, 'APP.FLAG_LIMIT', 0);
      features.push(
        Feature.createAddCommentFeature({
          nodeId: item.id,
          nodeType,
          relatedNode: item,
          initialPrompt: this.getAddCommentInitialPrompt(
            parent.attributeValues
          ),
          addPrompt: this.getAddCommentAddPrompt(parent.attributeValues),
        }),
        Feature.createCommentListFeature({
          nodeId: item.id,
          nodeType,
          flagLimit,
        })
      );
    }
    return features;
  }

  getSermonNotes = async (contentID, { value: guid }) => {
    const { MatrixItem, Scripture } = this.context.dataSources;
    const items = await MatrixItem.getItemsFromGuid(guid);
    const comments = await this.getNotesComments(contentID);
    const notes = await Promise.all(
      items.map(
        async ({
          id,
          attributeValues: {
            noteType: { value: type },
            text: { value: text },
            book: { value: bookGUID },
            reference: { value: ref },
            translation: { value: versionGUID },
            allowsComment: { value: comment },
          },
        }) => {
          let book;
          let version;
          let scriptures;
          const blanksRegEx = /__(.*)__/gm;
          switch (type) {
            case 'header':
            case 'text':
              return {
                __typename: 'NotesTextBlock',
                id: createGlobalId(id, 'NotesTextBlock'),
                allowsComment: comment === 'True',
                comment: comments[createGlobalId(id, 'NotesTextBlock')] || null,
                simpleText: text.replace(blanksRegEx, (match, p1) => p1),
                hasBlanks: !!text.match(blanksRegEx),
                hiddenText: text.match(blanksRegEx)
                  ? text.replace(blanksRegEx, (match, p1) =>
                      '_'.repeat(p1.length)
                    )
                  : null,
                isHeader: type === 'header',
              };
            case 'scripture':
              book = await this.request('DefinedValues')
                .filter(`Guid eq guid'${bookGUID}'`)
                .first();
              if (versionGUID === '') {
                const versionName = Object.keys(BIBLE_API.BIBLE_ID)[0];
                version = await this.request('DefinedValues')
                  .filter(`Value eq '${versionName}'`)
                  .first();
              } else {
                version = await this.request('DefinedValues')
                  .filter(`Guid eq guid'${versionGUID}'`)
                  .first();
              }
              scriptures = await Scripture.getScriptures(
                `${book.value} ${ref}`,
                version.value
              );
              return {
                __typename: 'NotesScriptureBlock',
                id: createGlobalId(id, 'NotesScriptureBlock'),
                allowsComment: comment === 'True',
                comment:
                  comments[createGlobalId(id, 'NotesScriptureBlock')] || null,
                simpleText: `${scriptures[0].content
                  .replace(/<[^>]*>?/gm, '')
                  .replace(/(\d)(\D)/gm, (match, p1, p2) => `${p1}) ${p2}`)} ${
                  scriptures[0].reference
                }`,
                scripture: scriptures[0],
              };
            default:
              return null;
          }
        }
      )
    );
    return notes.filter((note) => note !== null);
  };
}
