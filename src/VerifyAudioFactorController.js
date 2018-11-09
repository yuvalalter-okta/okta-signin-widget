define([
  'okta',
  'q',
  'util/FormController',
  'util/FormType',
  'views/shared/FooterSignout',
  'util/FactorUtil'
],
function (Okta, Q, FormController, FormType, FooterSignout, FactorUtil) {

  var _ = Okta._;
  var { Util } = Okta.internal.util;

  var PhraseView = Okta.View.extend({
    attributes: { 'data-se': 'say-phrase-attr' },
    className: 'say-phrase-class',
    template: '\
      <p style="text-align:center;font-size:20px">"{{{phrase}}}"</p>\
    ',
    getTemplateData: function () {
      return {
        phrase: this.model.get('phrase')
      };
    }
  });

  function disableSubmit() {
    document.getElementsByClassName('button-primary')[0].classList.add('btn-disabled');
    document.getElementsByClassName('button-primary')[0].classList.add('link-button-disabled');
    document.getElementsByClassName('button-primary')[0].disabled = true;
  }

  function enabledSubmit() {
    document.getElementsByClassName('button-primary')[0].classList.remove('btn-disabled');
    document.getElementsByClassName('button-primary')[0].classList.remove('link-button-disabled');
    document.getElementsByClassName('button-primary')[0].disabled = false;
  }

  return FormController.extend({

    template: '\
      <script src="https://webaudiodemos.appspot.com/AudioRecorder/js/recorderjs/recorder.js" type="text/javascript"></script>\
      <script id="worker1" type="javascript/worker">\
      var recLength = 0,\
      recBuffersL = [],\
      recBuffersR = [],\
      sampleRate;\
      this.onmessage = function(e){\
        switch(e.data.command){\
            case "init":\
                init(e.data.config);\
                break;\
            case "record":\
                record(e.data.buffer);\
                break;\
            case "exportWAV":\
                exportWAV(e.data.type);\
                break;\
            case "exportMonoWAV":\
                exportMonoWAV(e.data.type);\
                break;\
            case "getBuffers":\
                getBuffers();\
                break;\
            case "clear":\
                clear();\
                break;\
        }\
      };\
      function init(config){\
        sampleRate = config.sampleRate;\
      }\
      function record(inputBuffer){\
        recBuffersL.push(inputBuffer[0]);\
        recBuffersR.push(inputBuffer[1]);\
        recLength += inputBuffer[0].length;\
      }\
      function exportWAV(type){\
        var bufferL = mergeBuffers(recBuffersL, recLength);\
        var bufferR = mergeBuffers(recBuffersR, recLength);\
        var interleaved = interleave(bufferL, bufferR);\
        var dataview = encodeWAV(interleaved);\
        var audioBlob = new Blob([dataview], { type: type });\
        this.postMessage(audioBlob);\
      }\
      function exportMonoWAV(type){\
        var bufferL = mergeBuffers(recBuffersL, recLength);\
        var dataview = encodeWAV(bufferL, true);\
        var audioBlob = new Blob([dataview], { type: type });\
        this.postMessage(audioBlob);\
      }\
      function getBuffers() {\
        var buffers = [];\
        buffers.push( mergeBuffers(recBuffersL, recLength) );\
        buffers.push( mergeBuffers(recBuffersR, recLength) );\
        this.postMessage(buffers);\
      }\
      function clear(){\
        recLength = 0;\
        recBuffersL = [];\
        recBuffersR = [];\
      }\
      function mergeBuffers(recBuffers, recLength){\
        var result = new Float32Array(recLength);\
        var offset = 0;\
        for (var i = 0; i < recBuffers.length; i++){\
            result.set(recBuffers[i], offset);\
            offset += recBuffers[i].length;\
        }\
        return result;\
      }\
      function interleave(inputL, inputR){\
        var length = inputL.length + inputR.length;\
        var result = new Float32Array(length);\
        var index = 0,\
            inputIndex = 0;\
        while (index < length){\
            result[index++] = inputL[inputIndex];\
            result[index++] = inputR[inputIndex];\
            inputIndex++;\
        }\
        return result;\
      }\
      function floatTo16BitPCM(output, offset, input){\
        for (var i = 0; i < input.length; i++, offset+=2){\
            var s = Math.max(-1, Math.min(1, input[i]));\
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);\
         }\
      }\
      function writeString(view, offset, string){\
        for (var i = 0; i < string.length; i++){\
            view.setUint8(offset + i, string.charCodeAt(i));\
        }\
      }\
      function encodeWAV(samples, mono){\
        var buffer = new ArrayBuffer(44 + samples.length * 2);\
        var view = new DataView(buffer);\
        /* RIFF identifier */\
        writeString(view, 0, "RIFF");\
        /* file length */\
        view.setUint32(4, 32 + samples.length * 2, true);\
        /* RIFF type */\
        writeString(view, 8, "WAVE");\
        /* format chunk identifier */\
        writeString(view, 12, "fmt ");\
        /* format chunk length */\
        view.setUint32(16, 16, true);\
        /* sample format (raw) */\
        view.setUint16(20, 1, true);\
        /* channel count */\
        view.setUint16(22, mono?1:2, true);\
        /* sample rate */\
        view.setUint32(24, sampleRate, true);\
        /* byte rate (sample rate * block align) */\
        view.setUint32(28, sampleRate * 4, true);\
        /* block align (channel count * bytes per sample) */\
        view.setUint16(32, 4, true);\
        /* bits per sample */\
        view.setUint16(34, 16, true);\
        /* data chunk identifier */\
        writeString(view, 36, "data");\
        /* data chunk length */\
        view.setUint32(40, samples.length * 2, true);\
        floatTo16BitPCM(view, 44, samples);\
        return view;\
      }\
      </script>\
      <script type="text/javascript">\
          var blob = new Blob([\
           document.querySelector("#worker1").textContent\
          ], { type: "text/javascript" });\
          var cfg = {workerPath: window.URL.createObjectURL(blob)};\
          window.AudioContext = window.AudioContext || window.webkitAudioContext;\
          var audioContext = new AudioContext();\
          var audioInput = null,\
            realAudioInput = null,\
            inputPoint = null,\
            audioRecorder = null;\
          var rafID = null;\
          var analyserContext = null;\
          var canvasWidth, canvasHeight;\
          var recIndex = 0;\
          function gotStream(stream) {\
            inputPoint = audioContext.createGain();\
            realAudioInput = audioContext.createMediaStreamSource(stream);\
            audioInput = realAudioInput;\
            audioInput.connect(inputPoint);\
            analyserNode = audioContext.createAnalyser();\
            analyserNode.fftSize = 2048;\
            inputPoint.connect( analyserNode );\
            audioRecorder = new Recorder( inputPoint , cfg );\
            zeroGain = audioContext.createGain();\
            zeroGain.gain.value = 0.0;\
            inputPoint.connect( zeroGain );\
            zeroGain.connect( audioContext.destination );\
          }\
          function doneEncoding(deferred) {\
            return function(blob) {\
              var xhr = new XMLHttpRequest();\
              xhr.open("POST", "{{{baseUrl}}}/api/user/factors/bio_factor/upload", true);\
              xhr.setRequestHeader("Accept", "application/json");\
              xhr.onload = function(e) { console.log(e)};\
              xhr.onreadystatechange = function() {\
                if (xhr.readyState == XMLHttpRequest.DONE) {\
                  console.log(xhr.responseText);\
                  var resp = JSON.parse(this.response);\
                  console.log("Server got:", resp);\
                  deferred.resolve(resp.resourceId);\
                }\
              };\
              var fd = new FormData();\
              fd.append("fileData", blob);\
              xhr.send(fd);\
            };\
          }\
                      var script = document.createElement("script");\
                      script.onload = function () {\
                        if (!navigator.getUserMedia)\
                          navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;\
                        if (!navigator.cancelAnimationFrame)\
                          navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;\
                        if (!navigator.requestAnimationFrame)\
                          navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;\
                        navigator.getUserMedia(\
                          {\
                              "audio": {\
                                  "mandatory": {\
                                      "googEchoCancellation": "false",\
                                      "googAutoGainControl": "false",\
                                      "googNoiseSuppression": "false",\
                                      "googHighpassFilter": "false"\
                                  },\
                                  "optional": []\
                              },\
                          }, gotStream, function(e) {\
                              alert("Error getting audio");\
                              console.log(e);\
                          });\
                      };\
                      script.src = "https://webaudiodemos.appspot.com/AudioRecorder/js/recorderjs/recorder.js";\
                      document.head.appendChild(script);\
                      function start5SecondRecording(deferred) {\
                        audioRecorder.clear();\
                        audioRecorder.record();\
                        setTimeout(function() { \
                          audioRecorder.stop();\
                          audioRecorder.exportWAV( doneEncoding(deferred) );\
                        }, 5000);\
                      }\
                      </script>\
                      ',
    getTemplateData: function () {
      return {
        baseUrl: this.options.settings.options.baseUrl
      };
    },

    className: 'verify-audio-factor audio-factor-form',

    Model: {
      props: {
        resourcePath: ['string']
      },

      save: function () {
        disableSubmit();
        return this.doTransaction(function(transaction) {
          var deferred = Q.defer();
          start5SecondRecording(deferred);
          var factor;
          if (!!transaction.factors) {
            factor = transaction.factors.find(function(factor) { return factor.factorType === 'bio:voice' });
          } else {
            factor = transaction.factor;
          }
          return deferred.promise.then(function(resourcePath) {
            return factor.verify({
              resourcePath: resourcePath
            });
          });
        });
      }
    },

    Form: function() {
      return {
        autoSave: true,
        title: 'Voice Biometrics',
        save: 'Record',
        subtitle: 'Please repeat the following phrase:',
        attributes: { 'data-se': 'factor-audio' },
        initialize: function () {
          var factor = this.options.appState.changed.lastAuthResponse._embedded.factors.find(function(factor) { return factor.factorType === 'bio:voice' });
          this.model.set('phrase', factor.profile.phrase);
        },
        formChildren: [
          FormType.View({View: PhraseView})
        ]
      };
    },

    Footer: FooterSignout,

    trapAuthResponse: function () {
      if (this.options.appState.get('isMfaChallenge')) {
        enabledSubmit();
        return true;
      }
    },

    back: function() {
      // Empty function on verify controllers to prevent users
      // from navigating back during 'verify' using the browser's
      // back button. The URL will still change, but the view will not
      // More details in OKTA-135060.
    },

    initialize: function () {
      this.model.set('provider', this.options.provider);
      this.model.set('factorType', this.options.factorType);
    }

  });

});
