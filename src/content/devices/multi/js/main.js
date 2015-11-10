/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

var gumAudio = document.querySelector('audio.gum');
gumAudio.addEventListener('play', function() {
  gumAudio.volume = 0.1;
  console.log('Audio lowered in order to reduce feedback from local audio gUM '+
      'stream');
});
var gumVideo = document.querySelector('video.gum');
gumVideo.addEventListener('play', function() {
  gumVideo.volume = 0.1;
  console.log('Audio lowered in order to reduce feedback from local audio '+
    'and video UM stream');
});

function gotDevices(deviceInfos) {
  var outputSelector = document.createElement('select');

  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    var option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audiooutput') {
      console.info('Found audio output device: ', deviceInfo.label);
      option.text = deviceInfo.label || 'speaker ' +
        (outputSelector.length + 1);
      outputSelector.appendChild(option);
    } else {
      console.log('Found non audio output device: ', deviceInfo.label);
    }
  }
  // Clone and attach the output drop down selector to the media elements.
  var allMediaElements = document.querySelectorAll('audio, video');
  allMediaElements.forEach(function(element) {
    var newOutputSelector = outputSelector.cloneNode(true);
    newOutputSelector.addEventListener('change', changeAudioDestination);
    element.parentElement.appendChild(newOutputSelector);
  });
}

navigator.mediaDevices.enumerateDevices()
.then(gotDevices)
.catch(errorCallback);

function successCallback(stream) {
  window.stream = stream; // make stream available to console
  gumAudio.srcObject = stream;
  gumVideo.srcObject = stream;
}

function errorCallback(error) {
  console.log('Error: ', error);
}

// Attach audio output device to the provided media element using the device Id.
function attachSinkId(element, sinkId, dropDown) {
  if (typeof element.sinkId !== 'undefined') {
    element.setSinkId(sinkId)
    .then(function() {
      console.log('Success, audio output device attached: ' + sinkId + ' to ' +
      'element with ' + element.title + ' as source.');
    })
    .catch(function(error) {
      var errorMessage = error;
      if (error.name === 'SecurityError') {
        errorMessage = 'You need to use HTTPS for selecting audio output ' +
            'device: ' + error;
      }
      console.error(errorMessage);
      // Jump back to first output device in the list as it's the default.
      dropDown.selectedIndex = 0;
    });
  } else {
    console.warn('Browser does not support output device selection.');
  }
}

function changeAudioDestination(event) {
  var deviceId = event.target.value;
  var dropDown = event.target;
  var element = event.path[1].childNodes[1];
  attachSinkId(element, deviceId, dropDown);
}

function start() {
  if (window.stream) {
    window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }
  var constraints = {
    audio: true,
    video: true
  };
  navigator.getUserMedia(constraints, successCallback, errorCallback);
}

start();