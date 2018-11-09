define([
  'okta',
  'util/FormController',
  'views/enroll-factors/Footer'
],
function (Okta, FormController, Footer) {

  var _ = Okta._;
  var { Util } = Okta.internal.util;

  return FormController.extend({
    className: 'enroll-audio-factor',
    Model: {
      props: {
        phrase: 'string'
      },
      local: {
        phrases: 'array'
      },
      save: function () {
        return this.doTransaction(function(transaction) {
          var factor = _.findWhere(transaction.factors, {
            factorType: 'bio:voice',
            provider: 'VOICE_IT'
          });
          return factor.enroll({
            profile: {
              phrase: this.get('phrases')[this.get('phrase')]
            }
          });
        });
      }
    },

    Form: {
      autoSave: true,
      title: _.partial(Okta.loc, 'enroll.AudioFactor.setup', 'login'),
      inputs: function () {
        return [
          {
            label: false,
            'label-top': true,
            name: 'phrase',
            type: 'select',
            wide: true,
            options: function () {
              return this.model.get('phrases');
            },
            params: {
              searchThreshold: 25
            }
          }
        ];
      }
    },

    Footer: Footer,

    fetchInitialData: function () {
      var self = this;
      return this.model.manageTransaction(function(transaction) {
        self.model.set('phrases', [
          'Zoos are filled with small and large animals',
          'Remember to wash your hands before eating',
          'Never forget tomorrow is a new day',
          'Today is a nice day to go for a walk'
        ]);
      });
    }

  });

});
