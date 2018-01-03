"use strict";

app.factory("firebaseFactory", function($q, $http, $rootScope, FBCreds) {

	let provider = new firebase.auth.GoogleAuthProvider();
	let currentUser = null;
	let userSongArr = [];
	let voteArr = [];
	let search = { song: "" };

	firebase.auth().onAuthStateChanged((user) => {
	  // console.log("onAuthStateChanged", user);
	  if (user){
	    currentUser = user.uid;
	    // console.log("current user Logged in?", currentUser);
	  } else {
	    currentUser = null;
	    // console.log("current user NOT logged in:", currentUser);
	  }
	});

	let db = firebase.database();
	let FB = {};

	// let getCurrentUser = function() {
	// 	return firebase.auth().currentUser.uid;
	// };

	let logInGoogle = function() {
		console.log("Login Clicked!");
	  return firebase.auth().signInWithPopup(provider);
	};

	let logOut = function() {
	  return firebase.auth().signOut();
	};

	let getCurrentUser = function() {
	  if (firebase.auth().currentUser === null) {
	    //create function somewhere that forces user to login
	  } else {
	    return firebase.auth().currentUser.uid;
	  }
	};

	let getUserSongs = function() {
		let userID = getCurrentUser();
		return $.ajax({
			url: `https://practice-1fe79.firebaseio.com/songs/${userID}/.json?orderBy="$key"`
		}).done((data) => {
			if (data) {
				let songs = data;
				let keys = Object.keys(songs);
				keys.forEach((item, index) => {
					songs[item].key = item;
				});
				return songs;
			}
			else {
				console.log("This user hasn't rated any songs yet!");
			}
		});
	};

	let getVotes = function() {
	    return $.ajax({
	        url: `https://practice-1fe79.firebaseio.com/votes/.json?orderBy="$key"`
	    }).done((data) => {
				let votes = data.data;
				if (votes) {
					let keys = Object.keys(votes);
					keys.forEach((item, index) => {
						let thisVote = votes[item];
						thisVote.songKey = item;
						voteArr.push(thisVote);
					});
					console.log("Data from getVotes(): " + votes);
					return votes;
				}
				else {
					console.log("There are no votes!");
				}
	    });
	};

	let getComments = function() {
	    let userID = getCurrentUser();
	    return $.ajax({
	        url: `https://practice-1fe79.firebaseio.com/comments/.json?orderBy="$key"`
	    }).done((data) => {
		    let comments = data;
		    let keys = Object.keys(comments);
		    keys.forEach((item, index) => {
		    	comments[item].key = item;
		    });
		    return comments;
	    });
	};

	let pushComment = function(song, commentor, comment, date) {
		let user = getCurrentUser();
		db.ref(`/comments/`).push({
		    title: song.title,
		    songID: song.songID,
		    commentor: commentor,
		    comment: comment,
		    date: date,
		    uid: user
		});
	};

	let getVote = (song) => {
		return $q((resolve, reject) => {
			$http.get(`https://practice-1fe79.firebaseio.com/votes/.json?orderBy="$key"`)
			.then((response) => {
				console.log(response.data);
				let keys = Object.keys(response.data);
				console.log("Vote Keys: " + keys);
				keys.forEach((item, index) => {
					let thisVote = response.data[item];
					thisVote.songKey = item;
					voteArr.push(thisVote);
				});
				resolve(voteArr);
			},
			(error) => {
				reject(error);
			});
			console.log("Song Info: " + JSON.stringify(song));
		});
	};

	let upvote = (song) => {
		let inFB = false;
		getVote()
		.then((votes) => {
			console.log(votes);
			votes.forEach((item, index) => {
				if (item.songID === song.songID) {
					db.ref(`/votes/${item.songKey}/`).update({	
						vote: item.vote + 1 
      		});
					inFB = true;
				}
			});
			if (!inFB) {
				db.ref(`/votes/`).push({
					title: song.title,
					songID: song.songID,
					vote: 1 
      	});
			}
		});
	};

	let downvote = (song) => {
		let inFB = false;
		getVote()
		.then((votes) => {
			console.log(votes);
			votes.forEach((item, index) => {
				if (item.songID === song.songID) {
					db.ref(`/votes/${item.songKey}/`).update({	
						vote: item.vote - 1 
      		});
					inFB = true;
				}
			});
			if (!inFB) {
				db.ref(`/votes/`).push({
					title: song.title,
					songID: song.songID,
					vote: -1 
      	});
			}
		});
	};

	// let downvote = function(song) {
	//   db.ref(`/votes/`).update({
	//     vote: -1
	//   });
	// };

	let addToFavorites = function(song) {
		let userID = getCurrentUser();
		db.ref(`/songs/${userID}/`).push({
		   	title: song.title,
            songID: song.songID,
            favorite: true,
            songKey: db.ref().key,
            uid: userID
	  	});
		let songsInDB = $rootScope.songsInDB;
		let updatedArr = songsInDB.concat(song);
		$rootScope.songsInDB = updatedArr;
	};

	let removeFromFavorites = function(song) {
		let userID = getCurrentUser();
		console.log("Removing " + song.title + " from favorites! " + song.songKey);
		db.ref(`/songs/${userID}/${song.songKey}`).remove();
		let songsInDB = $rootScope.songsInDB;
		let updatedArr = songsInDB.filter((item) => song.songID !== item.songID );
		$rootScope.songsInDB = updatedArr;
	};

	let getSongs = function() {
	  return new Promise ((resolve, reject) => {
	    let userID = getCurrentUser();
	    if (userID === undefined) {
	      return;
	    } else {
	      $.ajax({
	        url: `https://practice-1fe79.firebaseio.com/songs/${userID}/.json?orderBy="$key"`
	      }).done((data) => {
	        console.log("Song Data:", data);
	        let songsFromFB = data;
	        resolve(songsFromFB);
	      });
	    }
	  });
	};

	return { logInGoogle, logOut, getUserSongs, getVotes, upvote, downvote, addToFavorites, removeFromFavorites, getSongs, getCurrentUser, getComments, pushComment };
});