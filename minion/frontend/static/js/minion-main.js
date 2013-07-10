// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

var app = angular.module("MinionApp", ["ui.bootstrap", "minionAdminPlansModule", "minionAdminSitesModule", "minionAdminPluginsModule"]);

app.controller("MinionController", function($rootScope, $scope, $http, $location) {
    if (sessionStorage.getItem("email")) {
        $rootScope.session = {email: sessionStorage.getItem("email"), role: sessionStorage.getItem("role")};
    } else {
        $rootScope.session = null;
    }
    navigator.id.logout();
    navigator.id.watch({
        loggedInUser: sessionStorage.getItem("email"),
    onlogin: function(assertion) {
            data = {assertion: assertion, invite_id: $rootScope.inviteId}
            $http.post('/api/login', data)
                .success(function(response, status, headers, config) {
                    if (response.success) {
                        $rootScope.session = response.data;
                        sessionStorage.setItem("email", response.data.email);
                        sessionStorage.setItem("role", response.data.role);
                        $location.path("/home/sites").replace();
                    } else {
                        $scope.logInStatus = response.reason;
                        $location.path("/login").replace();
                    }
                });
    },
    onlogout: function() {
            //$rootScope.session = null;
            //sessionStorage.removeItem("email");
            //sessionStorage.removeItem("role");
    }
    });

    $rootScope.signOut = function() {
        $rootScope.session = null;
        sessionStorage.removeItem("email");
        sessionStorage.removeItem("role");
        navigator.id.logout();
        $location.path("/login").replace();
    };

    $rootScope.openScan = function (scanId) {
        if (scanId)
            $location.path("/scan/" + scanId); // .replace();
    };

    $rootScope.openIssue = function (scanId, issueId) {
        if (scanId)
            $location.path("/scan/" + scanId + "/issue/" + issueId);
    };

    $rootScope.startScan = function (target, plan) {
        $http.put('/api/scan/start', {target: target, plan: plan })
            .success(function(response, status, headers, config) {
                //$scope.reload();
            });
    };

    $rootScope.stopScan = function (scanId) {
    $http.put('/api/scan/stop', {scanId: scanId})
        .success(function(response, status, headers, config) {
        //$scope.reload();
        });
    };
});

app.config(function($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('!');
    $routeProvider
        .when("/", { templateUrl: "static/partials/home.html", controller: "HomeController" })
        .when("/home/sites", { templateUrl: "static/partials/home.html", controller: "HomeController" })
        .when("/home/history", { templateUrl: "static/partials/history.html", controller: "HistoryController" })
        .when("/home/issues", { templateUrl: "static/partials/issues.html", controller: "IssuesController" })
        .when("/request", { templateUrl: "static/partials/request.html", controller: "RequestController" })
        .when("/invite/:inviteId", { templateUrl: "static/partials/invite.html", controller: "InviteController" })
        .when("/scan/:scanId", { templateUrl: "static/partials/scan.html", controller: "ScanController" })
        .when("/scan/:scanId/raw", { templateUrl: "static/partials/raw.html", controller: "RawController" })
        .when("/scan/:scanId/issue/:issueId", { templateUrl: "static/partials/issue.html", controller: "IssueController" })
        .when("/scan/:scanId/session/:sessionIdx/failure", { templateUrl: "static/partials/session-failure.html", controller: "SessionFailureController" })
        .when("/plan/:planName", { templateUrl: "static/partials/plan.html", controller: "PlanController" })
        .when("/history", { templateUrl: "static/partials/history.html", controller: "HistoryController" })
        .when("/login", { templateUrl: "static/partials/login.html", controller: "LoginController" })
        // Administration
        .when("/admin/sites", { templateUrl: "static/partials/admin/sites.html", controller: "AdminSitesController" })
        .when("/admin/users", { templateUrl: "static/partials/admin/users.html", controller: "AdminUsersController" })
        .when("/admin/groups", { templateUrl: "static/partials/admin/groups.html", controller: "AdminGroupsController" })
        .when("/admin/groups/:groupName", { templateUrl: "static/partials/admin/group.html", controller: "AdminGroupController" })
        .when("/admin/plugins", { templateUrl: "static/partials/admin/plugins/plugins.html", controller: "AdminPluginsController" })
        .when("/admin/plans", { templateUrl: "static/partials/admin/plans/plans.html", controller: "AdminPlansController" })
        .when("/admin/invites", { templateUrl: "static/partials/admin/invites.html", controller: "AdminInvitesController" });
});

