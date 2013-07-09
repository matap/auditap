define([
  "jquery",
  "jqueryUI",
  "underscore",
  "backbone"
]
, function ($, JqueryUI, _, Backbone) {

   /**
    * View of model of audio file
    */
var ImportFileView = Backbone.View.extend({
    tagName: 'div',

    className: "playlistItem",

    events: {
        'click div.deleteFile': 'remove',
        'dragstart': '_dragStartEvent',
        'dragover': '_dragOverEvent',
        'dragenter': '_dragEnterEvent',
        'dragleave': '_dragLeaveEvent',
        'dragend': '_dragEndEvent',
        'drop': '_dropEvent'
    },
    initialize: function () {
        _.bindAll(this, 'render', 'unrender', 'remove', 'changeModel',
            '_dragOverEvent', '_dragEnterEvent', '_dragLeaveEvent', '_dragEndEvent', '_dropEvent');

        this.model.bind('change', this.changeModel);
        this.model.bind('remove', this.unrender);
        $(this.el).attr("href", "#");
        this.delegateEvents(_.extend(this.events, { 'dragstart': '_dragStartEvent' }));
    },

    render: function () {
        var transcriptImg;
       
        if (this.model.get('transcript') == "@no") {
            transcriptImg = "transparent.png";
        } else {
            transcriptImg = "transcript-on.png";
        }

        if (this.model.get('transcript') == "@yes") {
            $(this.el).addClass("transcript");
            $(this.el).html('<a href="#" class="fileItem " style="color:black;" draggable="true" ' +
           '> transcript: ' + this.model.get('name') + '</a>' +
           ' <div id="playlistInfo">' +
            '<div class="deleteFile" style="cursor:pointer; color:red; font-family:sans-serif;"><img src="img/trash2.png" alt="delete" /></div>' +
               '<div class="showTranscript">  <img src="img/' + transcriptImg + '" title="' + this.model.get('transcript') + '"></div>' +
           ' </div>' +
           '<div class="clear"></div>'
           );
        } else {
            $(this.el).html('<a href="#" class="fileItem" style="color:black;" draggable="true" ' +
            ' path="' + this.model.get('path') + '"' +
            ' name="' + this.model.get('name') + '"' +
            ' duration="' + this.model.get('duration') + '"' +
            ' sampleRate="' + this.model.get('sampleRate') + '"' +
            '>' + this.model.get('name') + '</a>' +
            ' <div id="playlistInfo">' +
                '<div class="deleteFile" style="cursor:pointer; color:red; font-family:sans-serif;"><img src="img/trash2.png" alt="delete" /></div>' +
                '<div class="showDuration"> ' + convertTime(this.model.get('duration')) + '</div>' +
                '<div class="showSampleRate"> ' + this.model.get('sampleRate') + 'Hz </div>' +
                '<div class="showTranscript">  <img src="img/' + transcriptImg + '" title="' + this.model.get('transcript') + '"></div>' +
            ' </div>' +
            '<div class="clear"></div>'
            );
        }
        return this;
    },

    unrender: function () {
        $(this.el).remove();
    },

    remove: function () {
        this.model.destroy({
            success: function (model, response) {
                $(this.el).remove();
            },
            error: function (model, response) {
            }
        });
    },

    changeModel: function () {
        this.render();
    },

    _dragStartEvent: function (e) {
        var data;
        if (e.originalEvent) e = e.originalEvent;
        e.dataTransfer.effectAllowed = "copy";
        // if ($.browser.opera) {                                                  // only for Opera browser
        //     e.dataTransfer.setData('Text', this.id);
        // }
        data = this.dragStart(e.dataTransfer, e);
        window._backboneDragDropObject = null;
        if (data !== undefined) {
            window._backboneDragDropObject = data;
        }
    },

    dragStart: function (dataTransfer, e) {
        return data = {
            name: this.model.get('name'),
            path: this.model.get('path'),
            duration: this.model.get('duration'),
            sampleRate: this.model.get('sampleRate'),
            transcript: this.model.get('transcript')
        };
    },

    /**
     * Dropping reactions
     */
    _dragOverEvent: function (e) {
        if (e.originalEvent) e = e.originalEvent;
        var data = this._getCurrentDragData(e);

        if (this.dragOver(data, e.dataTransfer, e) !== false) {
            if (e.preventDefault) e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    },

    _dragEnterEvent: function (e) {
        if (e.originalEvent) e = e.originalEvent;
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    },

    _dragLeaveEvent: function (e) {
        if (e.originalEvent) e = e.originalEvent
        var data = this._getCurrentDragData(e)
        this.dragLeave(data, e.dataTransfer, e)
    },

    _dragEndEvent: function (e) {
        if (e.originalEvent) e = e.originalEvent;
        if (e.preventDefault) e.preventDefault();

        /*if (e.dataTransfer.dropEffect == "copy") {
            if (this.model.get('transcript') == "@yes") {
                this.remove();
            }
        }*/
    },

    _dropEvent: function (e) {
        if (e.originalEvent) e = e.originalEvent;
        var data = this._getCurrentDragData(e);

        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();

        if (this._draghoverClassAdded) $(this.el).removeClass("draghover")

        this.drop(data, e.dataTransfer, e);
    },

    _getCurrentDragData: function (e) {
        var data = null
        if (window._backboneDragDropObject) data = window._backboneDragDropObject
        return data;
    },

    dragOver: function (data, dataTransfer, e) {
        $(this.el).addClass('draghover');
        this._draghoverClassAdded = true;
    },

    dragLeave: function (data, dataTransfer, e) {
        if (this._draghoverClassAdded)
            $(this.el).removeClass("draghover");
    },

    drop: function (data, dataTransfer, e) {
        if ((data.transcript == "@yes") && (this.model.get('transcript') != "@yes")) {
            this.model.set({ transcript: data.path + data.name });
        }
        $(this.el).trigger("dropped", this);
    }
});

return ImportFileView;
});