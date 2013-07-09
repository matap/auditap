define([
  "underscore",
  "backbone",
  "models/tracks-model",
  "models/import-file-list-model"
]
, function (_, Backbone, Tracks, ImportFileList) {
    var Project = Backbone.Model.extend({

        idAttribute: "_id",

        defaults: {
            _id: null,
            name: 'project name',
            lastChange: new Date(),
            tracks: new Tracks(),
            importFileList: new ImportFileList()
        },

        urlRoot: gAuditapSeverPath + '/project',

        parse: function (data) {
            // this.get('tracks').reset(data.tracks);

            if (this.get('tracks').length == 0) {                   // if there is no track
                for (var i = 0; i < data.tracks.length; i++) {      // create them
                    this.get('tracks').add(data.tracks[i]);
                }
            }

            //this.get('importFileList').reset(data.importFileList);
            this.get('importFileList').reset();
            for (var i = 0; i < data.importFileList.length; i++) {
                this.get('importFileList').add(data.importFileList[i]);
            }
            delete data.tracks;
            delete data.importFileList;
            return data;
        },

        sync: function (method, model, options) {
            this.set({ lastChange: new Date() });
            options.dataType = "json";
            return Backbone.sync(method, model, options);
        }
    });

    return Project;
});