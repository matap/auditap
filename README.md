Auditap
=======
Created by Stanislav Kadlcík

### Basic functions:

audio input
scrolling audio
contraction, expansion
create new tracks
Support CTRL + C, CTRL + V, CTRL + X
view audio transcript (*.lbf files)
audio Playback
drag & drop

### Start the server:
The server part is dependent on MongoDB and NodeJS. NodeJS is needed to start up when running MongoDB
start MongoDB: mongod (if there is a folder /data/db or c:\data\db)
start node.js: node node-server.js
The application listens on port 8090


### Third party libraries:
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


### Preparation of client:
Need to change the server address in the file index.html (lines 14, 16 and 28)



![Auditap screenshot](https://github.com/matap/auditap/blob/master/img/screenShot/audio-editor.png "Auditap screenshot")




AUDITAP

Vytvořil: Stanislav Kadlcík

Zakladní funkce:

vkladaní audia
posouvání audia
zkracování, rozsirování
vytváření nových stop
podpora CTRL + C, CTRL + V, CTRL + X
zobrazení prepisu
přehrávání audia
drag & drop

Spuštění serveru: 
Serverová cást je závislá na mongoDB a na NodeJS. NodeJS je potřeba spustit až kdyz běží mongoDB
spustění mongoDB:  mongod (pokud existuje složka /data/db nebo c:\data\db)
spustění node.js: node node-server.js
Aplikace poslouchá na portu 8090 


Príprava klientské cásti:
potreba změnit adresu serveru v souboru index.html
a to konkrétne na radcich 14, 16, 28.