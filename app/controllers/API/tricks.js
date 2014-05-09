var mongoose = require('mongoose');
var Trick = mongoose.model('Trick');
var errorHelper = require('mongoose-error-helper').errorHelper;
// var phantom = require('phantom-render-stream');
// var screenshotStream = phantom();
var screenshot = require('url-to-screenshot');
var config = require('../../config/config');
var crypto = require('crypto');
var request = require('request');
var fs = require('fs');

/**
 * Create an Tricks
 */
exports.create = function (req, res, next) {
  var trick = new Trick(req.body)
  trick.user = req.user

  trick.screenShoot(req.body.origin_url, function (err) {
    if (!err) {
      return res.jsonp(trick);
    } else {
      var errPrint     = {}
      errPrint.status  = 400

      if ( err.code == 11000 ) {
        errPrint.message = 'Trick with title '+ trick.title + 'already exist';
      } else {
        errPrint.message = err.message
      }
      errPrint.data    = err.errors
      return res.send(400, errPrint)
    }
  })
}

exports.listTrickByUser = function( req, res, next) {

  var user_id = req.query.user_id

  Trick.find({user : user_id})
    .sort({createdAt: -1})
    .exec(function(err, tricks) {
      var resultPrint     = {}
      resultPrint.status  = 200
      resultPrint.message = 'success'
      resultPrint.data    = tricks
      return res.json(200, resultPrint)
    })
}

exports.screenShootUrl = function(req, res) {
  var Url = req.query.origin_url;

  if(Url) {
    var opts = {
        format:'png'
      , width: 1280
      , height: 960
    }

    var makeSalt = Math.round((new Date().valueOf() * Math.random())) + '';

    var hasFileName = crypto.createHmac('sha1', makeSalt).update( Url ).digest('hex');

    var location_screenshoot = config.root + '/public/screenshot/' + hasFileName + '.' + opts.format;

    request(Url, function (error, response, body) {
      if (!error && response.statusCode == 200) {

          screenshot(Url)
            .width(1280)
            .height(800)
            .capture(function(err, img) {

              if (err) {
                renderDefaultImage(res)
                // throw err;
              }
              res.set('Content-Type', 'image/png');
              res.send(new Buffer(img));
            });
      } else {
        renderDefaultImage(res);
      }
    })
  } else {
    renderDefaultImage(res);
  }
}


var renderDefaultImage = function (res) {
  var readStream = fs.createReadStream( config.root + '/public/img/photo.png' );

  res.set('Content-Type', 'image/png');

  readStream.on('data', function(data) {
    res.send(new Buffer(data));
  });
}
