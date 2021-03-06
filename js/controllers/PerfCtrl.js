panelApp.controller('PerfCtrl', function PerfCtrl($scope, appContext, filesystem) {

  $scope.histogram = [];

  $scope.min = 0;
  $scope.max = 100;

  $scope.clearHistogram = function () {
    appContext.clearHistogram();
  };

  $scope.exportData = function () {
    filesystem.exportJSON('file.json', $scope.histogram);
  };

  // TODO: remove this (newVal === oldVal ?)
  var first = true;

  appContext.getDebug(function (result) {
    $scope.enable = result;

    $scope.$watch('enable', function (newVal, oldVal) {
      // prevent refresh on initial pageload
      if (first) {
        first = false;
      } else {
        appContext.setDebug(newVal);
      }
    });
  });

  $scope.$watch('log', function (newVal, oldVal) {
    appContext.setLog(newVal);
  });

  $scope.inspect = function () {
    appContext.inspect(this.val.id);
  };

  var updateHistogram = function () {
    var info = appContext.getHistogram();
    if (!info) {
      return;
    }
    var total = 0;
    info.forEach(function (elt) {
      total += elt.time;
    });
    var i, elt, his;
    for (i = 0; (i < $scope.histogram.length && i < info.length); i++) {
      elt = info[i];
      his = $scope.histogram[i];
      his.time = elt.time.toPrecision(3);
      his.percent = (100 * elt.time / total).toPrecision(3);
    }
    for ( ; i < info.length; i++) {
      elt = info[i];
      elt.time = elt.time.toPrecision(3);
      elt.percent = (100 * elt.time / total).toPrecision(3);
      $scope.histogram.push(elt);
    }
    $scope.histogram.length = info.length;
  };

  var updateTree = function () {
    var rts = appContext.getListOfRoots();
    if (!rts) {
      // if app not bootstrapped, return undefined
      return;
    }
    var roots = [];
    rts.forEach(function (item) {
      roots.push({
        label: item,
        value: item
      });
    });

    $scope.roots = roots;
    var trees = appContext.getModelTrees();
    if (!$scope.trees || $scope.trees.length !== trees.length) {
      $scope.trees = trees;
    } else {

      var syncBranch = function (oldTree, newTree) {
        if (!oldTree || !newTree) {
          return;
        }
        oldTree.locals = newTree.locals;
        if (oldTree.children.length !== newTree.children.length) {
          oldTree.children = newTree.children;
        } else {
          oldTree.children.forEach(function (oldBranch, i) {
            var newBranch = newTree.children[i];
            syncBranch(newBranch, oldBranch);
          });
        }
      };

      var treeId, oldTree, newTree;
      for (treeId in $scope.trees) {
        if ($scope.trees.hasOwnProperty(treeId)) {
          oldTree = $scope.trees[treeId];
          newTree = trees[treeId];
          syncBranch(oldTree, newTree);
        }
      }
    }

    if (roots.length === 0) {
      $scope.selectedRoot = null;
    } else if (!$scope.selectedRoot) {
      $scope.selectedRoot = roots[0].value;
    }
    $scope.$apply();
  };
  appContext.watchPoll(updateTree);
  appContext.watchPoll(updateHistogram);
});
