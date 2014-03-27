angular.module('templates.app', ['assets/assets-edit.tpl.html', 'assets/assets-list.tpl.html', 'common/security/login/form.tpl.html', 'common/security/login/toolbar.tpl.html', 'dashboard/dashboard.tpl.html', 'header.tpl.html', 'notifications.tpl.html', 'posts/posts-edit.tpl.html', 'posts/posts-list.tpl.html']);

angular.module("assets/assets-edit.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("assets/assets-edit.tpl.html",
    "<form name=\"form\" novalidate>\n" +
    "\n" +
    "  <legend>Asset</legend>\n" +
    "\n" +
    "  <div class=\"well well-lg\">\n" +
    "    <figure class=\"row\">\n" +
    "      <div class=\"col-md-12\">\n" +
    "        <img class=\"img-thumbnail img-responsive center-block\" ng-src=\"{{asset.url}}\" />\n" +
    "      </div>\n" +
    "    </figure>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"well well-lg\">\n" +
    "    <dl>\n" +
    "      <div class=\"row\">\n" +
    "        <div class=\"col-xs-6\">\n" +
    "          <dt>Filename</dt>\n" +
    "          <dd>{{asset.filename}}</dd>\n" +
    "          <dt>Size</dt>\n" +
    "          <dd>{{asset.bytes}}</dd>\n" +
    "          <dt>Mime</dt>\n" +
    "          <dd>{{asset.mimetype}}</dd>\n" +
    "          <dt>Storage</dt>\n" +
    "          <dd>{{asset.storage}}</dd>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"col-xs-6\">\n" +
    "          <dt>Type</dt>\n" +
    "          <dd>{{asset.type}}</dd>\n" +
    "          <dt>Height</dt>\n" +
    "          <dd>{{asset.height}}</dd>\n" +
    "          <dt>Width</dt>\n" +
    "          <dd>{{asset.width}}</dd>\n" +
    "          <dt>Created</dt>\n" +
    "          <dd>{{asset.createdAt}}</dd>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </dl>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"form-group\">\n" +
    "    <label>Title</label>\n" +
    "    <input type=\"text\" class=\"form-control\" name=\"title\" ng-model=\"asset.title\" />\n" +
    "  </div>\n" +
    "  <div class=\"form-group\">\n" +
    "    <label>Description</label>\n" +
    "    <textarea class=\"form-control\" name=\"description\" rows=\"2\" ng-model=\"asset.description\"></textarea>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"panel panel-default\" ng-show=\"asset.posts\">\n" +
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
    "        <th>Filename</th>\n" +
    "        <th>Kind</th>\n" +
    "        <th>Created</th>\n" +
    "        <th>Actions</th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "  <tr ng-repeat=\"asset in assetList.items\">\n" +
    "    <td>{{asset.filename}}</td>\n" +
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

angular.module("common/security/login/form.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/security/login/form.tpl.html",
    "<form name=\"form\" novalidate class=\"login-form\">\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h4>Sign in</h4>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "        <div class=\"alert alert-warning\" ng-show=\"authReason\">\n" +
    "            {{authReason}}\n" +
    "        </div>\n" +
    "        <div class=\"alert alert-error\" ng-show=\"authError\">\n" +
    "            {{authError}}\n" +
    "        </div>\n" +
    "        <input type=\"text\" name=\"username\" ng-model=\"user.username\" class=\"form-control\" placeholder=\"Email or Username\" required autofocus>\n" +
    "        <input type=\"password\" name=\"password\" ng-model=\"user.password\" class=\"form-control\" placeholder=\"Password\" required>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <button class=\"btn btn-primary login\" ng-click=\"login()\" ng-disabled='form.$invalid'>Sign in</button>\n" +
    "        <button class=\"btn btn-warning cancel\" ng-click=\"cancelLogin()\">Cancel</button>\n" +
    "    </div>\n" +
    "</form>\n" +
    "");
}]);

