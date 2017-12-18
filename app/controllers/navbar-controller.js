"use strict";

app.controller("navbarCtrl", function($scope, $q, $route, $window, $location, firebaseFactory, Spotify){

    $scope.albums = [];
    $scope.mainSongArr = [];
    $scope.songSearch = { song: "" };
    $scope.showArr = false;
    $scope.loggedIn = false;
    let voteRef = firebase.database().ref().child("votes");

    /* Checks for auth state. Updates isLoggedIn boolean */
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("Current UID", user.uid);
            $scope.loggedIn = true;
            $scope.$apply();
        } else {
            $scope.loggedIn = false;
            console.log("User is logged out");
            $location.path("/");
        }
    });

    /* log into Firebase */
    $scope.login = function() {
        console.log("Clicked Login!");
        firebaseFactory.logInGoogle();
    };

    $scope.loginSpotify = function() {
        Spotify.login();
    };

    $scope.logout = function() {
        firebaseFactory.logOut();
        $scope.loggedIn = false;
    };

    $scope.getUserKeys = function() {
        firebaseFactory.getUserKeys()
        .then((results) => {
            console.log("User Song Results:", results);
        });
    };

    $scope.listSongs = function() {
        console.log("Listing Songs...");
        $scope.songArr = firebaseFactory.getUserSongs();
        console.log("Listed Array:", $scope.songArr);
        return $scope.songArr;
    };

    $scope.logVotes = function() {
        console.log("Listing Votes...");
        firebaseFactory.getVotes()
        .then((results) => {
            console.log("Vote Results:", results);
        });
    };

    $scope.getComments = function() {
        console.log("Loading Comments...");
        firebaseFactory.getComments()
        .then((results) => {
            console.log("Comments:", results);
        });
    };

    $scope.getSongs = function() {
        $scope.showArr = true;
        console.log("Loading Songs...");
        firebaseFactory.getSongs()
        .then((songData) => {
            console.log(Object.keys(songData));
            let songKeys = Object.keys(songData);
            songKeys.forEach((item, index) => {
                console.log("Item:", item);
                let thisSong = songData[item];
                thisSong.songKey = item;
                $scope.mainSongArr.push(thisSong);
            });
            $scope.mainSongArr.sort((a, b) => {
                return a.vote - b.vote;
            });
            console.log("Sorted Array:", $scope.mainSongArr);
            return $scope.mainSongArr;
        });
        return $scope.mainSongArr;
    };

});