app.run(function($rootScope, $http, $location) {

    $rootScope.backToLogin = function() {
        $rootScope.session = null;
        $location.path("/login");
    }
    $rootScope.signIn = function(inviteid) {
        if (inviteid) {
            $rootScope.inviteId = inviteid;
            navigator.id.request();
        } else {
            $rootScope.inviteId = null;
            navigator.id.request();
        }
    }
    $rootScope.$on( "$routeChangeStart", function(event, next, current) {
        // make  /invites/:inviteId into a whitelist
        has_invite = $location.url().substring().split('/')[1] == "invite"
        if (!has_invite && !$rootScope.session) {
            if (next.$$route.templateUrl !== "static/partials/login.html" ) {
                $location.path("/login");
            }
        }
    });
    if (0)
    $http.get('/api/session').success(function(response, status, headers, config) {
        if (response.success) {
            $rootScope.session = response.data;
            $location.path("/home/sites").replace();
        } else {
            $rootScope.session = null;
            $location.path("/login").replace();
        }
    });
});

app.controller("LoginController", function($scope, $rootScope, $location) {
    //$rootScope.ssignIn = function() {
    //    navigator.id.request();
    //};
});

app.controller("HomeController", function($scope, $http, $location, $timeout) {
    var scheduleReload = function () {
    };

    $scope.reload = function () {
        $http.get('/api/sites').success(function(response, status, headers, config){
            _.each(response.data, function (r, idx) {
                r.label = r.target;
                if (idx > 0) {
                    if (r.target === response.data[idx-1].target) {
                        r.label = "";
                    }
                }
            });
            $scope.report = response.data;

            if ($scope.report.length > 0) {
                $timeout(function () {
                    $scope.reload();
                }, 2500);
            }
        });
    };

    $scope.$on('$viewContentLoaded', function() {
        $scope.reload();
    });
});

app.controller("IssuesController", function($scope, $http, $location, $timeout) {
    $scope.filterName = 'all';
    $scope.reload = function () {
        $http.get('/api/issues').success(function(response, status, headers, config){
        $scope.report = response.data;
        });
    };
    $scope.$on('$viewContentLoaded', function() {
        $scope.reload();
    });
});

app.controller("InviteController", function ($scope, $rootScope, $routeParams, $http, $location) {
    $scope.inviteId = $routeParams.inviteId;
 
    $http.get('/api/invites/' + $scope.inviteId)
        .success(function(response, status, headers, config) {
            if (!response.success) {
                $scope.invite_state_msg = "Your invitation link is invalid."
                $scope.invite_state = "invalid";
            } else {
                sent_on = response.data['sent_on'];
                accepted_on = response.data['accepted_on'];
                expire_on = response.data['expire_on'];
                invite_status = response.data['status'];
                if (accepted_on || 
                     (invite_status == 'expired' || invite_status == 'used')) {
                    $location.path("/login");
                } else { 
                    timenow = Math.round(new Date().getTime()/1000);
                    if ((expire_on - timenow) < 0) {
                        $scope.invite_state_msg = "Your invitation is expired."
                        $scope.invite_state = "expired";
                    } else {
                        $scope.invite_state_msg = "Your invitation will expire on " + 
                                moment.unix(expire_on).format("YYYY-MM-DD HH:mm");
                        $scope.invite_state = "available";
                    }
               }}});
}); 

app.controller("HistoryController", function($scope, $http, $location, $timeout) {
    $scope.openScan = function (scanId) {
        $location.path("/scan/" + scanId); // .replace();
    };

    $scope.reload = function () {
        $http.get('/api/history').success(function(response, status, headers, config){
            $scope.history = response.data;
        });
    };

    $scope.$on('$viewContentLoaded', function() {
        $scope.reload();
    });
});

