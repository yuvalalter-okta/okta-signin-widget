define([
  'okta',
  'util/FormController',
  'util/FormType',
  'views/shared/FooterSignout',
  'util/FactorUtil'
],
function (Okta, FormController, FormType, FooterSignout, FactorUtil) {

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

    className: 'verify-audio-factor audio-factor-form',

    Model: {
      props: {
        resourcePath: ['string']
      },

      save: function () {
          return this.doTransaction(function(transaction) {
            var factor = _.findWhere(transaction.factors, {
              provider: this.get('provider'),
              factorType: this.get('factorType')
            });
            // RECORD
            // UPLOAD
            // GET RESOURCE_ID
            var resourcePath = '/Users/kenwang/Desktop/zoos/auth.wav';
            return factor.verify({
              resourcePath: resourcePath
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
