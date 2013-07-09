Auditap
=======
Created by Stanislav Kadlcik

### Basic functions
*   audio input
*   scrolling audio
*   contraction, expansion
*   create new tracks
*   Support CTRL + C, CTRL + V, CTRL + X
*   view audio transcript (*.lbf files)
*   audio Playback
*   drag & drop
*   saving project to server (JSON format)

### Start the server
The server part is dependent on MongoDB and NodeJS. NodeJS is needed to start up when running MongoDB
start MongoDB: mongod (if there is a folder /data/db or c:\data\db)


Start node.js: node node-server.js
The application listens on port 8090


### Third party libraries
*   Node.js
*   Blueimp jquery file upload
*   Socket.io
*   Backbone
*   Underscore
*   JQuery
*   Require.js
*   Node-ffprobe
*   PCM
*   Express
*   MongoDB


### How to prepare client
Need to change the server address in the file index.html (lines 14, 16 and 28)



![Auditap screenshot](https://raw.github.com/matap/auditap/master/img/screenShot/audio-editor.png "Auditap screenshot")



### License
Attribution-NonCommercial-NoDerivs 3.0 Unported
http://creativecommons.org/licenses/by-nc-nd/3.0/