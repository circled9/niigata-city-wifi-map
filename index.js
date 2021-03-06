const request = require('request');
const fs = require("fs");
const async = require("async");
const geocoder = require("geocoder");
const Iconv = require('iconv').Iconv;

const dictionary = {
  "BRTバス停（新潟駅前）": {
    lat: 37.913224,
    lng: 139.061163
  },
  "BRTバス停（市役所前）": {
    lat: 37.9165285,
    lng: 139.2380758
  },
  "水の駅「ビュー福島潟」": {
    lat: 37.9135636,
    lng: 139.2380758
  }
};

const formatter = text => {
  const lines = text.split("\n");
  lines.shift(); // ヘッダー行は不要なので削除
  if (lines[lines.length - 1].split(",").length <= 1) {
    lines.pop(); // ファイル最後の改行っぽいので削除
  }

  const total = lines.length;
  var count = 0;
  const iteratee = (item, callback) => {
    count += 1;
    console.log(`${count}/${total}...`);

    const values = item.split(",");
    const name = values[1];
    const address = values[2] + values[3];
    var comment = values[4];
    if (comment) {
      comment = comment.replace(/(\r\n|\n|\r)/gm, "");
    }
    const isEmptyAddress = address.trim() === "";
    if (isEmptyAddress) {
      callback("", null);
    } else {
      // HACK 住所として扱えなそうなパターンを除外
      const formattedAddress = address.split("　")[0]
                                      .split("、")[0]
                                      .replace(/付近$/g, "");
      const resolver = () => geocoder.geocode(formattedAddress, (err, data) => {
        console.log(data);
        console.log(err);
        let latlng;
        const registeredAddressLatLng = dictionary[name];
        if (registeredAddressLatLng) {
          latlng = registeredAddressLatLng;
        } else if (data.status !== "ZERO_RESULTS") {
          latlng = data.results[0].geometry.location
        } else {
          latlng = {lat: 0, lng: 0}; // とりあえずlatlngの墓場に
        }
        const point = {
          name: name,
          address: address,
          comment: comment,
          latlng
        };
        callback(err, point);
      });

      // API rate limitに引っかかるので適当に間隔を開ける
      setTimeout(resolver, 3000);
    }
  };

  const onCompleted = (err, results) => {
    if (err) {
      console.log(err);
    }
    const validResults = results.filter(r => r !== null);
    const data = JSON.stringify(validResults);
    fs.writeFile('docs/niigata-city-wifi-spot.json', data, err => {
      if (err) {
        console.log(err);
      }
    });
    console.log("finished!");
  };

  console.log("convert address to latlng.");
  async.mapSeries(lines, iteratee, onCompleted);
};

const url = "http://www.city.niigata.lg.jp/shisei/seisaku/it/open-data/opendata-kankou/od-citywifi.files/od-city_wifi_ichiran.csv";
request({url, encoding: null}, (error, response, body) => {
  if (!error && response.statusCode === 200) {
    const sjis = new Iconv('SHIFT_JIS', 'UTF-8');
    formatter(sjis.convert(body).toString());
  }
});
