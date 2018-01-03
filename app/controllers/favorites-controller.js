"use strict";

app.controller("favoritesCtrl", function($scope, $location, firebaseFactory, Spotify){

    $scope.removeFromFavorites = function(song) {
        firebaseFactory.removeFromFavorites(song);
    };


});