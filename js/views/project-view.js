/**
 * Audio editor
 * Created by: Stanislav Kadlcik (xkadlc03@fit.vutbr.cz)
 * 2013
 */

define([
  "jquery",
  "jqueryUI",
  "jqueryWheel",
  "jqueryCSV",
  "underscore",
  "backbone",
  "views/timeline-view",
  "views/import-file-list-view"
]
, function ($, JqueryUI, JqueryWheel, JqueryCSV, _, Backbone, timelineView, ImportFileListView) {

    /**
      * This view takes care about global project settings
      */
    var ProjectView = Backbone.View.extend({
        el: $('body'),

        events: {
            'click div#zoomIn': 'zoomIn',
            'click div#zoomOut': 'zoomOut',
            'click div#mouseTool': 'mouseTool',
            'click div#cutTool': 'cutTool',
            'click div#play': 'play',
            'click div#save': 'save',
            'keydown': 'keyPress'
        },

        initialize: function () {
            _.bindAll(this, 'connection', 'render', 'zoomIn', 'zoomOut', 'mouseTool', 'cutTool', 'play',
                'save', 'copy', 'paste', 'copyAndDelete', 'keyPress', 'modelChange', 'close');


            this.zoomInState = true;
            var self = this;
            /* $(window).on("beforeunload", function () {
                 return 'Are you sure you want to leave?';
                 this.socket.emit('disconnect');
                 this.socket.disconnect();
            });*/

            this.model.fetch({
                success: function (model) {
                    var projectObj = JSON.parse(JSON.stringify(model));

                    self.socket = io.connect(gAuditapSeverPath);   //, { 'force new connection': true }

                    self.timelineView = new timelineView({ model: self.model.get('tracks'), socket: self.socket });
                    self.playing = false;
                    self.importFileListView = new ImportFileListView({
                        collection: self.model.get('importFileList'),
                        parent: self
                    });
                    self.mouseToolButton = false;
                    self.cutToolButton = true;
                    self.render();
                    self.connection();
                    self.model.bind('change', self.modelChange);
                    self.timelineView.changeRange();
                },
                error: function (model, res) {
                    alert("error: " + res.status);
                }
            });
        },



        modelChange: function () {

        },

        close: function () {

        },

        connection: function () {
            this.timelineView.setSocket(this.socket);
            var _trackListView = this.timelineView.trackListView;
            this.socket.on('pcmdata', function (data) {
                for (var i = 0; i < _trackListView.trackView.length; i++) {
                    for (var j = 0; j < _trackListView.trackView[i].clipListView.clipView.length; j++) {
                        if (typeof _trackListView.trackView[i].clipListView.clipView[j] != "undefined") {
                            if (_trackListView.trackView[i].clipListView.clipView[j].model.get('id') == data.id) {
                                _trackListView.trackView[i].clipListView.clipView[j].setData(data);
                            }
                        }
                    }
                }
            });
        },

        /**
         * rendering
         */
        render: function () {
            this.mouseTool();
        },

        enableZoomIn: function () {
            this.zoomInState = true;
            $('#zoomIn').addClass('zoomInEnabled').removeClass('zoomInDisabled');
        },

        disableZoomIn: function () {
            this.zoomInState = false;
            $('#zoomIn').addClass('zoomInDisabled').removeClass('zoomInEnabled');
        },

        zoomIn: function () {
            if (this.zoomInState) {
                this.timelineView.zoomIn();
                this.timelineView.centerToTracker();
                this.timeForPixel = this.timelineView.getTimeForPixel();

                if (this.timeForPixel < 0.0041217) this.disableZoomIn();
            }
        },

        zoomOut: function () {
            this.timelineView.zoomOut();
            this.timelineView.centerToTracker();

            if (this.timeForPixel < 0.0041217) this.enableZoomIn();
        },

        /**
         * Select basic tool (ordinary mouse)
         */
        mouseTool: function () {
            this.mouseToolButton = true;
            this.cutToolButton = false;
            $('#mouseTool').addClass('toolSelected');
            $('#cutTool').removeClass('toolSelected');
            tool = 'mouseTool';
        },

        /**
         * Set cut tool
         */
        cutTool: function () {
            this.cutToolButton = true;
            this.mouseToolButton = false;
            $('#cutTool').addClass('toolSelected');
            $('#mouseTool').removeClass('toolSelected');
            tool = 'cutTool';
        },

        showMessage: function (msg, state) {

            state = typeof state !== 'undefined' ? state : true;            // default parameter is true

            var inColor;
            var outColor;

            if (state) {
                inColor = "#b9d0bd";        // green
                outColor = "#ffffff";       // white
            }
            else {
                inColor = "#e1d0d0";        // red
                outColor = "#e1d0d0";       // the same red
            }

            $('#message').html(msg);
            $('#message').stop(true, true).stop(true, true).stop(true, true).fadeIn(100).animate({ backgroundColor: inColor }, 300).animate({ backgroundColor: outColor }, 300).delay(10000).fadeOut(3000);
        },

        save: function (message) {
            message = typeof message !== 'undefined' ? message : "Project was <b>successfully saved</b> to the server. Remember url.";
            var self = this;
            this.model.save(
                {},
                {
                    success: function () {
                        self.showMessage(message, true);

                    },
                    error: function () {
                        self.showMessage("Error: Saving was not successfull", false);
                    }
                });
        },

        copy: function () {
            this.timelineView.copy();
        },

        paste: function () {
            this.timelineView.paste();
        },

        copyAndDelete: function () {
            this.timelineView.copyAndDelete();
        },

        /**
         * On key press event
         * reaction on keyboard commands
         */
        keyPress: function (e) {
            e.preventDefault();
            e = e || window.event;
                // ctrl + c
            if (e.which == '67' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.copy();
            }
                // ctrl + v
            else if (e.which == '86' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.paste();
            }
                // ctrl + x
            else if (e.which == '88' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.copyAndDelete();
            }
                // space
            else if (e.keyCode == 32) {
                this.play();
            }
                // v
            else if (e.keyCode == 86) {
                this.mouseTool();
            }
                // c
            else if (e.keyCode == 67) {
                this.cutTool();
            }
                // +
            else if ((e.keyCode == 73) || (e.keyCode == 107)) {
                this.zoomIn();
            }
                // -
            else if ((e.keyCode == 79) || (e.keyCode == 109)) {
                this.zoomOut();
            }
                // ctrl + s
            else if ((e.which == '115' || e.which == '83') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.save();
            }

        },

        /*
         * Method triggered on clicking on play button
         */
        play: function () {
            if (this.timelineView.playing == false) {
                this.timelineView.play();
            }
            else {
                this.timelineView.pause();
            }
        }

    });

    return ProjectView;
});