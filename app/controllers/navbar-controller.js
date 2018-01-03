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
    $scope.login = () => {
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

    /* logs out and reloads route */
    $scope.logout = () => {
        firebaseFactory.logOut()
        .then(() => {
            $scope.loggedIn = false;
            $rootScope.isAuthed = false;
        })
        .then(() => {
            $route.reload();
        });
    };

    /* fetches comments from Firebase */
    $scope.getComments = () => {
        console.log("Loading Comments...");
        firebaseFactory.getComments()
        .then((results) => {
            console.log("Comments:", results);
        });
    };

    /* fetches favorites from Firebase */
    $scope.getSongs = () => {
        $scope.showArr = true;
        firebaseFactory.getFavorites()
        .then((favorites) => {
            console.log(favorites);
            favorites.forEach((item, index) => {
                $scope.mainSongArr.push(item);
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







