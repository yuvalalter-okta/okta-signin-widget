define([
  'okta',
  'util/FormController',
  'views/enroll-factors/Footer'
],
function (Okta, FormController, Footer) {

  var _ = Okta._;
  var { Util } = Okta.internal.util;

  return FormController.extend({
    className: 'enroll-video-factor',
    Model: {
      local: {
        provider: 'string',
        factorType: 'string'
      },
      save: function () {
        return this.manageTransaction((transaction, setTransaction) => {
          var factor = _.findWhere(transaction.factors, {
            provider: this.get('provider'),
            factorType: this.get('factorType')
          });
          return factor.enroll()
          .then((trans) => {
            setTransaction(trans);
            var url = this.appState.get('enrollVideoFactorRedirectUrl');
            if(url !== null) {
              Util.redirect(url);
            }
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
      var subtitle = Okta.loc('enroll.customFactor.subtitle', 'login', [vendorName]);
      var saveText = Okta.loc('enroll.customFactor.save', 'login');
      return {
        autoSave: true,
        title: vendorName,
        subtitle: subtitle,
        save: saveText,
      };
    },

    trapAuthResponse: function () {
      if (this.options.appState.get('isMfaEnrollActivate')) {
        return true;
      }
    },

    initialize: function () {
      this.model.set('provider', this.options.provider);
      this.model.set('factorType', this.options.factorType);
    },

    Footer: Footer

  });

});
