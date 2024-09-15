require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
})
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

const Url = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});



// Your first API endpoint
app.post('/api/shorturl', function(req, res, next) {
  let url = req.body.url;
  if (!url.match(/http+[s]?:\/\/[www.]?[a-z0-9:\/?=]*(.com)*/)) {
    res.json({ error: 'invalid url' });
    return;
  }
  next();
}, function(req, res) {
  let url = req.body.url;
  let shortenedUrl = Math.floor(Math.random() * 1000000);
  
  const newUrl = new Url({
    original_url: url,
    short_url: shortenedUrl
  });
  newUrl.save().then(() => console.log('Url saved to MongoDB')).catch((err) => console.error(err));

  res.json({ "original_url": url, "short_url": shortenedUrl });
});

app.get('/api/shorturl/:shortUrl', function(req, res) {
  let shortUrl = req.params.shortUrl;

  Url.findOne({ short_url: shortUrl })
    .then((url) => {
      if (!url || !url.original_url) {
        return res.json({ error: 'invalid url' }); // Return to stop execution
      } else {
        return res.redirect(url.original_url); // Use return for consistent flow
      }
    })
    .catch((err) => {
      console.error(err); // Log the error for debugging
      res.status(500).json({ error: 'server error' }); // Handle server errors
    });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
