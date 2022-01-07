const fs = require('fs').promises;
const axios = require('axios');
const himawari = require('himawari');
const exec = require('child_process').exec;
const path = require('path');
const moment = require('moment');
const momentTimezone = require('moment-timezone');


const Queue = require('./Queue');
const Config = require('../config/Config');

const TENMIN = 10 * 60 * 1000;
const JST2GMT = 9 * 6 * TENMIN;

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
    });
  }

  async getOneDay() {
    console.log('getOneDay');
    const loopCnt = 6 * 24;
    for (let i = 0; i < loopCnt; i++) {
      let target = this.latest.getTime() - TENMIN * i;
      await this.getImage(new Date(target));
    }
  }

  async createVideo() {
    const video = path.join(Config.DIST_PATH, 'earth.mp4');
    await exec('cat ' + path.join(`${Config.DIST_PATH}`, '*.jpg') + ' | ffmpeg -f image2pipe -framerate 12 -vcodec mjpeg -analyzeduration 100M -probesize 100M -i - -vcodec libx264 ' + video, function (err, res) {
      if (err) {
        console.error(err);
      } else {
        console.log('File saved to', video);
      }
    });
  }

  async refresh(_path) {
    const files = await fs.readdir(_path);
    console.log(files);

    files.forEach(async function (file) {
      const deletefiles = await fs.unlink(`${_path}/${file}`);
    });
  }

  getImage(_date) {
    const fd = Himawari.formatDate(_date, 'yyyyMMddHHmm');
    let zoom = this.zoom;
    Queue.add(function () {
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
            console.log(err);
            reject();
          },
          chunk: function (info) {
            console.log(fd + ': ' + info.part + '/' + info.total);
          }
        });
      });
      return promise;
    });
    return Queue.queue;
  }

  async getLatestData() {
    const url = 'https://himawari8.nict.go.jp/img/FULL_24h/latest.json';
    return await axios.get(url);
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
