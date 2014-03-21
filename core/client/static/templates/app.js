angular.module('templates.app', ['assets/assets-edit.tpl.html', 'assets/assets-list.tpl.html', 'dashboard/dashboard.tpl.html', 'header.tpl.html', 'notifications.tpl.html', 'posts/posts-edit.tpl.html', 'posts/posts-list.tpl.html']);

angular.module("assets/assets-edit.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("assets/assets-edit.tpl.html",
    "<form name=\"form\" novalidate>\n" +
    "\n" +
    "  <legend>Asset</legend>\n" +
    "\n" +
    "  <div class=\"form-group\">\n" +
    "    <label>Title</label>\n" +
    "    <input type=\"text\" class=\"form-control\" name=\"title\" ng-model=\"asset.title\" />\n" +
    "  </div>\n" +
    "  <div class=\"form-group\">\n" +
    "    <label>Description</label>\n" +
    "    <textarea class=\"form-control\" name=\"description\" rows=\"10\" ng-model=\"asset.description\"></textarea>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"panel panel-default\">\n" +
    "    <div class=\"panel-heading\">\n" +
    "      <h4 class=\"panel-title\">File</h4>\n" +
    "    </div>\n" +
    "    <div class=\"panel-body\">\n" +
    "\n" +
    "      <figure class=\"row\">\n" +
    "        <div class=\"col-md-12\">\n" +
    "          <img class=\"img-thumbnail img-responsive center-block\" ng-src=\"{{asset.url}}\" />\n" +
    "        </div>\n" +
    "      </figure>\n" +
    "\n" +
    "      <dl class=\"well\">\n" +
    "        <div class=\"row\">\n" +
    "          <div class=\"col-xs-6\">\n" +
    "            <dt>Filename</dt>\n" +
    "            <dd>{{asset.filename}}</dd>\n" +
    "            <dt>Size</dt>\n" +
    "            <dd>{{asset.bytes}}</dd>\n" +
    "            <dt>Mime</dt>\n" +
    "            <dd>{{asset.mimetype}}</dd>\n" +
    "            <dt>Storage</dt>\n" +
    "            <dd>{{asset.storage}}</dd>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"col-xs-6\">\n" +
    "            <dt>Type</dt>\n" +
    "            <dd>{{asset.type}}</dd>\n" +
    "            <dt>Data</dt>\n" +
    "            <dd ng-repeat=\"(prop, val) in asset.data\">\n" +
    "              {{prop}}: {{val}}\n" +
    "            </dd>\n" +
    "            <dt>Created</dt>\n" +
    "            <dd>{{asset.createdAt}}</dd>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </dl>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"panel panel-default\">\n" +
    "\n" +
    "    <div class=\"panel-heading\">\n" +
    "      <h4 class=\"panel-title\">\n" +
    "        <a ng-click=\"isCollapsed = !isCollapsed\">\n" +
    "          Related Posts\n" +
    "        </a>\n" +
    "      </h4>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"panel-collapse collapse\" collapse=\"isCollapsed\">\n" +
    "      <div class=\"panel-body\">\n" +
    "        <ul>\n" +
    "          <li ng-repeat=\"post in asset.posts\">\n" +
    "            <a ng-href=\"/admin/posts/{{post.id}}/edit\">{{post.title}}</a>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    "  <hr>\n" +
    "\n" +
    "  <button ng-click=\"save()\" class=\"btn btn-large btn-primary\">Save</button>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("assets/assets-list.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("assets/assets-list.tpl.html",
    "<table class=\"table table-striped-rows table-hover\">\n" +
    "  <thead>\n" +
    "    <tr>\n" +
    "        <th>Title</th>\n" +
    "        <th>Kind</th>\n" +
    "        <th>Created</th>\n" +
    "        <th>Actions</th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "  <tr ng-repeat=\"asset in assetList.items\">\n" +
    "    <td>{{asset.title}}</td>\n" +
    "    <td>{{asset.kind}}</td>\n" +
    "    <td>{{asset.createdAt | date:'yyyy-MM-dd h:mma'}}</td>\n" +
    "    <td>\n" +
    "      <a ng-click=\"editAsset(asset)\">Edit</a>\n" +
    "    </td>\n" +
    "  </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("dashboard/dashboard.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("dashboard/dashboard.tpl.html",
    "<h4>Posts</h4>\n" +
    "<div ng-include=\"'posts/posts-list.tpl.html'\">\n" +
    "</div>\n" +
    "");
}]);

