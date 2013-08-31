//this is an angular js app and controller
//read up on angular here: http://angularjs.org/
var app = angular.module("App", []);

//ng-enter (/public/app/ngEnter.js) is an angular directive, for more information
//on creating directives: http://docs.angularjs.org/guide/directive
NgEnter.add(app);

app.controller("AppCtrl", function($scope, $http) {
  //set up variables on the "view model" (for binding to the view)
  $scope.inbox = [];
  $scope.tags = [];
  $scope.tagCloud = [ ];
  $scope.searchString = "";

  //when the controller loads, get all tags,
  //then get inbox tweets
  //for each tweet, associated tags (if they exist)
  //then create tag counts out of that using TagCloud (/public/app/tagcloud.js)
  $http({ method: 'GET', url: '/tags' })
    .success(function(tags) {
      $http({ method: 'GET', url: '/inbox' })
        .success(function(data) {
          _.each(data, function(d) {
            d.show = true;

            if(tags[d.id_str]) { d.tags = tags[d.id_str]; }
            else { d.tags = ""; }
          });

          $scope.tagCloud = TagCloud.create(data);

          $scope.inbox = data;
        });
    });

  //controls whether a tweet's tags are currently being edited
  $scope.edit = function(tweet) { tweet.editing = true; };

  //saves tags for a tweet, performs an http post to /tags
  //after the round trip, unset the edit flag on the tweet
  //and regenerate the tag cloud
  $scope.saveTags = function(tweet) {
    $http.post('/tag', { id_str: tweet.id_str, tags: tweet.tags })
      .success(function(data, status, headers, config) {
        tweet.editing = false;

        $scope.tagCloud = TagCloud.create($scope.inbox);
      });
  };

  //performs and http/post to mark sorted,
  //removes the tweet from the collection after the round trip
  $scope.markSorted = function(tweet) {
    if(tweet.tags == "") {
      tweet.tags = "needs-tag!";
      $scope.saveTags(tweet);
    };

    $http.post('/markSorted', tweet)
      .success(function(data, status, headers, config) {
        $scope.inbox.splice($scope.inbox.indexOf(tweet), 1);

        $scope.tagCloud = TagCloud.create($scope.inbox);
      });
  };

  //sends a tweet directly to the archive (without putting
  //it in the sorted bucket)
  $scope.unfavorite = function(tweet) {
    $http.post('/unfavorite', tweet)
      .success(function(data, status, headers, config) {
        $scope.inbox.splice($scope.inbox.indexOf(tweet), 1);

        $scope.tagCloud = TagCloud.create($scope.inbox);
      });
  };

  //how tags should be sorted (see /public/app/tagcloud.js)
  $scope.sortTag = TagCloud.sort;

  //usability methods (search related)
  $scope.clearSearch = function() {
    $scope.searchString = "";
    $scope.search();
  };

  //usability methods (search related)
  $scope.filterOnTag = function(entry) {
    $scope.searchString = entry.tag;
    $scope.search();
  };

  //usability methods (search related)
  $scope.search = function() {
    _.each($scope.inbox, function(s) {
      if(s.text.match(new RegExp($scope.searchString, "i"))) {
        s.show = true;
      } else if (s.tags.match(new RegExp($scope.searchString, "i"))) {
        s.show = true;
      } else {
        s.show = false;
      }
    });
  };
});
