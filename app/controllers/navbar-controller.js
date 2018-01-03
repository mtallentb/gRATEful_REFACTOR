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
            $scope.loggedIn = true;
            $scope.$apply();
        } else {
            $scope.loggedIn = false;
            $location.path("/");
        }
    });

    /* log into Firebase */
    $scope.login = () => {
        firebaseFactory.logInGoogle()
        .then(() => {
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

    /* fetches favorites from Firebase */
    $scope.getSongs = () => {
        $scope.showArr = true;
        firebaseFactory.getFavorites()
        .then((favorites) => {
            favorites.forEach((item, index) => {
                $scope.mainSongArr.push(item);
            });
            $scope.mainSongArr.sort((a, b) => {
                return a.vote - b.vote;
            });
            return $scope.mainSongArr;
        });
        return $scope.mainSongArr;
    };

});







