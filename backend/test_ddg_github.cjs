const https = require('https');
https.get('https://html.duckduckgo.com/html/?q=site:github.com+%22gstincheck.co.in%2Fcheck%2F%22', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const snippets = data.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g);
    console.log(snippets);
  });
});
