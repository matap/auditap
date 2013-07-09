Auditap

Created by Stanislav Kadlèík

Basic functions:

audio input
scrolling audio
contraction, expansion
create new tracks
Support CTRL + C, CTRL + V, CTRL + X
view audio transcript (*.lbf files)
audio Playback
drag & drop

Start the server:
The server part is dependent on MongoDB and NodeJS. NodeJS is needed to start up when running MongoDB
start MongoDB: mongod (if there is a folder /data/db or c:\data\db)
start node.js: node node-server.js
The application listens on port 8090


Third party libraries:

Blueimp jquery file upload
Socket.io
Backbone
Underscore
JQuery
Require.js

Node-ffprobe
PCM
Express
MongoDB


Preparation of client:

Need to change the server address in the file index.html (lines 14, 16 and 28)





AUDITAP

Vytvoøil: Stanislav Kadlèík

Základní funkce: 

vkládání audia
posouvání audia
zkracování, rozšiøování
vytváøení nových stop
podpora CTRL + C, CTRL + V, CTRL + X
zobrazení pøepisu
pøehrávání audia
drag & drop

Spuštìní serveru: 
Serverová èást je závislá na mongoDB a na NodeJS. NodeJS je potøeba spustit až když bìží mongoDB
spuštìní mongoDB:  mongod (pokud existuje složka /data/db nebo c:\data\db)
spuštìní node.js: node node-server.js
Aplikace poslouchá na portu 8090 


Pøíprava klientské èásti:
potøeba zmìnit adresu serveru v souboru index.html
a to konkrétnì na øádcích 14, 16, 28. 