angular.module("common/security/login/toolbar.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/security/login/toolbar.tpl.html",
    "<ul class=\"nav navbar-nav navbar-right\">\n" +
    "  <li class=\"dropdown\" ng-show=\"isAuthenticated()\">\n" +
    "      <a href=\"#\" class=\"dropdown-toggle\">\n" +
    "        {{currentUser.displayName}}\n" +
    "        <b class=\"caret\"></b>\n" +
    "      </a>\n" +
    "      <ul class=\"dropdown-menu\">\n" +
    "        <li class=\"divider\"></li>\n" +
    "        <li ng-show=\"isAuthenticated()\" class=\"logout\">\n" +
    "          <button class=\"btn btn-link\" ng-click=\"logout()\">Log out</button>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "  </li>\n" +
    "  <li ng-hide=\"isAuthenticated()\" class=\"login\">\n" +
    "    <form class=\"navbar-form\">\n" +
    "      <button class=\"btn login\" ng-click=\"login()\">Log in</button>\n" +
    "    </form>\n" +
    "  </li>\n" +
    "</ul>\n" +
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
    "      <button ng-init=\"navCollapsed = true\" ng-click=\"navCollapsed = !navCollapsed\" type=\"button\" class=\"navbar-toggle\">\n" +
    "        <span class=\"sr-only\">Toggle navigation</span>\n" +
    "        <span class=\"icon-bar\"></span>\n" +
    "        <span class=\"icon-bar\"></span>\n" +
    "        <span class=\"icon-bar\"></span>\n" +
    "      </button>\n" +
    "      <a class=\"navbar-brand\" href=\"/admin/dashboard\">Dashboard</a>\n" +
    "    </div>\n" +
    "\n" +
    "    <!-- Collect the nav links, forms, and other content for toggling -->\n" +
    "    <div class=\"collapse navbar-collapse\" id=\"navbar-collapse\" collapse=\"navCollapsed\">\n" +
    "      <ul class=\"nav navbar-nav\">\n" +
    "        <li><a href=\"/admin/posts\">Posts</a></li>\n" +
    "        <li><a href=\"/admin/assets\">Assets</a></li>\n" +
    "      </ul>\n" +
    "\n" +
    "      <login-toolbar></login-toolbar>\n" +
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
    "\n" +
    "  <div class=\"row\">\n" +
    "    <div class=\"col-sm-8\">\n" +
    "      <div class=\"form-group\">\n" +
    "        <label class=\"sr-only\">Headline</label>\n" +
    "        <text-angular\n" +
    "          placeholder=\"[Snappy Headline]\"\n" +
    "          name=\"headline\"\n" +
    "          ng-model=\"post.headline\"\n" +
    "          ta-toolbar-group-class=\"btn-group btn-group-sm\"\n" +
    "          ta-toolbar=\"[['bold','italics']]\"\n" +
    "          ta-text-editor-class=\"ta-form-control ta-input-lg\"\n" +
    "          ta-html-editor-class=\"ta-form-control ta-input-lg\"></text-angular>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label class=\"sr-only\">Body</label>\n" +
    "        <text-angular\n" +
    "          placeholder=\"[The story.]\"\n" +
    "          name=\"body\"\n" +
    "          ng-model=\"post.body\"\n" +
    "          ta-toolbar-group-class=\"btn-group btn-group-sm\"\n" +
    "          ta-toolbar=\"[['h1','h2','h3'],['p','ol','ul'],['bold','italics', 'underline']]\"\n" +
    "          ta-text-editor-class=\"ta-form-textarea\"\n" +
    "          ta-html-editor-class=\"ta-form-textarea\"></text-angular>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-sm-4\">\n" +
    "\n" +
    "      <div class=\"panel panel-default\">\n" +
    "        <div class=\"panel-heading\">\n" +
    "          <h4 class=\"panel-title\">Tags</h4>\n" +
    "        </div>\n" +
    "        <div class=\"panel-body\">\n" +
    "\n" +
    "          <div ng-repeat=\"tag in post.tags\">\n" +
    "            <h4>\n" +
    "              <span class=\"label label-info\">{{tag.name}}</span>\n" +
    "              <button type=\"button\" class=\"close\" aria-hidden=\"true\" ng-click=\"removeTag(tag)\">&times;</button>\n" +
    "            </h4>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"form-group\">\n" +
    "            <label class=\"sr-only\">New Tag</label>\n" +
    "            <input\n" +
    "              type=\"text\"\n" +
    "              ng-model=\"selectedTag\"\n" +
    "              placeholder=\"New tag...\"\n" +
    "              typeahead=\"tag as tag.name for tag in tagsAutocomplete($viewValue) | filter:$viewValue\"\n" +
    "              typeahead-editable=\"false\"\n" +
    "              typeahead-loading=\"loadingTags\"\n" +
    "              typeahead-on-select=\"addTag(selectedTag)\" />\n" +
    "            <i ng-show=\"loadingTags\" class=\"glyphicon glyphicon-refresh\"></i>\n" +
    "          </div>\n" +
    "\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"panel panel-default\">\n" +
    "        <div class=\"panel-heading\">\n" +
    "          <h4 class=\"panel-title\">Assets</h4>\n" +
    "        </div>\n" +
    "        <div class=\"panel-body\">\n" +
    "\n" +
    "          <div class=\"row\">\n" +
    "            <div ng-repeat=\"asset in post.assets\">\n" +
    "              <div class=\"col-xs-6 col-md-4\">\n" +
    "                <a class=\"thumbnail\" ng-click=\"editAsset(asset)\">\n" +
    "                  <img ng-src=\"{{asset.url}}\" />\n" +
    "                </a>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"form-group\">\n" +
    "            <label>File</label>\n" +
    "            <input type=\"file\" ng-model=\"upload.file\" change=\"createAsset(upload)\" />\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    "  <hr>\n" +
    "\n" +
    "  <button ng-click=\"save()\" class=\"btn btn-large btn-primary\">Save</button>\n" +
    "  <button ng-click=\"remove()\" class=\"btn btn-large btn-danger\">Remove</button>\n" +
    "\n" +
    "</form>\n" +
    "\n" +
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
