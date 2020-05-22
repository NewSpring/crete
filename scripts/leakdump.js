const fs = require('fs');
const AWS = require('aws-sdk');
const heapdump = require('heapdump');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dir = process.cwd();

const dump = () => {
  const filename = `${dir}/${Date.now()}.heapsnapshot`;
  heapdump.writeSnapshot(filename, (err, path) => {
    if (err) throw err;
    console.log('dump written to', path);
  });
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

const filename0 = dump();
uploadFile(filename0);
setInterval(() => {
  const filename = dump();
  uploadFile(filename);
}, 60000 * 30);
