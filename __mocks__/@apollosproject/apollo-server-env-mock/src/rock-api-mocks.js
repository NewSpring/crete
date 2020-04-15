// TODO not working yet
const mocks = require.requireActual(
  '@apollosproject/apollo-server-env-mock/src/rock-api-mocks'
);

mocks.contentItem = () => {
  const coreContentMocks = mocks.contentItem();
  return {
    ...coreContentMocks,
    MyCustomAttribute: 'blah',
  };
};

export default mocks;
