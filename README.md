# The gRATEful App

<p align="center">
    <img src="http://mttbrwn.com/wp-content/uploads/2018/01/grateful-screenshot1.jpg" />
</p>

<p align="center">
    <img src="http://mttbrwn.com/wp-content/uploads/2018/01/grateful-screenshot2.jpg" />
</p>

## Introduction

Over the course of their 30 year musical history, the Grateful Dead played more than 2,300 live shows around the globe. The goal of this app is to find the "best" live versions of any song!

[Demo](http://gratefulapp.mttbrwn.com)

## Getting Started

1. Clone this repo. `git clone https://github.com/mtallentb/gRATEful_REFACTOR.git`
2. `cd gRATEful_REFACTOR`
3. Inside the `lib/` folder, run `npm install`

### Create Firebase Account

1. Create a [Firebase](http://firebase.google.com) database.
2. Click `Authentication > Sign-In Method` and enable Google.
3. Click the `Whitelist client IDs from external projects` tab and add your local redirect URI (normally `https://localhost:3000`).
4. Click Save.
5. Click the `Add Domain` button under the Authorized Domains header.
6. Add the same redirect URI to this file as well.
7. Click the `Database` tab on the the left navigation panael.
8. Click the `Rules` tab. The JSON file look like this:

```
{
  "rules": {
    ".read": true,
    ".write": true,
      "songs": {
        	"$uid": {
            	"$key": {
                ".indexOn": ["vote"]
              }
          }
      }
  }
}
```

9. Click the `Data` tab then `click the three dots in the upper right corner of the view.
10. Click `Import JSON` and import `data/example.json`.

#### The database is now set up.

11. Update `app/values/fb-creds.js` to contain  the following:

```
"use strict";

app.constant("FBCreds", {
    apiKey: "<API_KEY>",
    authDomain: "<PROJECT_ID>.firebaseapp.com",
    databaseURL: "https://<DATABASE_NAME>.firebaseio.com",
    storageBucket: "<BUCKET>.appspot.com",
    messagingSenderId: "<SENDER_ID>",
});
```

### Create Spotify App with [Spotify Developer Tools](https://beta.developer.spotify.com/dashboard/)

1. Create new app on Spotify's Developer site.
2. Look for `Client ID` and `Client Secret`.
3. Add your `https://localhost:3000/` to the redirect URI whitelist.
4. Update `app/values/spotify-creds.js` to contain the following:

```
"use strict";

app.constant("SpotifyCreds", {
	client_id: "<CLIENT ID>",
	client_secret: "<CLIENT SECRET>",
	redirect_uri: "https://localhost:3000/"
});
```
5. Update `app/app.js`. Scroll to the bottom of the code and fill in the following:

`SpotifyProvider.setRedirectUri('<YOUR REDIRECT URI />');`

### After Updating Spotify and Firebase Credentials

1. Move to `lib/` folder and run `grunt`
2. Start your local server `http-server -S -o` ( may need to `npm install http-server -g`)

### Allow Pop Ups for Spotify Login