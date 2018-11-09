define([
  'okta',
  'q',
  'util/FormController',
  'util/FormType',
  'views/shared/FooterSignout',
  'util/FactorUtil'
],
function (Okta, Q, FormController, FormType, FooterSignout, FactorUtil) {

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

    className: 'verify-video-factor video-factor-form',

    Model: {
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

          var factor;
          if (!!transaction.factors) {
            factor = transaction.factors.find(function(factor) { return factor.factorType === 'bio:face' });
          } else {
            factor = transaction.factor;
          }
          
          return deferred.promise.then(function(resourcePath) {
            return factor.verify({
              resourcePath: resourcePath
            });
          });
        });
      }
    },

    Form: function() {
      return {
        autoSave: true,
        title: 'Face Biometrics',
        save: 'Record',
        subtitle: 'Please record your face:',
        attributes: { 'data-se': 'factor-video' },
        initialize: function () {
          var factor = this.options.appState.changed.lastAuthResponse._embedded.factors.find(function(factor) { return factor.factorType === 'bio:face' });
        }
      };
    },

    Footer: FooterSignout,

    trapAuthResponse: function () {
      if (this.options.appState.get('isMfaChallenge')) {
        enabledSubmit();
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
