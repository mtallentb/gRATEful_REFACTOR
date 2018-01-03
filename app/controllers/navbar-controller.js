"use strict";

app.controller("navbarCtrl", function($scope, $rootScope, $route, $location, firebaseFactory, Spotify){

    $scope.albums = [];
    $scope.mainSongArr = [];
    $scope.songSearch = { song: "" };
    $scope.showArr = false;
    $scope.loggedIn = false;
    let voteRef = firebase.database().ref().child("votes");

    /* Checks for auth state. Updates isLoggedIn boolean */
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log("Current UID: ", user.uid);
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
        firebaseFactory.logInGoogle()
        .then(() => {
            console.log("Logging into Spotify...");
            Spotify.login();
        })
        .then(() => {
            $rootScope.isAuthed = true;
        })
        .then(() => {
            $rootScope.songsInDB = $scope.getSongs();
        });
    };

    $scope.logout = function() {
        firebaseFactory.logOut()
        .then(() => {
            $scope.loggedIn = false;
            $rootScope.isAuthed = false;
        })
        .then(() => {
            $route.reload();
        });
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
        firebaseFactory.getSongs()
        .then((songData) => {
            console.log(Object.keys(songData));
            let songKeys = Object.keys(songData);
            songKeys.forEach((item, index) => {
                let thisSong = songData[item];
                thisSong.songKey = item;
                $scope.mainSongArr.push(thisSong);
            });
            $scope.mainSongArr.sort((a, b) => {
                return a.vote - b.vote;
            });
            console.log("Songs from Firebase:", $scope.mainSongArr);
            return $scope.mainSongArr;
        });
        return $scope.mainSongArr;
    };

});







