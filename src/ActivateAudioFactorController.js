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

  var SayPhraseView = Okta.View.extend({
    attributes: { 'data-se': 'say-phrase-attr' },
    className: 'say-phrase-class',
    template: '\
      <p class="instructions-title">Recordings left: {{{recordings_left}}}</p>\
      <p class="instructions-title">Please say the following phrase:</p>\
      <p class="instructions">{{{phrase}}}</p>\
    ',
    getTemplateData: function () {
      return {
        recordings_left: this.model.get('recordings_left'),
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
        local: {
          '__factorType__': ['string', false, this.options.factorType],
          '__provider__': ['string', false, this.options.provider]
        },
        save: function () {
          // RECORD
          // UPLOAD WAV
          var resourcePath = 'fakepath'; // RESOURCE ID
          return this.doTransaction(function(transaction) {
            var resourcePath = this.get('recordings').pop();
            return transaction.activate({
              resourcePath: resourcePath
            });
          });
        }
      };
    },

    Form: {
      autoSave: true,
      formChildren: function () {
        var appState = this.options.appState;
        return [
          FormType.View({
            View: SayPhraseView
          })
        ];
      }
    },

    Footer: Footer,

    fetchInitialData: function () {
      var self = this;
      return this.model.manageTransaction(function(transaction) {
        self.model.set('phrase', transaction.factor.profile.phrase);
        self.model.set('recordings_left', 3 - transaction.factor.profile.recordings);
      });
    },

    trapAuthResponse: function () {
      if (this.options.appState.get('isMfaEnrollActivate')) {
        var recordings = this.options.appState.changed.lastAuthResponse._embedded.factor.profile.recordings;
        this.model.set('recordings_left', 3 - recordings);
        return true;
      }
      return false;
    }

  });

});
