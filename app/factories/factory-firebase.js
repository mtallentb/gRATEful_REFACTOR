"use strict";

app.factory("firebaseFactory", function($q, $http, $rootScope, FBCreds) {

	let provider = new firebase.auth.GoogleAuthProvider();
	let currentUser = null;
	let userSongArr = [];
	let voteArr = [];
	let favoritesArr = [];
	let search = { song: "" };
	let db = firebase.database();
	let FB = {};

	firebase.auth().onAuthStateChanged((user) => {
	  if (user){
	    currentUser = user.uid;
		} else {
	    currentUser = null;
	  }
	});

	let logInGoogle = () => {
		console.log("Login Clicked!");
	  return firebase.auth().signInWithPopup(provider);
	};

	let logOut = () => {
	  return firebase.auth().signOut();
	};

	let getCurrentUser = () => {
	  if (firebase.auth().currentUser === null) {
	  } else {
	    return firebase.auth().currentUser.uid;
	  }
	};

	/* fetches favorites data from Firebase */
	let getFavorites = () => {
		favoritesArr = [];
		let userID = getCurrentUser();
		return $q((resolve, reject) => {
			$http.get(`https://practice-1fe79.firebaseio.com/songs/${userID}/.json?orderBy="$key"`)
			.then((data) => {
				if (data) {
					let favorites = data.data;
					let keys = Object.keys(favorites);
					keys.forEach((item, index) => {
						let thisFav = favorites[item];
						thisFav.songKey = item;
						favoritesArr.push(thisFav);
					});
					resolve(favoritesArr);
				}
				else {
					console.log("There are no favorites!");
				}
			},
			(error) => {
				reject(error);
			});
		});
	};

	/* fetches comments from Firebase */
	let getComments = () => {
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

	/* pushes new comment to Firebase */
	let pushComment = (song, commentor, comment, date) => {
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

	/* fetches votes from Firebase */
	let getVotes = (song) => {
		voteArr = [];
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
		});
	};

	/* increments vote count in Firebase for given song */
	let upvote = (song) => {
		let inFB = false;
		getVotes()
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

	/* decrements vote count in Firebase for given song */
	let downvote = (song) => {
		let inFB = false;
		getVotes()
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

	/* pushes new favorite to Firebase */
	let addToFavorites = (song) => {
		let userID = getCurrentUser();
		db.ref(`/songs/${userID}/`).push({
		   			title: song.title,
            songID: song.songID,
            favorite: true,
            uid: userID
	  });
		let songsInDB = $rootScope.songsInDB;
		let updatedArr = songsInDB.concat(song);
		$rootScope.songsInDB = updatedArr;
	};

	/* totally removes favorite from Firebase */
	let removeFromFavorites = (song) => {
		let userID = getCurrentUser();
		console.log("Removing " + song.title + " from favorites! " + song.songKey);
		db.ref(`/songs/${userID}/${song.songKey}/`).remove();
		let songsInDB = $rootScope.songsInDB;
		let updatedArr = songsInDB.filter((item) => song.songID !== item.songID );
		$rootScope.songsInDB = updatedArr;
	};

	/* finds given song in Firebase and sets song.favorite to true */
	let updateFavoritesAdd = (song) => {
		console.log("Song Key to be Added: " + song.songKey);
		let userID = getCurrentUser();
		if (song.songKey) {
			db.ref(`/songs/${userID}/${song.songKey}/`).update({
					favorite: true
			});
		}
		else if (!song.songKey) {
			console.log("Added " + song.title + " to Firebase!");
			addToFavorites(song);
		}
	};

	/* finds given song in Firebase and sets song.favorite to false */
	let updateFavoritesRemove = (song) => {
		console.log("Song Key to be Removed: " + song.songKey);
		let userID = getCurrentUser();
		db.ref(`/songs/${userID}/${song.songKey}/`).update({
				favorite: false
	  });
	};

	return { logInGoogle, logOut, getVotes, upvote, downvote, getFavorites, addToFavorites, removeFromFavorites, updateFavoritesAdd, updateFavoritesRemove, getCurrentUser, getComments, pushComment };
});