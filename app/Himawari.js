const fs = require('fs').promises;
const axios = require('axios');
const himawari = require('himawari');
const exec = require('child_process').exec;
const path = require('path');
const moment = require('moment');
const momentTimezone = require('moment-timezone');

const Config = require('../config/Config');

const TENMIN = 10 * 60 * 1000;
const JST2GMT = 9 * 6 * TENMIN;
const ONEDAY = 24 * 6 * TENMIN;

module.exports = class Himawari {

  constructor() {
    this.latest = null;
    this.zoom = 2;
  }

  init() {
    return this.getLatestData().then((data) => {
      if (data.data.date == undefined) {
        console.error('Fetch Error!!');
        return false;
      } else {
        console.log(data.data.date);
      }

      let t = moment(new Date(`${data.data.date}`).getTime() + JST2GMT).toDate(); // .tz('Asia/Tokyo')
      this.latest = t;
      const fd = Himawari.formatDate(this.latest, 'yyyyMMddHHmm');
      console.log(`LATEST : ${fd}`);
    }).catch(error => {
      console.log(`Error! HTTP Status: ${error}`);
      // const {
      //   status,
      //   statusText
      // } = error.response;
      // console.log(`Error! HTTP Status: ${status} ${statusText}`);
    });
  }

  async getOneDay() {
    const loopCnt = 6 * 24;
    for (let i = 0; i < loopCnt; i++) {
      let target = this.latest.getTime() - TENMIN * i;
      // let target = 1641778800000 - TENMIN * i;
      await this.getImage(new Date(target)).catch(()=>{
        console.log(`${target} Through`);
      });
    }
  }

  async getNew() {
    await this.getImage(new Date(this.latest.getTime())).catch(() => console.log('getNew Error!'));
  }

  async refresh(_path) {
    const files = await fs.readdir(_path);
    console.log(files);

    files.forEach(async function (file) {
      const deletefiles = await fs.unlink(`${_path}/${file}`);
    });
  }

  async deleteOld(_path) {
    const files = await fs.readdir(_path);
    files.forEach(async (file)=>{
      const dateStr = file.split('.')[0];
      const m = moment({
        year       : parseInt(dateStr.slice(0,4)),
        month      : parseInt(dateStr.slice(4,6)) - 1,
        day        : parseInt(dateStr.slice(6,8)),
        hour       : parseInt(dateStr.slice(8,10)),
        minute     : parseInt(dateStr.slice(10,12)),
      });

      const beforeOneDay = moment(this.latest.getTime() + JST2GMT - ONEDAY).toDate();
      const fileTimestamp = moment(m.toDate().getTime() + JST2GMT).toDate();

      if(fileTimestamp.getTime() <= beforeOneDay.getTime()) {
        console.log(`1日以上経った古いファイル削除 : ${_path}/${files[0]}`);
        const deletefiles = await fs.unlink(`${_path}/${files[0]}`);
      }
    });

  }

  getImage(_date) {
    const fd = Himawari.formatDate(_date, 'yyyyMMddHHmm');
    let zoom = this.zoom;
    const promise = new Promise(function (resolve, reject) {
      himawari({
        zoom: zoom,
        date: new Date(_date.getTime() - JST2GMT), //Thu Jan 06 2022 22:20:00 GMT+0900 (Japan Standard Time)
        outfile: `${Config.TMP_PATH}${fd}.jpg`,
        debug: false,
        infrared: false,
        skipEmpty: true,
        parallel: false,
        timeout: 30000,
        success: function (info) {
          console.log(info);
          resolve();
        },
        error: function (err) {
          console.log('himawari.js ERROR');
          console.log(err);
          reject();
        },
        chunk: function (info) {
          console.log(fd + ': ' + info.part + '/' + info.total);
        }
      });

    });
    return promise;
  }

  async getLatestData() {
    try {
      const url = 'https://himawari8.nict.go.jp/img/FULL_24h/latest.json';
      return await axios.get(url);
    } catch (err) {
      console.log(err);
    }
  }

  static formatDate(date, format) {
    format = format.replace(/yyyy/g, date.getFullYear());
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
    format = format.replace(/dd/g, ('0' + date.getDate()).slice(-2));
    format = format.replace(/HH/g, ('0' + date.getHours()).slice(-2));
    format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
    format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
    format = format.replace(/SSS/g, ('00' + date.getMilliseconds()).slice(-3));
    return format;
  };
}
