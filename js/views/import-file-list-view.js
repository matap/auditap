define([
  "jquery",
  "jqueryUI",
  "jqueryWheel",
  "underscore",
  "backbone",
  "views/import-file-view",
  "models/audio-file-model",
  "fileupload-main"
]
, function ($, JqueryUI, JqueryWheel, _, Backbone, ImportFileView, AudioFile, FileuploadMain) {

    var ImportFileListView = Backbone.View.extend({
        el: $('#playlist'),

        initialize: function () {
            _.bindAll(this, 'reset', 'render', 'addItem', 'appendItem', 'addUploadedFile');

            this.collection.bind('add', this.appendItem);
            this.collection.bind('reset', this.reset);

            this.parent = this.options.parent;
            this.counter = 0;
            this.render();
            var self = this;
            $('#fileupload').bind('fileuploaddone', function (e, data) { self.addUploadedFile(data); })
        },

        reset: function () {
            $(this.el).empty();
        },

        render: function () {
            var self = this;
            
            //$(this.el).append("<button id='add' class='ui-button ui-widget ui-state-default ui-corner-all'>Add list item2</button>");
            /*$(this.el).append('<div href="#" class="fileItem"> Name </div>' +
            '<div class="deleteFile" style="cursor:pointer; color:red; font-family:sans-serif;">Del</div>'+
            '<div class="showDuration">  time </div>' + 
            '<div class="showSampleRate"> sample Rate </div>' +
            '<div class="clear"></div>');*/
            //$(this.el).append("<div id='content'></div>");
            _(this.collection.models).each(function (item) {
                self.appendItem(item);
            }, this);
        },

        addUploadedFile: function (data) {
            var fileInfo = JSON.parse(JSON.stringify(data.result));
            if (!fileInfo[0].transcript) {
                this.addItem(fileInfo[0].name, fileInfo[0].path, fileInfo[0].duration, fileInfo[0].sampleRate, "@no");
            } else {
                this.addItem(fileInfo[0].name, fileInfo[0].path, fileInfo[0].duration, fileInfo[0].sampleRate, "@yes");
            }

            this.parent.save("File was successfully uploaded", true);
        },

        addItem: function (name, path, duration, sampleRate, transcript) {
            var audioFile = new AudioFile();
            audioFile.set({
                name: name,
                path: path,
                duration: duration,
                sampleRate: sampleRate,
                transcript: transcript
            });
            this.collection.add(audioFile);
        },

        appendItem: function (item) {
            var importFileView = new ImportFileView({
                model: item
            });
            $(this.el).append(importFileView.render().el);
            this.counter++;
        }
    });
    return ImportFileListView;
});