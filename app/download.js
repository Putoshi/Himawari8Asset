const Himawari = require('./Himawari');
const himawari = new Himawari();
himawari.init().then((result)=>{
  himawari.getOneDay();
});