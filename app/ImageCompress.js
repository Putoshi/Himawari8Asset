const compress_images = require('compress-images');
const Config = require('../config/Config');
const himawari = require('himawari');

module.exports = class ImageCompress {

  constructor() {
  }

  static compress() {
    // console.log(`${Config.TMP_PATH}**/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}`);
    const promise = new Promise(function (resolve, reject) {
      compress_images(`${Config.TMP_PATH}**/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}`, Config.DIST_PATH, {
          compress_force: false,
          statistic: true,
          autoupdate: true
        }, false,
        { jpg: { engine: 'mozjpeg', command: ['-quality', '60'] } },
        { png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] } },
        { svg: { engine: 'svgo', command: '--multipass' } },
        { gif: { engine: 'gifsicle', command: ['--colors', '64', '--use-col=web'] } },
        function (error, completed, statistic) {
          if (error) reject();
          if (completed) resolve();
        }
      );
    });
    promise.catch(() => {
      console.log('compress ERROR');
      return Promise.reject('compress ERROR');
    });
    return promise;
  }
}
