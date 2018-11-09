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
      props: {
        phrase: 'string'
      },
      local: {
        phrases: 'array'
      },
      save: function () {
        return this.doTransaction(function(transaction) {
          var factor;
          if (!!transaction.factors) {
            factor = transaction.factors.find(function(factor) { return factor.factorType === 'bio:face' });
          } else {
            factor = transaction.factor;
          }
          return factor.enroll({});
        });
      }
    },

    Form: {
      autoSave: true,
      title: 'Face Biometrics',
      save: 'Enroll',
      inputs: function () {
        return [];
      }
    },

    Footer: Footer

  });

});
