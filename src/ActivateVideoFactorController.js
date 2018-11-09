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
  'q',
  'util/FormController',
  'util/FormType',
  'views/enroll-factors/Footer'
],
function (Okta, Q, FormController, FormType, Footer) {

  var _ = Okta._;
  var { Util } = Okta.internal.util;

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
    className: 'activate-video-factor',
    Model: function () {
      return {
        props: {
          resourcePath: ['string']
        },
        save: function () {
          disableSubmit();
          return this.doTransaction(function(transaction) {

            var deferred = Q.defer();
            var baseUrl = this.options.settings.options.baseUrl;

            navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
              var mediaRecorder = new MediaRecorder(stream);
              mediaRecorder.start();
              setTimeout(function() {
                var blob = mediaRecorder.requestData();
                mediaRecorder.stop();
              }, 2000);

              var chunks = [];

              mediaRecorder.ondataavailable = function(e) {
                chunks.push(e.data);
              }

              mediaRecorder.onstop = function(e) {
                var blob = new Blob(chunks, { 'type' : 'video/mp4' });
                var xhr = new XMLHttpRequest();
                xhr.open("POST", baseUrl + "/api/user/factors/bio_factor/upload", true);
                xhr.setRequestHeader("Accept", "application/json");
                xhr.onload = function(e) { console.log(e)};
                xhr.onreadystatechange = function() {
                  if (xhr.readyState == XMLHttpRequest.DONE) {
                    console.log(xhr.responseText);
                    var resp = JSON.parse(this.response);
                    console.log("Server got:", resp);
                    deferred.resolve(resp.resourceId);
                  }
                };
                var fd = new FormData();
                fd.append("fileData", blob);
                xhr.send(fd);
              }


            });

            return deferred.promise.then(function(resourcePath) {
              return transaction.activate({
                resourcePath: resourcePath
              });
            });
          });
        }
      };
    },

    Form: function() {
      var factor;
      if (!!this.options.appState.changed.lastAuthResponse._embedded.factors) {
        factor = this.options.appState.changed.lastAuthResponse._embedded.factors.find(function(factor) { return factor.factorType === 'bio:face' });
      } else {
        factor = this.options.appState.changed.lastAuthResponse._embedded.factor;
      }
      this.model.set('recordings', factor.profile.recordings);
      this.model.set('subtitles', [
        'Please record your face:',
        'Please record your face again:',
        'Please record your face one last time:',
      ]);
      return {
        autoSave: true,
        title: 'Face Biometrics',
        save: 'Record',
        subtitle: this.model.get('subtitles')[this.model.get('recordings')],
        attributes: { 'data-se': 'factor-video' }
      };
    },

    Footer: Footer,

    trapAuthResponse: function () {
      if (this.options.appState.get('isMfaEnrollActivate')) {
        enabledSubmit();
        var recordings = this.options.appState.changed.lastAuthResponse._embedded.factor.profile.recordings;
        this.model.set('recordings', recordings);
        document.getElementsByClassName('okta-form-subtitle')[0].innerText = this.model.get('subtitles')[recordings];
        return true;
      }
      return false;
    }

  });

});
