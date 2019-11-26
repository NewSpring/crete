import ApollosConfig from '@apollosproject/config';

const { ROCK, ROCK_MAPPINGS } = ApollosConfig;

export const createAssetUrl = (value) => {
  if (value.path) {
    return value.path;
  }
  if (value.Key && value.AssetStorageProviderId) {
    return `${ROCK.IMAGE_URL}/${
      ROCK_MAPPINGS.ASSET_STORAGE_PROVIDERS[`${value.AssetStorageProviderId}`]
    }/${value.Key}`;
  }
  return '';
};

export const fakeFunction = () => 'Fake';
