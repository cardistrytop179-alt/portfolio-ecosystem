const https = require('https');
const url = 'https://portfolio-gyyg.onrender.com/api/stats';
https.get(url, (res) => {
  let d = '';
  res.on('data', (c) => d += c);
  res.on('end', () => {
    try {
      console.log(JSON.stringify(JSON.parse(d), null, 2));
    } catch (e) {
      console.log('RAW:', d);
    }
  });
}).on('error', (e) => {
  console.error('ERR', e.message);
});
