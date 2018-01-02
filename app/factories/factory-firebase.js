"use strict";

app.factory("firebaseFactory", function($q, $http, $rootScope, FBCreds) {

	let provider = new firebase.auth.GoogleAuthProvider();
	let currentUser = null;
	let userSongArr = [];
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
	    let userID = getCurrentUser();
	    return $.ajax({
	        url: `https://practice-1fe79.firebaseio.com/votes/.json?orderBy="$key"`
	    }).done((data) => {
		    let votes = data;
		    let keys = Object.keys(votes);
		    keys.forEach((item, index) => {
		    	votes[item].key = item;
		    });
		    return votes;
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

	let upvote = (song) => {
		console.log("Song Info: " + JSON.stringify(song));
		if (song.songKey) {
			console.log("songKey: " + song.songKey);
			// db.ref(`/votes/${song.songKey}/`).update({  	
			// 			vote: vote.vote
      // });
		}
		else {
			console.log("This song is not in Firebase.");
		}
	};

	// let upvote = function(song) {
	//   let votesArr = [];
	//   getVotes()
	//   .then((votesArr) => {
	// 		console.log("Votes from Firebase: ", votes);
	//   	let inFB = false;
	//   	let vote;
  //       votesArr.forEach((item, index) => {
  //       	if (String(song.songID) === item.songID) {
  //               inFB = true;
  //               vote = item;
  //               item.vote++;
  // 				return vote;
  //           }
  //       });
  //       if (inFB) {
  //       	console.log("/votes/" + vote.voteKey);
  //       	console.log(song.title + "is in Firebase!");
  //       	db.ref(`/votes/${vote.voteKey}/`).update({  	
	// 					vote: vote.vote
  //         });
  //       } else if (!inFB) {
  //       	console.log(song.title + " is NOT in Firebase!");
  //       	db.ref(`/votes/`).push({
	// 					vote: 1,
	// 					title: song.title,
	// 					songID: song.songID
	// 				});
  //       }
	//   });
	// };

	let downvote = function(song) {
	  db.ref(`/votes/`).update({
	    vote: -1
	  });
	};

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