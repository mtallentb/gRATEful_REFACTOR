"use strict";

app.controller("searchCtrl", function($scope, $q, firebaseFactory, Spotify){

    $scope.showResults = false;
    $scope.noresults = false;
    $scope.loading = false;
    $scope.mainSongArr = [];
    $scope.userID = firebaseFactory.getCurrentUser();
    $scope.songSearch = { song: "" };
    $scope.showSongs = false;
    $scope.showArr = false;
    $scope.commentsArr = [];
    $scope.comment = { 
        name: "",
        comment: "" 
    };
    let votesArr = [];

    /* searches on Enter keypress */
    $scope.keypress = (event) =>  {
        if (event.keyCode == 13) {
            $scope.searchSpotify();
        }
    };

    /* pushes new comment to Firebase */
    $scope.pushComment = (song) => {
        let date = new Date();
        let today = date.getMonth() + "/" + date.getDate() + "/" + date.getFullYear();
        $scope.date = today;
        $scope.commentsArr.push({
            commentor: $scope.comment.name,
            comment: $scope.comment.comment,
            songID: song.songID,
            title: song.title,
            date: today
        });
        firebaseFactory.pushComment(song, $scope.comment.name, $scope.comment.comment, today);
        $scope.comment.name = "";
        $scope.comment.comment = "";
    };
     
    /* increments vote count for given song in Firebase and locally */
    $scope.upvote = (song) => {
        firebaseFactory.upvote(song);
        $scope.songResults.forEach((item, index) => {
            if (song.songID === item.songID) {
                item.vote++;
            }
        });
    };

    /* decrements vote count for given song in Firebase and locally */
    $scope.downvote = (song) => {
        firebaseFactory.downvote(song);
        $scope.songResults.forEach((item, index) => {
            if (song.songID === item.songID) {
                item.vote--;
            }
        }); 
    };

    /*
       if song is in Firebase but not favorited: sets favorite to true
       if song is in Firebase and favorited: sets favorite to false
       if song isn't in Firebase: pushes new favorite to Firebase 
    */
    $scope.addToFavorites = (song) => {
        let inFB = false;
        firebaseFactory.getFavorites()
        .then((favorites) => {

            favorites.forEach((item, index) => {
                if (song.songID === item.songID) {
                    if (!song.songkey) {
                        song.songKey = item.songKey;
                    }
                    if (!item.favorite) {
                        firebaseFactory.updateFavoritesAdd(song);
                        song.favorite = true;
                        inFB = true;
                    }
                    else if (item.favorite) {
                        firebaseFactory.updateFavoritesRemove(song);
                        song.favorite = false;
                        inFB = true;
                    }
                }
            });
            if (!inFB) {
                firebaseFactory.addToFavorites(song);
                song.favorite = true;
            }
        });
    };

    /* searches Spotify API for songs. pulls data from Firebase. combines all relative data into master array of songs */
    $scope.searchSpotify = (input = $scope.songSearch.song) => {
        let userID = firebaseFactory.getCurrentUser();
        let favoritesArr = [];
        $scope.showResults = false;
        $scope.loading = true;
        firebaseFactory.getComments();
        $scope.songResults = [];
        firebaseFactory.getVotes()
        .then((votes) => {
            if (votes) {

                let voteArr = Object.values(votes).sort((a, b) => {
                    return b.vote - a.vote;
                });
                return voteArr;
            }
            else {
                return [];
            }
        })
        .then((voteArr) => {
            firebaseFactory.getFavorites()
            .then((favorites) => {
                if (favorites) {
                    favoritesArr = Object.values(favorites);
                    return favoritesArr;
                }
                else {
                    console.log("User has no favorites yet!");
                }
            })
            .then((favoritesArr) => {
                Spotify.search(`'${input}', 'Grateful Dead'`, 'track,artist')
                .then((results) => {
                    let searchResults = results.data.tracks.items;
                    searchResults.forEach((item, index) => {
                        item.inFB = false;
                        voteArr.forEach((element, position) => {
                            if (item.id === element.songID) {
                                item.votedOn = true;
                                item.vote = element.vote;
                                item.voteKey = item.key;
                            }
                        });
                        if (favoritesArr) {
                            favoritesArr.forEach((element, position) => {
                                if (item.id === element.songID) {
                                    item.inFB = true;
                                    item.favorite = element.favorite;
                                    item.songKey = element.key;
                                }
                            });
                        }
                        if (item.votedOn && item.inFB) {
                            $scope.songResults.push({
                                title: item.name,
                                songID: item.id,
                                vote: item.vote,
                                favorite: item.favorite,
                                songKey: item.songKey,
                                voteKey: item.voteKey,
                                uid: userID
                            });
                        } 
                        else if (item.votedOn && !item.inFB) {
                            $scope.songResults.push({
                                title: item.name,
                                songID: item.id,
                                vote: item.vote,
                                favorite: false,
                                voteKey: item.voteKey,
                                uid: userID
                            });
                        }
                        else if (!item.votedOn && item.inFB) {
                            $scope.songResults.push({
                                title: item.name,
                                songID: item.id,
                                vote: 0,
                                favorite: item.favorite,
                                songKey: item.songKey,
                                uid: userID
                            });
                        }
                        else if (!item.votedOn && !item.inFB) {
                            $scope.songResults.push({
                                title: item.name,
                                songID: item.id,
                                vote: 0,
                                favorite: false,
                                uid: userID
                            });
                        }
                    });
                })
                .then(() => {
                    $scope.loading = false;
                    $scope.showResults = true;
                });
            });
        });
    };
});