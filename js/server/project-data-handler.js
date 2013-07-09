
var mongo = require('mongodb'),
    fs = require('fs'),
    path = require("path");

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, { auto_reconnect: true });
db = new Db('audioEditordb', server);

var emptyProj = '{' +
    '"_id": "",' +
    '"name": "project name",' +
    '"tracks": [ ' +
      '{' +
          '"name": "track0",' +
          '"volume": 100,' +
          '"mute": false,' +
          '"selected": false,' +
          '"clips": []' +
      '},' +
      '{' +
          '"name": "track1",' +
          '"volume": 100,' +
          '"mute": false,' +
          '"selected": false,' +
          '"clips": []' +
      '},' +
      '{' +
          '"name": "track2",' +
          '"volume": 100,' +
          '"mute": false,' +
          '"selected": false,' +
          '"clips": []' +
      '}' +
   '],' +
   '"importFileList": []' +
   '}';

var threeTracksProj = '[{ "name": "track0", "volume": 100, "mute": false, "selected": false, "clips": [] }, { "name": "track1", "volume": 100, "mute": false, "selected": false, "clips": [] }, { "name": "track2", "volume": 100, "mute": false, "selected": false, "clips": [] }]';


/**
 * Returns path and name of file, but without extension
 */
function nameWithoutExt(fileName) {
    return fileName.substr(0, fileName.lastIndexOf('.'));
}

/**
 * This function compares importListFiles of two object - the old one and the new. 
 * If it finds some file, which is in old version of importListFile and is NOT in the new version, the file was erased by user
 * and is important to delete it.
 */
function deleteWasteFiles(oldProj, newProj) {
    var newPath = new Array();
    for (var i = 0; i < newProj.importFileList.length; i++) {
        newPath[i] = newProj.importFileList[i].path + newProj.importFileList[i].name;
    }
    for (var i = 0; i < oldProj.importFileList.length; i++) {
        var oldPath = oldProj.importFileList[i].path + oldProj.importFileList[i].name;
        var finded = newPath.indexOf(oldPath);
        if (finded == -1) {             // I didn't find it
            var fullPath = path.join(__dirname, "../../", oldPath);
            console.log("deleting file: " + fullPath);
            fs.unlink(fullPath);                            // delete source
            fs.unlink(nameWithoutExt(fullPath) + ".ogg");   // delete ogg
            fs.unlink(nameWithoutExt(fullPath) + ".mp3");   // delete mp3
        }
    }
}

db.open(function (err, db) {
    console.log(err);
    if (!err) {
        console.log("Connected to 'audioEditordb' database");
        db.createCollection('audioProjects', { strict: true }, function (err, collection) {
            if (!err) {
                console.log("The 'audioProjects' collection doesn't exist. Creating it with sample data...");
                db.collection('audioProjects', function (err, collection) {               
                });
            }
        });
    }
});

exports.findById = function (req, res) {
    var id = req.params.id;
    console.log('Retrieving project: ' + id);
    db.collection('audioProjects', function (err, collection) {
        collection.findOne({ '_id': new BSON.ObjectID(id) }, function (err, item) {
            if (item == null) {
                item = JSON.parse(emptyProj);
                item._id = id;
            }
            if (err != null) console.log("Error: " + err);
            console.log("Sending data: " + JSON.stringify(item));
            res.send(item);
        });
    });
};

exports.add = function (req, res) {
    var audioProject = req.body;
    console.log('Adding new project: ' + JSON.stringify(audioProject));
    db.collection('audioProjects', function (err, collection) {
        // in new project add three tracks
        audioProject.tracks = JSON.parse(threeTracksProj);
        collection.insert(audioProject, { safe: true }, function (err, result) {
            if (err) {
                console.log('Error adding project: ' + err);
                res.send({ 'error': 'An error has occurred' });
            } else {
                result[0].tracks = JSON.parse(threeTracksProj);
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
};

exports.update = function (req, res) {
    var id = req.params.id;
    var audioProject = req.body;
    audioProject._id = new BSON.ObjectID(id);
    console.log('Updating project: ' + id);
    db.collection('audioProjects', function (err, collection) {

        // save old object - I will erase files, that aren't in the new project but are in old project. They are considered as a waste. 
        collection.findOne({ '_id': new BSON.ObjectID(id) }, function (err, item) {
            if (item == null) {
                item = JSON.parse(emptyProj);
                item._id = id;
            }
            
            // updating
            collection.update({ '_id': new BSON.ObjectID(id) }, audioProject, { safe: true }, function (err, result) {
                if (err) {
                    console.log('Error updating project: ' + err);
                    res.send({ 'error': 'An error has occurred' });
                } else {
                    console.log('' + result + ' document(s) updated');
                    res.send(audioProject);
                }

                deleteWasteFiles(item, audioProject);       // compare the old one and the new version
            });
        });
    });
};

exports.delete = function (req, res) {
    var id = req.params.id;
    console.log('Deleting project: ' + id);
    db.collection('audioProjects', function (err, collection) {
        collection.remove({ '_id': new BSON.ObjectID(id) }, { safe: true }, function (err, result) {
            if (err) {
                res.send({ 'error': 'An error has occurred - ' + err });
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
};