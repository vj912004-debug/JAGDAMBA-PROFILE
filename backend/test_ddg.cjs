const https = require('https');
https.get('https://html.duckduckgo.com/html/?q=24AAQFN3953R1ZE', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const snippets = data.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g);
    console.log(snippets);
  });
});
