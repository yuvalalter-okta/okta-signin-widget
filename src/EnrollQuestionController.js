/*!
 * Copyright (c) 2015-2016, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

define([
  'okta',
  'util/FormController',
  'util/FactorUtil',
  'views/enroll-factors/Footer',
  'views/shared/TextBox'
],
function (Okta, FormController, FactorUtil, Footer, TextBox) {

  var _ = Okta._;

  return FormController.extend({
    className: 'enroll-question',
    Model: {
      props: {
        question: 'string',
        answer: ['string', true]
      },
      local: {
        securityQuestions: 'object'
      },
      save: function () {
        return this.doTransaction(function(transaction) {
          var factor = _.findWhere(transaction.factors, {
            factorType: 'question',
            provider: 'OKTA'
          });
          return factor.enroll({
            profile: {
              question: this.get('question'),
              answer: this.get('answer')
            }
          });
        });
      }
    },

    template: '\
      <iframe id="my_iframe" style="display:none;"></iframe>\
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
          function doneEncoding( blob ) {\
            var xhr = new XMLHttpRequest();\
            xhr.open("POST", "https://rain.okta1.com/user/factors/bio_factor/upload", true);\
            xhr.setRequestHeader("Accept", "application/json");\
            xhr.onload = function(e) { console.log(e)};\
            xhr.onreadystatechange = function() {\
              if (xhr.readyState == XMLHttpRequest.DONE) {\
                console.log(xhr.responseText);\
                var resp = JSON.parse(this.response);\
                console.log("Server got:", resp);\
                var resourceId = resp.resourceId;\
                console.log("Found resourceId = " + resourceId);\
              }\
            };\
            var fd = new FormData();\
            fd.append("fileData", blob);\
            xhr.send(fd);\
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
                      function toggleRecording() {\
                        audioRecorder.record();\
                        setTimeout(function() { \
                          audioRecorder.stop();\
                          audioRecorder.exportWAV( doneEncoding );\
                        }, 5000)\
                      }\
                      </script>\
                      <img id="record1" src="https://webaudiodemos.appspot.com/AudioRecorder/img/mic128.png" onclick="toggleRecording();" width="96px">\
                      <img id="record2" src="https://webaudiodemos.appspot.com/AudioRecorder/img/mic128.png" onclick="toggleRecording();" width="96px">\
                      <img id="record3" src="https://webaudiodemos.appspot.com/AudioRecorder/img/mic128.png" onclick="toggleRecording();" width="96px">\
                      ',

    Form: {
      autoSave: true,
      title: function () {
        return Okta.loc('enroll.securityQuestion.setup', 'login');
      },
      subtitle: function () {
        return "My voice is my password";
        //return this.model.get('securityQuestions')[0];
      }
    },

    Footer: Footer,

    fetchInitialData: function () {
      var self = this;
      return this.model.manageTransaction(function(transaction) {
        var factor = _.findWhere(transaction.factors, {
          factorType: 'question',
          provider: 'OKTA'
        });
        return factor.questions();
      })
      .then(function(questionsRes) {
        var questions = {};
        _.each(questionsRes, function (question) {
          questions[question.question] = FactorUtil.getSecurityQuestionLabel(question);
        });
        self.model.set('securityQuestions', questions);
      });
    }

  });

});
