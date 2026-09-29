const { config } = require('dotenv');
config();
const https = require('https');
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('No BOT_TOKEN set');
  process.exit(2);
}
const url = 'https://api.telegram.org/bot' + token + '/getWebhookInfo';
https.get(url, (res) => {
  let d = '';
  res.on('data', (c) => d += c);
  res.on('end', () => {
    try {
      const obj = JSON.parse(d);
      const out = {
        ok: obj.ok,
        url: obj.result && obj.result.url,
        pending_update_count: obj.result && obj.result.pending_update_count,
        last_error_message: obj.result && obj.result.last_error_message,
        last_error_date: obj.result && obj.result.last_error_date,
        ip_address: obj.result && obj.result.ip_address
      };
      console.log(JSON.stringify(out, null, 2));
    } catch (e) {
      console.log('RAW:', d);
    }
  });
}).on('error', (e) => {
  console.error('ERR', e.message);
});
