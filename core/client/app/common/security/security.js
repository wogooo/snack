// Based loosely around work by Witold Szczerba - https://github.com/witoldsz/angular-http-auth
angular.module('security.service', [
  'security.retryQueue', // Keeps track of failed requests that need to be retried once the user logs in
  'security.login', // Contains the login form template and controller
  'ui.bootstrap' // Used to display the login form as a modal dialog.
])

.factory('security', ['$http', '$q', '$location', 'securityRetryQueue', '$modal', '$window',
  function ($http, $q, $location, queue, $modal, $window) {

    // Redirect to the given url (defaults to '/')
    function redirect(url) {
      url = url || '/snack/login';
      $window.location.href = url;
    }

    // Login form dialog stuff
    var loginDialog = null;

    function openLoginDialog() {
      if (loginDialog) {
        throw new Error('Trying to open a dialog that is already open!');
      }

      loginDialog = $modal.open({
        templateUrl: 'common/security/login/form.tpl.html',
        controller: 'LoginFormController'
      });

      loginDialog.result.then(onLoginDialogClose);
    }

    function closeLoginDialog(success) {
      if (loginDialog) {
        loginDialog.close(success);
      }
    }

    function onLoginDialogClose(success) {
      loginDialog = null;
      if (success) {
        queue.retryAll();
      } else {
        queue.cancelAll();
        redirect();
      }
    }

    // Register a handler for when an item is added to the retry queue
    queue.onItemAddedCallbacks.push(function (retryItem) {
      if (queue.hasMore()) {
        service.showLogin();
      }
    });

    // The public API of the service
    var service = {

      // Get the first reason for needing a login
      getLoginReason: function () {
        return queue.retryReason();
      },

      // Show the modal login dialog
      showLogin: function () {
        openLoginDialog();
      },

      // Attempt to authenticate a user by the given username and password
      login: function (username, password) {
        var request = $http.post('/snack/login', {
          username: username,
          password: password
        });
        return request.then(function (response) {
          service.currentUser = response.data;
          if (service.isAuthenticated()) {
            closeLoginDialog(true);
          }
          return service.isAuthenticated();
        });
      },

      // Give up trying to login and clear the retry queue
      cancelLogin: function () {
        closeLoginDialog(false);
        redirect();
      },

      // Logout the current user and redirect
      logout: function (redirectTo) {
        $http.post('/snack/logout').then(function () {
          service.currentUser = null;
          redirect();
        });
      },

      // Ask the backend to see if a user is already authenticated - this may be from a previous session.
      requestCurrentUser: function () {

        if (service.isAuthenticated()) {
          return $q.when(service.currentUser);
        } else {
          return $http.get('/api/v1/users/current.json').then(function (response) {
            service.currentUser = response.data;
            return service.currentUser;
          });
        }
      },

      // Information about the current user
      currentUser: null,

      // Is the current user authenticated?
      isAuthenticated: function () {
        return !!service.currentUser;
      },

      // Is the current user an adminstrator?
      isAdmin: function () {
        return !!(service.currentUser && service.currentUser.admin);
      }
    };

    return service;
  }
]);
