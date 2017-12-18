"use strict";

app.controller("searchCtrl", function($scope, $q, $route, $window, $location, firebaseFactory, Spotify, $firebaseObject, $firebaseArray){

    $scope.showResults = false;
    $scope.noresults = false;
    $scope.loading = false;
    $scope.albums = [];
    $scope.mainSongArr = [];
    $scope.userID = firebaseFactory.getCurrentUser();
    $scope.songSearch = { song: "" };
    $scope.comment = { 
        name: "",
        comment: "" 
    };
    $scope.showSongs = false;
    $scope.showArr = false;
    $scope.fav = false;
    $scope.commentsArr = [];
    $scope.favoriteStatus = $firebaseArray(firebase.database().ref().child("songs").child("eoqovG0XD7fTEto26s3HMuSDbMG3"));
    let voteRef = firebase.database().ref().child("votes");
    $scope.votes = $firebaseObject(voteRef);


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

    $scope.getComments = function() {
        console.log("Loading Comments...");
        firebaseFactory.getComments()
        .then((comments) => {
            console.log("Comments: ", comments);
            let keys = Object.keys(comments);
            keys.forEach((item, index) => {
                console.log(comments[item]);
                $scope.commentsArr.push(comments[item]);
                console.log(" ");
                console.log("Commentor's Name:", comments[item].commentor);
                console.log("Comment: ", comments[item].comment);
            });
            console.log("Comments Array:", $scope.commentsArr);
            return $scope.commentsArr;
        });
    };

    $scope.pushComment = function(song) {
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

    let votesArr = [];

    $scope.getVotes = function() {
        // let votesArr = [];
        firebaseFactory.getVotes()
        .then((votes) => {
            let voteKeys = Object.keys(votes);
            voteKeys.forEach((item, index) => {
                // console.log("Item:", item);
                let thisVote = votes[item];
                thisVote.voteKey = item;
                // console.log("This Vote: ", thisVote);
                votesArr.push(thisVote);
            });
            votesArr.sort((a, b) => {
                return a.vote - b.vote;
            });
            return votesArr;
        })
        .then((votesArr) => {
            console.log("Votes Array:", votesArr);
            Spotify.search(`'${$scope.songSearch.song}', 'Grateful Dead'`, 'track,artist')
            .then((results) => {
                console.log("Search Results:", results.data.tracks.items);
                let searchResults = results.data.tracks.items;
                searchResults.forEach((item, index) => {
                    // console.log("Item:", String(item.id));
                    votesArr.forEach((element, position) => {
                        // console.log("Vote: ", element.songID);
                        if (String(item.id) === element.songID) {
                            console.log(element.title + " has " + element.vote + " votes!");

                        }
                    });
                });
                return searchResults;
            });
        });
    };
     
    $scope.upvote = function(song) {
        console.log("Upvoted " + song.title + "!");
        console.log("Song ID: ", song.songID);
        firebaseFactory.upvote(song);
        $scope.songResults.forEach((item, index) => {
            if (song.songID === item.songID) {
                item.vote++;
            }
        });
        console.log("New Sorted Song Results", $scope.songResults);
    };

    $scope.downvote = function(song) {
        console.log("Downvoted " + song.name + "!");
        console.log("Song ID: ", song.id);
        firebaseFactory.downvote(song); 
    };

    $scope.addToFavorites = function(song) {
        console.log("Added " + song.title + " to your favorites!");
        $scope.songResults.forEach((item, index) => {
            if (song.songID === item.songID) {
                item.favorite = true;
                console.log(song.title + " = " + item.title + " and the favorite status in FB is " + item.favorite + ", but locally the status is " + song.favorite);
            }
        });
        firebaseFactory.addToFavorites(song);
    };

    $scope.searchSpotify = function(input = $scope.songSearch.song) {
        $scope.showResults = false;
        $scope.loading = true;
        let userID = firebaseFactory.getCurrentUser();
        $scope.getComments();
        $scope.songResults = [];
        let userSongsArr;
        // votesArr = [];
        // $scope.showResults = true;
        firebaseFactory.getVotes()
        .then((votes) => {
            console.log("Votes: ", votes);
            let voteArr = Object.values(votes).sort((a, b) => {
                return b.vote - a.vote;
            });
            return voteArr;
        })
        .then((voteArr) => {
            firebaseFactory.getUserSongs()
            .then((userSongs) => {
                if (userSongs) {
                    userSongsArr = Object.values(userSongs);
                    return userSongsArr;
                }
                else {
                    console.log("User has no favorites yet!");
                }
            })
            .then((userSongsArr) => {
                console.log("Sorted Votes Array: ", voteArr);
                console.log("My Songs in FB:", userSongsArr);
                Spotify.search(`'${input}', 'Grateful Dead'`, 'track,artist')
                .then((results) => {
                    let searchResults = results.data.tracks.items;
                    console.log("Search Results: ", searchResults);
                    searchResults.forEach((item, index) => {
                        item.inFB = false;
                        item.userSongsArr = false;
                        voteArr.forEach((element, position) => {
                            if (item.id === element.songID) {
                                // console.log(item.name + " has been voted on!");
                                item.votedOn = true;
                                item.vote = element.vote;
                                item.voteKey = item.key;
                            }
                        });
                        if (userSongsArr) {
                            userSongsArr.forEach((element, position) => {
                                if (item.id === element.songID) {
                                    // console.log(item.name + " has been added to user's favorites!");
                                    item.inFB = true;
                                    item.favorite = element.favorite;
                                    item.songKey = element.key;
                                }
                            });
                        }
                        // console.log("votedOn: " + item.votedOn + " favorited: " + item.favorited);
                        if (item.votedOn && item.inFB) {
                            console.log(item.name + " has been voted " + item.vote + " times and favorited!");
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
                                songKey: 'song key',
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
                                voteKey: 'vote key',
                                uid: userID
                            });
                        }
                        else if (!item.votedOn && !item.inFB) {
                            $scope.songResults.push({
                                title: item.name,
                                songID: item.id,
                                vote: 0,
                                favorite: false,
                                songKey: 'song key',
                                voteKey: 'vote key',
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