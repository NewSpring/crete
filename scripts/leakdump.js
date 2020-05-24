const fs = require('fs');
const AWS = require('aws-sdk');
const heapdump = require('heapdump');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dump = async () => {
  const filename = `${process.cwd()}/${Date.now()}.heapsnapshot`;
  await heapdump.writeSnapshot(filename);
  return filename;
};

const uploadFile = (filename) => {
  fs.readFile(filename, (err, data) => {
    if (err) throw err;
    const params = {
      Bucket: 'ns.sandbox', // pass your bucket name
      Key: `crete/${filename.split('/')[filename.split('/').length - 1]}`,
      Body: data,
    };
    s3.upload(params, (s3Err, s3Data) => {
      if (s3Err) throw s3Err;
      console.log(`File uploaded successfully at ${s3Data.Location}`);
    });
  });
};

setInterval(async () => {
  const filename = await dump();
  uploadFile(filename);
}, 60000 * 30);
