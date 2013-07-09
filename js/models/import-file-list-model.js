define([
  "underscore",
  "backbone",
  "models/audio-file-model"

]
, function (_, Backbone, AudioFile) {

    /**
     * Collection of imported audio files
     */
    var ImportFileList = Backbone.Collection.extend({
        model: AudioFile
    });

    return ImportFileList;
});



