const https = require('https');
https.get('https://gstserver.com/gst/24AAQFN3953R1ZE/', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Extract table rows
    const matches = data.match(/<tr>\s*<td>([^<]+)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g);
    if (matches) {
        matches.forEach(m => {
            const pair = m.match(/<td>([^<]+)<\/td>\s*<td>([\s\S]*?)<\/td>/);
            if (pair) {
                let key = pair[1].trim();
                let val = pair[2].replace(/<[^>]+>/g, '').trim();
                console.log(key, ":", val);
            }
        });
    }
  });
});
