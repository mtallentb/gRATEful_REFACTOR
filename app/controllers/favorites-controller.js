"use strict";

app.controller("favoritesCtrl", function($scope, $q, $route, $window, $location, firebaseFactory, Spotify){

	firebaseFactory.getUserSongs()
        .then((userSongs) => {
            if (userSongs) {
                let userSongsArr = Object.values(userSongs);
                return userSongsArr;
            }
            else {
                console.log("User has no favorites yet!");
            }
        });

});