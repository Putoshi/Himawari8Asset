const fs = require('fs').promises;
const _fs = require('fs');
const fsExtra = require('fs-extra')
const path = require('path');
const zlib = require('zlib');
const Config = require('../config/Config');


const credential = require('../config/credential.json').key['production'];
const S3Params = require('../config/credential.json').S3Param['production'];
// const distributionId = require('../config/credential.json').distributionId['production'];


const { deploy } = require('cfs3-publish');

const filePatterns = /.mp4|.mov|.png/;


module.exports = class S3Uploader {

  static async upload() {
    const files = await fs.readdir(Config.DIST_PATH);

    // TMP Folder CleanUp
    await S3Uploader.refresh(Config.TMP_UPLOAD_PATH);


    // Create S3 Upload Folder
    await fsExtra.mkdirpSync(`${path.join(Config.TMP_UPLOAD_PATH, Config.UPLOAD_PATH)}`);

    for (let i = 0; i < files.length; i++) {
      if (filePatterns.test(files[i])) {
        // console.log(files[i]);

        const src = `${Config.DIST_PATH}${files[i]}`;
        const dest = `${path.join(Config.TMP_UPLOAD_PATH, Config.UPLOAD_PATH)}${files[i]}`;

        // Copy
        _fs.copyFileSync(src, dest);


        // // Gzip
        // const content = await fs.readFile(`${Config.DIST_PATH}${files[i]}`);
        // zlib.gzip(content, function (err, binary) {
        //   _fs.writeFileSync(`${Config.TMP_UPLOAD_PATH}${files[i]}.gz`, binary);
        // });


      }
    }

    // S3 Upload
    await S3Uploader.S3Upload();
  }

  static async refresh (){
    await fsExtra.remove(Config.TMP_UPLOAD_PATH);
    await fsExtra.mkdirpSync(Config.TMP_UPLOAD_PATH);
  }

  static async S3Upload (){
    console.log('////// S3Upload //////');

    // Create S3 Upload Folder
    await fsExtra.mkdirpSync(Config.UPLOAD_PATH);

    // Copy
    fsExtra.copySync(Config.TMP_UPLOAD_PATH, Config.UPLOAD_PATH);

    // process.chdir(Config.TMP_UPLOAD_PATH);

    await deploy(
      {
        pattern: `${Config.UPLOAD_PATH}**/*`,
        config: {
          accessKeyId: credential.accessKeyId,
          secretAccessKey: credential.secretAccessKey,
        },
        params: {
          Bucket: S3Params.Bucket,
          'Cache-Control': S3Params['Cache-Control']
        },
        // deleteRemoved: true,
        // deleteProtectionPatterns: [
        //   `!${Config.UPLOAD_PATH}/**`,
        // ]
      }
    )

    await fsExtra.remove(Config.TMP_UPLOAD_PATH);
    await fsExtra.remove(Config.UPLOAD_PATH);
  }

}
