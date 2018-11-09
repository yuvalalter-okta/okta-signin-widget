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
  'views/enroll-factors/Footer'
],
function (Okta, FormController, Footer) {

  var _ = Okta._;
  var { Util } = Okta.internal.util;

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
          return this.doTransaction(function(transaction) {
            return transaction.activate({
              resourcePath: '/Users/kenwang/Desktop/zoos/1.wav'
            });
          });
        }
      };
    },

    Form: {
      autoSave: true,
      title: _.partial(Okta.loc, 'enroll.AudioFactor.activate', 'login'),
      inputs: function () {
        return [
        
        ];
      }
    },

    Footer: Footer

  });

});
