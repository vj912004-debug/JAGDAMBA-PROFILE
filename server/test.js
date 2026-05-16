import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('OK'));
app.listen(5002, () => console.log('Test server on 5002'));
