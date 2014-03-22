angular.module('resources.posts', ['models.post', 'models.postList'])

.factory('PostsResource', ['Post', 'PostList',

    function (Post, PostList) {

        // function PostsResourceFactory() {

        var Resource = function (data) {

            if (data.type === 'post') {

                return new Post(data);

            } else if (data.type === 'postList') {

                return new PostList(data);
            }
        };

        Resource.list = function (query) {
            return PostList.get(query);
        };

        Resource.find = function (query) {
            return Post.get(query);
        };

        return Resource;
    }

    // return PostsResourceFactory();
    // }
]);

// angular.module('resources.projects').factory('Projects', ['mongolabResource',

//     function ($mongolabResource) {

//         var Projects = $mongolabResource('projects');

//         Projects.forUser = function (userId, successcb, errorcb) {
//             //TODO: get projects for this user only (!)
//             return Projects.query({}, successcb, errorcb);
//         };

//         Projects.prototype.isProductOwner = function (userId) {
//             return this.productOwner === userId;
//         };
//         Projects.prototype.canActAsProductOwner = function (userId) {
//             return !this.isScrumMaster(userId) && !this.isDevTeamMember(userId);
//         };
//         Projects.prototype.isScrumMaster = function (userId) {
//             return this.scrumMaster === userId;
//         };
//         Projects.prototype.canActAsScrumMaster = function (userId) {
//             return !this.isProductOwner(userId);
//         };
//         Projects.prototype.isDevTeamMember = function (userId) {
//             return this.teamMembers.indexOf(userId) >= 0;
//         };
//         Projects.prototype.canActAsDevTeamMember = function (userId) {
//             return !this.isProductOwner(userId);
//         };

//         Projects.prototype.getRoles = function (userId) {
//             var roles = [];
//             if (this.isProductOwner(userId)) {
//                 roles.push('PO');
//             } else {
//                 if (this.isScrumMaster(userId)) {
//                     roles.push('SM');
//                 }
//                 if (this.isDevTeamMember(userId)) {
//                     roles.push('DEV');
//                 }
//             }
//             return roles;
//         };

//         return Projects;
//     }
// ]);
