define([
  'okta',
  'util/FormController',
  'views/shared/FooterSignout',
  'util/FactorUtil'
],
function (Okta, FormController, FooterSignout, FactorUtil) {

  var _ = Okta._;
  var { Util } = Okta.internal.util;

  return FormController.extend({

    className: 'verify-video-factor video-factor-form',

    Model: {
      props: {
        resourcePath: ['string']
      },

      save: function () {
        return this.manageTransaction((transaction, setTransaction) => {
          var factor = _.findWhere(transaction.factors, {
            provider: this.get('provider'),
            factorType: this.get('factorType')
          });
          return factor.verify({resourcePath, resourcePath})
          .then((trans) => {
            setTransaction(trans);
          })
          .fail(function (err) {
            throw err;
          });
        });
      }
    },

    Form: function() {
      var factors = this.options.appState.get('factors');
      var factor = factors.findWhere({
        provider: this.options.provider,
        factorType: this.options.factorType
      });
      var vendorName = factor.get('vendorName');
      var saveText = Okta.loc('mfa.challenge.verify', 'login');
      var subtitle = Okta.loc('verify.videoFactor.subtitle', 'login', [vendorName]);
      return {
        autoSave: true,
        title: vendorName,
        save: saveText,
        subtitle: subtitle,
        attributes: { 'data-se': 'factor-video' },
        initialize: function () {
        }
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
