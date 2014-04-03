angular.module('resources.jobs', ['models.job', 'models.jobList'])

.factory('JobsResource', ['Job', 'JobList',

    function (Job, JobList) {

        var Resource = function (data) {

            if (data.type === 'job') {

                return new Job(data);

            } else if (data.type === 'jobList') {

                return new JobList(data);
            }
        };

        Resource.list = function (query) {
            return JobList.get(query);
        };

        Resource.find = function (query) {
            return Job.get(query);
        };

        return Resource;
    }
]);
