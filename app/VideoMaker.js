const fs = require('fs').promises;
const exec = require('child_process').exec;
const path = require('path');
const Config = require('../config/Config');
const fsExtra = require('fs-extra');

module.exports = class VideoMaker {

  static async createVideo() {
    const video = path.join(Config.DIST_PATH, 'earth.mp4');

    const createVideo = await (() =>
        new Promise(resolve => {
          exec('cat ' + path.join(`${Config.DIST_PATH}`, '*.jpg') + ' | ffmpeg -f image2pipe -framerate 12 -vcodec mjpeg -analyzeduration 100M -probesize 100M -i - -vcodec libx264 ' + video, function (err, res) {
            if (err) {
              console.error(err);
            } else {
              resolve(`File saved to ${video}`);
            }
          });
        })
    )();

    console.log(createVideo);
  }


  static async resizeVideo() {
    const videoIn = path.join(Config.DIST_PATH, 'earth.mp4');
    const videoOut = path.join(Config.DIST_PATH, 'earth_sp.mp4');

    await fsExtra.remove(videoOut);

    const resize = await (() =>
        new Promise(resolve => {
          exec(`ffmpeg -i ${videoIn} -vf scale=1080:-1 ${videoOut}`, function (err, res) {
            if (err) {
              console.error(err);
            } else {
              resolve(`Resize Video File saved to ${videoOut}`);
            }
          });
        })
    )();

    console.log(resize);
  }
}
