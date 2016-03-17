var express = require('express');
var http = require('http');
var request = require('request');
var fs = require('fs');
var server = http.createServer();
var app = express();
var swig = require('swig');

// swig template settings
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', swig.renderFile);
swig.setDefaults({cache: false});
app.use(express.static(__dirname + '/public'));

// api keys
var secrets = require('./secrets').msKeys;


server.on('request', app);

server.listen(8888, function () {
 console.log('Server listening on port 8888');
});

app.get('/', function(req, res, next) {
  res.render('index');
})

var currentMood;
if (!currentMood) currentMood = 'neutral';

var data = {
  happiness: {
    video: "https://www.youtube.com/embed/EErSKhC0CZs", // you make my dreams, hall & oates
    title: "Tessel thinks you're feeling happy!",
    message: "WOOHOO!!",
    color: "FFD80D"
  },
  anger: {
    video: "https://www.youtube.com/embed/Wmc8bQoL-J0", // i'm a survivor, destiny's child
    title: "Tessel thinks you're angry!",
    message: "Don't worry, everything will be okay. Here's an empowering anthem to help you channel that anger into something positive!",
    color: "007AFF"
  },
  contempt: {
    video:  "https://www.youtube.com/embed/DVg2EJvvlF8", // imagine, john lennon
    title: "Tessel thinks you're feeling contempt!",
    message: "Here's a little song to remind you of the good in humanity!",
    color: "7BC8FF"
  },
  disgust: {
    video: "https://www.youtube.com/embed/LI7-Cu-9wWM", //kitten video
    title: "Tessel thinks you're feeling disgusted!",
    message: "Here is a video of cute kittens to get the bad thoughts out of your head!",
    color: "F38BA4"
  },
  fear: {
    video: "https://www.youtube.com/embed/UfcAVejslrU", //weightless, marconi union
    title: "Tessel thinks you're feeling afraid!",
    message: "Here's something to make you feel more relaxed and confident!",
    color: "D0C8FF"
  },
  neutral: {
    video: "https://www.youtube.com/embed/eSBybJGZoCU", // pocket computer, kraftwerk
    title: "Tessel thinks you aren't feeling anything!",
    message: "Are you a robot too? :) Here's some sick robo beats!",
    color: "FF5D00"
  },
  sadness: {
    video: "https://www.youtube.com/embed/KIEPmDla9l8", // here comes the sun, beatles
    title: "Tessel thinks you're feeling blue!",
    message: "Here's some music that'll hopefully help you feel a little better.",
    color: "FFD80D"
  },
  surprise: {
    video: "https://www.youtube.com/embed/oiFTXckh0zU", // watermark, enya
    title: "Oh no! Did Tessel surprise you?",
    message: "Here's some music to help normalize your heart rate!",
    color: "007AFF"
  }
};

app.get('/music', function(req, res, next) {

  var templateData = {
    mood: currentMood,
    video: data[currentMood].video,
    title: data[currentMood].title,
    message: data[currentMood].message,
    color: data[currentMood].color
  }
  res.render('music', templateData);

})

app.post('/photo', function (req, res, next) {

    console.log('Request received from Tessel');

    // handle image data
    var imageData = new Buffer(0);
    req.on('data', function (chunk) { 
      imageData = Buffer.concat([imageData, chunk]);
    });

    // when full image ready
    req.on('end', function () {

      fs.writeFileSync('photo.jpg', imageData);

      request({
        method: "POST",
        url: 'https://api.projectoxford.ai/emotion/v1.0/recognize',
        body: imageData,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': secrets.primary
        }
      }, function (err, response, body) {
        // set the mood based on response from API
        if (err) console.error(err);
        console.log('STATUS CODE' + response.statusCode)
        var dominantMood;
        var data = JSON.parse(body);
        if (!data.length) {
          res.sendStatus(400);
        } else {
        var scores = data[0].scores;
          for (var mood in scores) {
            if (!dominantMood) dominantMood = mood;
            if (scores[mood] > scores[dominantMood]) dominantMood = mood;
          }
          currentMood = dominantMood;
          console.log("Set mood to: " + currentMood);
          res.json({mood: dominantMood});
        }
      });

    });

});