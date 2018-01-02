"use strict";


const app = angular.module("gRATEful", ["ngRoute" , "spotify", "firebase", "ui.materialize"]);

/* initializes firebase */
app.run(function($rootScope, FBCreds) {

    $rootScope.isAuthed = false;
    $rootScope.songsInDB = [];

    firebase.initializeApp(FBCreds);

    $(document).ready(function(){
        $('.collapsible').collapsible();    
    });
});

/* this allows the Spotify urls to be trusted by angular */
app.filter('trustAsResourceUrl', ['$sce', function($sce) {
    return function(val) {
        return $sce.trustAsResourceUrl(val);
    };
}]);

app.config(($routeProvider, SpotifyProvider, SpotifyCreds) => {

    $routeProvider 
    .when('/', {
        templateUrl: 'partials/search.html',
        controller: 'searchCtrl'
    })
    .when('/favorites', {
        templateUrl: 'partials/favorites.html',
        controller: 'favoritesCtrl'
    })
    .otherwise('/');

    SpotifyProvider.setClientId(`${SpotifyCreds.client_id}`);
    SpotifyProvider.setRedirectUri('https://gratefulapp.surge.sh/');
    SpotifyProvider.setScope('user-read-private playlist-read-private playlist-modify-private playlist-modify-public');

});



