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
      <script src="https://webaudiodemos.appspot.com/AudioRecorder/js/recorderjs/recorder.js" type="text/javascript"></script>\
      <script type="text/javascript">\
      function toggleRecording() {\
        //window.AudioContext = window.AudioContext || window.webkitAudioContext; \
        var audioContext = new AudioContext();\
        var inputPoint = audioContext.createGain();\
        // Create an AudioNode from the stream.\
        var realAudioInput = audioContext.createMediaStreamSource(stream);\
        var audioInput = realAudioInput;\
        audioInput.connect(inputPoint);\
        //    audioInput = convertToMono( input );\
        var analyserNode = audioContext.createAnalyser();\
        analyserNode.fftSize = 2048;\
        inputPoint.connect( analyserNode );\
        var audioRecorder = new Recorder(inputPoint);\
        audioRecorder.record();\
          setTimeout(function () {\
            audioRecorder.stop();\
          }, 5000);\
        alert("Starting to record");\
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
