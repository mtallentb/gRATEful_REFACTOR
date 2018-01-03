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
            console.log("Enter Pressed!");
            $scope.searchSpotify();
        }
    };


    /* fetches songs from Firebase. Pushes all data to new array and sorts it */
    $scope.getSongs = () => {
        $scope.showArr = true;
        console.log("Loading Songs...");
        firebaseFactory.getFavorites()
        .then((favorites) => {
            console.log(Object.keys(favorites));
            let songKeys = Object.keys(favorites);
            songKeys.forEach((item, index) => {
                console.log("Item:", item);
                let thisSong = favorites[item];
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

    /* fetches comments from Firebase */
    $scope.getComments = () => {
        console.log("Loading Comments...");
        firebaseFactory.getComments()
        .then((comments) => {
            let keys = Object.keys(comments);
            keys.forEach((item, index) => {
                $scope.commentsArr.push(comments[item]);
            });
            console.log("Comments Array:", $scope.commentsArr);
            return $scope.commentsArr;
        });
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
        console.log("Upvoted " + song.title + "!");
        firebaseFactory.upvote(song);
        $scope.songResults.forEach((item, index) => {
            if (song.songID === item.songID) {
                item.vote++;
            }
        });
    };

    /* decrements vote count for given song in Firebase and locally */
    $scope.downvote = (song) => {
        console.log("Downvoted " + song.name + "!");
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
            console.log(favorites);
            favorites.forEach((item, index) => {
                if (song.songID === item.songID) {
                    if (!song.songkey) {
                        song.songKey = item.songKey;
                    }
                    if (!item.favorite) {
                        console.log(item.favorite + " <= should be false.");
                        firebaseFactory.updateFavoritesAdd(song);
                        song.favorite = true;
                        inFB = true;
                    }
                    else if (item.favorite) {
                        console.log(item.favorite + " <= should be true.");
                        firebaseFactory.updateFavoritesRemove(song);
                        song.favorite = false;
                        inFB = true;
                    }
                }
            });
            if (!inFB) {
                console.log(inFB + "<= inFB should be false.");
                firebaseFactory.addToFavorites(song);
                song.favorite = true;
            }
        });
    };

    /* searches Spotify API for songs. pulls data from Firebase. combines all relative data into master array of songs */
    $scope.searchSpotify = (input = $scope.songSearch.song) => {
        $scope.showResults = false;
        $scope.loading = true;
        let userID = firebaseFactory.getCurrentUser();
        $scope.getComments();
        $scope.songResults = [];
        let favoritesArr = [];
        firebaseFactory.getVotes()
        .then((votes) => {
            if (votes) {
                console.log("Votes: ", votes);
                let voteArr = Object.values(votes).sort((a, b) => {
                    return b.vote - a.vote;
                });
                return voteArr;
            }
            else {
                console.log("There are no votes!");
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
                    console.log("Search Results: ", searchResults);
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
                        // console.log("votedOn: " + item.votedOn + " favorited: " + item.favorited);
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
                    console.log("Song Results: ", $scope.songResults);
                })
                .then(() => {
                    $scope.loading = false;
                    $scope.showResults = true;
                });
            });
        });
    };
});