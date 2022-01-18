const moment = require('moment');
const momentTimezone = require('moment-timezone');
const cron = require('node-cron');
const makeDir = require('make-dir');
const fsExtra = require('fs-extra');
const fs = require('fs').promises;
const path = require('path');

const ImageCompress = require('./ImageCompress');
const VideoMaker = require('./VideoMaker');

const S3Uploader = require('./S3Uploader');
const Config = require('../config/Config');
const Himawari = require('./Himawari');
const himawari = new Himawari();


let currentDate = null;
let latest = null;

const getOneDay = async() =>{
  await himawari.refresh(Config.TMP_PATH);
  await himawari.refresh(Config.DIST_PATH);
  await himawari.getOneDay();
  await ImageCompress.compress();
  await VideoMaker.createVideo();
  await VideoMaker.resizeVideo();

  await S3Uploader.upload();
};


// クーロンでファイル更新があった場合に実行
const getNew = async() =>{
  await himawari.refresh(Config.DIST_PATH);
  await himawari.getNew();
  await himawari.deleteOld(Config.TMP_PATH);
  await ImageCompress.compress();
  await VideoMaker.createVideo();
  await VideoMaker.resizeVideo();

  await S3Uploader.upload();
};

// 元データは1日ごとにアーカイブしてく
const archive = async(currentDate) =>{
  console.log(`Data Archive : ${Config.ARCHIVE_PATH}${currentDate}`);
  const archiveDir = await makeDir(`${Config.ARCHIVE_PATH}${currentDate}`);
  const files = await fs.readdir(Config.TMP_PATH);
  for (const file of files) {
    const copyArchives = await fsExtra.copy(`${Config.TMP_PATH}${file}`, `${Config.ARCHIVE_PATH}${currentDate}/${file}`);
  }
};




const startCron = async function(){
  console.log('CRON START');

  cron.schedule('0 */2 * * * *', (d) => {

    himawari.init().then((result)=>{
      let t = moment(new Date(`${himawari.latest}`).getTime());
      if(currentDate == null) currentDate = t.format('YYYYMMDD');

      // 更新があった場合の処理
      if(latest != t.toDate().getTime()) {
        (async () => {
          console.log('データ更新処理');
          await getNew();
          latest = t.toDate().getTime();
        })();
      }

      // 日付変更時
      if(currentDate != t.format('YYYYMMDD')) {
        // アーカイブ
        (async () => {
          console.log('日付変更時処理');
          await archive(currentDate);
          currentDate = t.format('YYYYMMDD');
        })();
      }
    });
  });

};


himawari.init().then((result)=>{
  (async () => {
    await getOneDay();
    await startCron();
  })();
});

