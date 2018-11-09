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
  'util/FormType',
  'views/enroll-factors/Footer'
],
function (Okta, FormController, FormType, Footer) {

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

  return FormController.extend({
    className: 'activate-audio-factor',
    Model: function () {
      return {
        props: {
          resourcePath: ['string']
        },
        save: function () {
          return this.doTransaction(function(transaction) {
            // RECORD
            // UPLOAD
            // GET RESOURCE ID
            var resourcePath = 'blah';
            return transaction.activate({
              resourcePath: resourcePath
            });
          });
        }
      };
    },

    Form: function() {
      var factor;
      if (!!this.options.appState.changed.lastAuthResponse._embedded.factors) {
        factor = this.options.appState.changed.lastAuthResponse._embedded.factors.find(function(factor) { return factor.factorType === 'bio:voice' });
      } else {
        factor = this.options.appState.changed.lastAuthResponse._embedded.factor;
      }
      this.model.set('recordings', factor.profile.recordings);
      this.model.set('phrase', factor.profile.phrase);
      this.model.set('subtitles', [
        'Please repeat the following phrase:',
        'Please repeat the following phrase again:',
        'Please repeat the following phrase one last time:',
      ]);
      return {
        autoSave: true,
        title: 'Voice Biometrics',
        save: 'Record',
        subtitle: this.model.get('subtitles')[this.model.get('recordings')],
        attributes: { 'data-se': 'factor-audio' },
        formChildren: [
          FormType.View({View: PhraseView})
        ]
      };
    },

    Footer: Footer,

    trapAuthResponse: function () {
      if (this.options.appState.get('isMfaEnrollActivate')) {
        var recordings = this.options.appState.changed.lastAuthResponse._embedded.factor.profile.recordings;
        this.model.set('recordings', recordings);
        document.getElementsByClassName('okta-form-subtitle')[0].innerText = this.model.get('subtitles')[recordings];
        return true;
      }
      return false;
    }

  });

});
