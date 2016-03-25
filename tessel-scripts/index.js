var http = require('http');
var tessel = require('tessel');
var ambientlib = require('ambient-attx4');
var camera = require('camera-vc0706').use(tessel.port['D']);
var ambient = ambientlib.use(tessel.port['B']);
var notificationLED = tessel.led[3]; // Set up an LED to notify when we're taking a picture

var isCamReady;
camera.on('ready', function(){isCamReady=true})

var servolib = require('servo-pca9685');

var servo = servolib.use(tessel.port['C']);

var servo1 = 1;
var servo2 = 2;

var isServoReady;
servo.on('ready', function () {
    isServoReady = true;
});

ambient.on('ready', function () {
 // Get points of light and sound data.
 ambient.setSoundTrigger(.05)
 console.log('we in here')

  setInterval( function () {
    ambient.getLightLevel( function(err, lightdata) {
      if (err) throw err;
      ambient.getSoundLevel( function(err, sounddata) {
        if (err) throw err;
        console.log("Light level:", lightdata.toFixed(8), " ", "Sound Level:", sounddata.toFixed(8));
      });
    });
  }, 500); // The readings will happen every .5 seconds
});

ambient.on('sound-trigger', function(){



  // Wait for the camera module to say it's ready

  //   console.log('camera on ready')
    notificationLED.high();

//     // Take the picture
    if(isCamReady){
    camera.takePicture(function(err, imageBuffer) {
      console.log('inside of camera take photo')
        if (err) {
          console.log('error taking image', err);
        } else {
          notificationLED.low();
          // Name the image
          var name = 'TESSEL IMAGE - ' + Math.floor(Date.now()*1000) + '.jpg';
          // Save the image
          console.log('Picture saving as', name, '...');

          // process.sendfile(name, imageBuffer);

          var request = http.request({
          hostname: '10.9.106.112', // Where your other process is running
          port: 8888,
          path: '/photo',
          method: 'POST',
          headers: {
              'Content-Type': 'image/jpg',
              'Content-Length': imageBuffer.length
              }
          });
          request.write(imageBuffer);
          request.on('response', function(data){
            console.log("reponse event!");
            if (data && isServoReady) {
              var position = 0;

              servo.configure(servo1, 0.05, 0.05, function () {
                setInterval(function () {
                  console.log('Position (in range 0-1):', position);
                  //  Set servo #1 to position pos.
                  servo.move(servo1, position);
                  servo.move(servo2, position);

                  position += 1;
                  if (position > 1) {
                    position = 0; // Reset servo position
                  }
                }, 500); // Every 500 milliseconds
              });
            }
          });

          console.log('done.');
          // Turn the camera off to end the script
          camera.disable();
        }
      
    })
  }
   ambient.clearSoundTrigger();

    //After 1.5 seconds reset sound trigger
    setTimeout(function () {

        ambient.setSoundTrigger(0.05);

    },1500);

})

ambient.on('error', function (err) {
  console.log(err);
});

camera.on('error', function(err) {
  console.error(err);
});
