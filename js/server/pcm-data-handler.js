var pcm = require('pcm'),
    fs = require('fs');

var samples = new Array();
var packetLength = (1200 * 2);

function getFileExtension(fileName) {
    return fileName.substr((Math.max(0, fileName.lastIndexOf(".")) || Infinity) + 1);
}


function getPeaks(buffer, width) {
    var k = buffer[1].length / width;
    var slice = Array.prototype.slice;
    var sums = [];
    var odd = true;
    for (var i = 0; i < width; i++) {
        var sum = 0;
        var chan = buffer[0];
        var vals = slice.call(chan, i * k, (i + 1) * k);
        var peak = Math.max.apply(Math, vals.map(Math.abs));
        var minPeak = Math.min.apply(Math, vals);
        if (odd == false) peak = minPeak;
        odd = !odd;
        sum += peak;
        sums[i] = sum;
    }
    return sums;
}

/*function sendData(socket, id, index, start, tmp) {
    console.log("emituji data " + id);
    socket.emit('pcmdata', { 'id': id, 'index': index, 'start': start, 'value': tmp });
}
*/
function prepareData(socket, resultParams) {
    // I have already read PCM
    if ((typeof samples[resultParams.path] != "undefined")
            && (samples[resultParams.path] != null)
            && (samples[resultParams.path].state != null)) {
        //console.log("I have already read PCM");
        var tmpPeaks = getPeaks(samples[resultParams.path], resultParams.resolution);
        var length = tmpPeaks.length;
        var index = 0;
        while (length >= 0) {
            var tmp = new Array();
            var max = packetLength;
            if (length < packetLength) max = length;
            for (var n = 0; n < max; n++) {
                tmp[n] = tmpPeaks[index * packetLength + n];
            }
            samples[resultParams.path].state = 1;
            //sendData(socket, resultParams.id, index, resultParams.start, tmp);
            //console.log("emituji data " + resultParams.id + JSON.stringify(tmp));
            socket.emit('pcmdata', { 'id': resultParams.id, 'index': index, 'start': resultParams.start, 'value': tmp });
            index++;
            length -= packetLength;
        }
    }
}

exports.getPCM = function (socket, resultParams, dirname) {

    // I have already read PCM
    if ((typeof samples[resultParams.path] != "undefined") && (samples[resultParams.path] != null) && (samples[resultParams.path].state != null) && (samples[resultParams.path].state == 1)) {
        prepareData(socket, resultParams);
    } 
    else if ((typeof samples[resultParams.path] != "undefined") && (samples[resultParams.path] != null) && (samples[resultParams.path].state == 2))
    {
        var timer = setInterval((function () {
            //console.log('pokousim se o PCM');
            if ((samples[resultParams.path] != null) && (samples[resultParams.path].state == 1)) {
                clearInterval(timer);
                prepareData(socket, resultParams);
            }
        }), 200);
    }
    else if ((typeof samples[resultParams.path] == "undefined") || (samples[resultParams.path] == null))
    {
        samples[resultParams.path] = new Array();
        samples[resultParams.path][0] = new Array();
        samples[resultParams.path][1] = new Array();
        samples[resultParams.path].state = 2;

        var i = 0;
        var j = 0;
        var min = 1.0;
        var max = -1.0;
        var count = 0;

        var rangeMax = -1;
        var rangeMin = 1;

        var ext = getFileExtension(resultParams.path);
        if ((ext == "mp3") || (ext == "wav") || (ext == "ogg") || (ext == "flac")) {        // validate extension
            fs.exists(dirname + '\/' + resultParams.path, function (exists) {                                             // check, if file exists
                if (exists) {
                    pcm.getPcmData(dirname + '\/' + resultParams.path, { stereo: true, sampleRate: resultParams.sampleRate },
                      function (sample, channel) {
                          // Sample is from [-1.0...1.0]
                          // channel is 0 for left and 1 for right
                          min = Math.min(min, sample);
                          max = Math.max(max, sample);
                          var returnSample;
                          rangeMax = Math.max(rangeMax, sample);
                          rangeMin = Math.min(rangeMin, sample);

                          if (i % 2 == 0) {
                              returnSample = rangeMax;
                          } else {
                              returnSample = rangeMin;
                          }
                          // save every 15 sample (for speed and memory consuption)
                          if (count > 14) {
                              if (samples[resultParams.path] != null) {
                                  if (channel == 0) {
                                      samples[resultParams.path][0][i] = Math.round(returnSample * 1000);
                                      i++;
                                  } else if (channel == 1) {
                                      samples[resultParams.path][1][j] = Math.round(returnSample * 1000);
                                      j++;
                                  }
                              }
                              min = 1.0;
                              max = -1.0;
                              count = 0;
                              rangeMax = -1;
                              rangeMin = 1;
                          }
                          count++;
                      },

                      function (err, output) {
                          if (err) throw new Error(err);
                          prepareData(socket, resultParams);
                      }
                    );
                } else {
                    socket.emit('pcmdata', { 'id': resultParams.id, 'index': 0, 'start': 0, 'value': "error" });
                }
            });
        } else {
            socket.emit('pcmdata', { 'id': resultParams.id, 'index': 0, 'start': 0, 'value': "error" });
        }
    }
}

exports.releaseMem = function (path) {
    console.log("release memory");
    samples[path] = null;
}