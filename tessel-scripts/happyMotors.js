var tessel = require('tessel');
var servolib = require('servo-pca9685');

var servo = servolib.use(tessel.port['C']);

var servo1 = 1;
var servo2 = 2;

servo.on('ready', function () {
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

});