app.controller("RawController", function ($scope, $routeParams, $http, $location) {
    $scope.$on('$viewContentLoaded', function() {
        $http.get('/api/scan/' + $routeParams.scanId)
            .success(function(response, status, headers, config) {
                $scope.scan = response.data;
                $scope.formatted_scan = JSON.stringify(response.data, null, 4);
            });
    });
});

app.controller("ScanController", function($scope, $routeParams, $http, $location) {
    $scope.$on('$viewContentLoaded', function() {
        $http.get('/api/scan/' + $routeParams.scanId).success(function(response, status, headers, config) {
            var scan = response.data;
            var issues = [];
            var issueCounts = {high: 0, medium: 0, low: 0, info: 0, error: 0};
            _.each(scan.sessions, function (session) {
                _.each(session.issues, function (issue) {
                    issue.session = session;
                    issues.push(issue);
                    switch (issue.Severity) {
                        case "High":
                            issueCounts.high++;
                            break;
                        case "Medium":
                            issueCounts.medium++;
                            break;
                        case "Low":
                            issueCounts.low++;
                            break;
                        case "Informational":
                        case "Info":
                            issueCounts.info++;
                            break;
                        case "Error":
                            issueCounts.error++;
                            break;
                    }
                });
            });
        var failures = []
        _.each(scan.sessions, function (session, idx) {
        if (session.failure) {
            failures.push({session_idx: idx, plugin: session.plugin, failure: session.failure});
        }
        });
            $scope.scan = scan;
            $scope.issues = issues;
            $scope.issueCounts = issueCounts;
        $scope.failures = failures;
        });
    });
});

app.controller("PlanController", function($scope, $routeParams, $http, $location) {
    $scope.$on('$viewContentLoaded', function() {
        $http.get('/api/plan/' + $routeParams.planName).success(function(response, status, headers, config) {
            $scope.plan = response.data;
        });
    });
});

app.controller("IssueController", function($scope, $routeParams, $http) {
    $scope.$on('$viewContentLoaded', function() {
        $http.get('/api/scan/' + $routeParams.scanId + '/issue/' + $routeParams.issueId).success(function(response, status, headers, config) {
            $scope.issue = response.data.issue;
            $scope.session = response.data.session;
            $scope.scan = response.data.scan;
        });
    });
});

app.controller("SessionFailureController", function($scope, $routeParams, $http) {
    $scope.$on('$viewContentLoaded', function() {
        $http.get('/api/scan/' + $routeParams.scanId).success(function(response, status, headers, config) {
            var scan = response.data;
        $scope.session = scan.sessions[$routeParams.sessionIdx];
        });
    });
});

// Filters

app.filter('moment', function () {
    return function(input, options) {
        return moment(input).format(options.format || "YYYY-MM-DD");
    };
});

app.filter('scan_datetime', function () {
    return function(input, options) {
        if (input) {
            return moment.unix(input).format("YYYY-MM-DD HH:mm");
        } else {
            return "Never";
        }
    };
});

app.filter('scan_datetime_fromnow', function () {
    return function(input, options) {
        return moment.unix(input).fromNow();
    };
});

app.filter('moment_duration', function () {
    return function(input, options) {
        var start = moment(0);
        var end = moment(input);
        return end.from(start, true);
    };
});

app.filter('link_bugs', function () {
    return function(input, options) {
        if (!input) {
            return "";
        }
        return input.replace(/\#(\d{6,7})/,function (match, bugId) {
            var a = "https://bugzilla.mozilla.org/show_bug.cgi?id=" + bugId;
            return '<a href="' + a + '" target="_blank">#' + bugId + '</a>';
        });
    };
});

app.filter('text', function () {
    return function(input, options) {
        var result = "";
        if (input) {
            var paragraphs = input.split("\n");
            for (var i = 0; i < paragraphs.length; i++) {
                result += "<p>" + paragraphs[i] + "</p>";
            }
        }
        return result;
    };
});
