angular.module('templates.app', ['dashboard/dashboard.tpl.html', 'header.tpl.html', 'notifications.tpl.html']);

angular.module("dashboard/dashboard.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("dashboard/dashboard.tpl.html",
    "<h4>Posts</h4>\n" +
    "  <table class=\"table table-striped-rows table-hover\">\n" +
    "    <thead>\n" +
    "      <tr>\n" +
    "          <th>Title</th>\n" +
    "          <th>Kind</th>\n" +
    "          <th>Created</th>\n" +
    "          <th>Updated</th>\n" +
    "      </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "    <tr ng-repeat=\"post in posts\">\n" +
    "      <td>{{post.title}}</td>\n" +
    "      <td>{{post.kind}}</td>\n" +
    "      <td>{{post.createdAt}}</td>\n" +
    "      <td>{{post.updatedAt}}</td>\n" +
    "    </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
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
    "      <a class=\"navbar-brand\" href=\"#\" ng-click=\"home()\">Home</a>\n" +
    "    </div>\n" +
    "\n" +
    "    <!-- Collect the nav links, forms, and other content for toggling -->\n" +
    "    <div class=\"collapse navbar-collapse\" id=\"navbar-collapse\">\n" +
    "      <ul class=\"nav navbar-nav\"></ul>\n" +
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
