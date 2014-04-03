angular.module('services.socket', [])

.factory('Socket', ['$rootScope',
    function ($rootScope) {

        function SocketFactory(host, port, path) {

            var ws = new eio.Socket('ws://' + host + ':' + port + path);

            var Socket = function () {};

            Socket.on = function (eventName, callback) {
                ws.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(ws, args);
                    });
                });
            };

            Socket.send = function (data, callback) {
                ws.send(data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(ws, args);
                    });
                });
            };

            return Socket;
        }

        return SocketFactory;
    }
]);
