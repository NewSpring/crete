export default [
  {
    id: 1,
    attributeValues: {
      noteType: { value: 'header' },
      text: { value: '1. this is point one' },
      book: { value: '' },
      reference: { value: '' },
      translation: { value: '' },
      allowsComment: { value: 'False' },
    },
  },
  {
    id: 2,
    attributeValues: {
      noteType: { value: 'text' },
      text: { value: 'this is a subpoint' },
      book: { value: '' },
      reference: { value: '' },
      translation: { value: '' },
      allowsComment: { value: 'True' },
    },
  },
  {
    id: 3,
    attributeValues: {
      noteType: { value: 'scripture' },
      text: { value: '' },
      book: { value: '1234-234-234' },
      reference: { value: '3:5-6' },
      translation: { value: '23423-23423-23423' },
      allowsComment: { value: 'True' },
    },
  },
  {
    id: 4,
    attributeValues: {
      noteType: { value: 'scripture' },
      text: { value: '' },
      book: { value: 'John' },
      reference: { value: '3:16' },
      translation: { value: '' },
      allowsComment: { value: 'True' },
    },
  },
  {
    id: 5,
    attributeValues: {
      noteType: { value: 'text' },
      text: { value: 'this is another __subpoint__' },
      book: { value: '' },
      reference: { value: '' },
      translation: { value: '' },
      allowsComment: { value: 'True' },
    },
  },
  {
    id: 6,
    attributeValues: {
      noteType: { value: 'invalid' },
      text: { value: '' },
      book: { value: '' },
      reference: { value: '' },
      translation: { value: '' },
      allowsComment: { value: 'True' },
    },
  },
];
