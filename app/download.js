const Himawari = require('./Himawari');
const ImageCompress = require('./ImageCompress');
const VideoMaker = require('./VideoMaker');
const Config = require('../config/Config');
const himawari = new Himawari();


const getOneDay = async function () {
  await himawari.refresh(Config.TMP_PATH);
  await himawari.refresh(Config.DIST_PATH);
  await himawari.getOneDay();
  await ImageCompress.compress();
  await VideoMaker.createVideo();
};

himawari.init().then((result) => {
  getOneDay();
});
