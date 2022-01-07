const Himawari = require('./Himawari');
const ImageCompress = require('./ImageCompress');
const Config = require('../config/Config');
const himawari = new Himawari();


const getOneDay = async function(){
  await himawari.refresh(Config.TMP_PATH);
  await himawari.refresh(Config.DIST_PATH);
  await himawari.getOneDay();
  await ImageCompress.compress();
  await himawari.createVideo();
};

himawari.init().then((result)=>{

  getOneDay();

});