angular.module("header.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("header.tpl.html",
    "<nav class=\"navbar navbar-default navbar-fixed-top\" role=\"navigation\" ng-controller=\"HeaderCtrl\">\n" +
    "  <div class=\"container\">\n" +
    "    <!-- Brand and toggle get grouped for better mobile display -->\n" +
    "    <div class=\"navbar-header\">\n" +
    "      <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\"#navbar-collapse\">\n" +
    "        <span class=\"sr-only\">Toggle navigation</span>\n" +
    "        <span class=\"icon-bar\"></span>\n" +
    "        <span class=\"icon-bar\"></span>\n" +
    "        <span class=\"icon-bar\"></span>\n" +
    "      </button>\n" +
    "      <a class=\"navbar-brand\" href=\"/admin/dashboard\">Dashboard</a>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <!-- Collect the nav links, forms, and other content for toggling -->\n" +
    "    <div class=\"collapse navbar-collapse\" id=\"navbar-collapse\">\n" +
    "      <ul class=\"nav navbar-nav\">\n" +
    "        <li><a href=\"/admin/posts\">Posts</a></li>\n" +
    "        <li><a href=\"/admin/assets\">Assets</a></li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</nav>\n" +
    "");
}]);

angular.module("notifications.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("notifications.tpl.html",
    "<div ng-class=\"['alert', 'alert-dismissable', 'alert-'+notification.type]\" ng-repeat=\"notification in notifications.getCurrent()\">\n" +
    "  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-hidden=\"true\" ng-click=\"removeNotification(notification)\">&times;</button>\n" +
    "  <span ng-bind-html=\"notification.message\">{{notification.message}}</span>\n" +
    "</div>\n" +
    "");
}]);

angular.module("posts/posts-edit.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("posts/posts-edit.tpl.html",
    "<form name=\"form\" novalidate>\n" +
    "  <legend>Post</legend>\n" +
    "  <div class=\"form-group\">\n" +
    "    <label>Title</label>\n" +
    "    <input type=\"text\" class=\"form-control\" name=\"title\" ng-model=\"post.title\" />\n" +
    "  </div>\n" +
    "  <div class=\"form-group\">\n" +
    "    <label>Body</label>\n" +
    "    <textarea class=\"form-control\" name=\"body\" rows=\"10\" ng-model=\"post.body\"></textarea>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"panel panel-default\">\n" +
    "    <div class=\"panel-heading\">\n" +
    "      <h4 class=\"panel-title\">Assets</h4>\n" +
    "    </div>\n" +
    "    <div class=\"panel-body\">\n" +
    "      <div class=\"form-group\">\n" +
    "        <label>Title</label>\n" +
    "        <input type=\"text\" class=\"form-control\" name=\"title\" ng-model=\"asset.title\" />\n" +
    "        <label>File</label>\n" +
    "        <input type=\"file\" ng-model=\"file\" change=\"upload(file)\" />\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <hr>\n" +
    "\n" +
    "  <button ng-click=\"save()\" class=\"btn btn-large btn-primary\">Save</button>\n" +
    "  <button ng-click=\"remove()\" class=\"btn btn-large btn-danger\">Remove</button>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("posts/posts-list.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("posts/posts-list.tpl.html",
    "<table class=\"table table-striped-rows table-hover\">\n" +
    "  <thead>\n" +
    "    <tr>\n" +
    "        <th>Title</th>\n" +
    "        <th>Kind</th>\n" +
    "        <th>Created</th>\n" +
    "        <th>Actions</th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "  <tr ng-repeat=\"post in postList.items\">\n" +
    "    <td>{{post.title}}</td>\n" +
    "    <td>{{post.kind}}</td>\n" +
    "    <td>{{post.createdAt | date:'yyyy-MM-dd h:mma'}}</td>\n" +
    "    <td>\n" +
    "      <a ng-click=\"editPost(post)\">Edit</a>\n" +
    "    </td>\n" +
    "  </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "\n" +
    "<div class=\"well\">\n" +
    "    <button class=\"btn\" ng-click=\"newPost()\">New post</button>\n" +
    "</div>\n" +
    "");
}]);
