angular.module('jobs', ['resources.jobs', 'services.socket'])

.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/jobs', {
            templateUrl: 'jobs/job-list.tpl.html',
            controller: 'JobListCtrl',
            resolve: {
                jobList: ['JobsResource',
                    function (JobsResource) {
                        return JobsResource.list();
                    }
                ]
            }
        });
    }
])

.controller('JobListCtrl', ['$scope', '$location', 'jobList', 'Socket',
    function ($scope, $location, jobList, Socket) {

        $scope.jobList = jobList;

        var socket = Socket('localhost', 8181);

        socket.on('message', function (data) {
            var job = JSON.parse(data);
            jobList.items.unshift(job);
        });
    }
]);
