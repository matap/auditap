define([
  "jquery",
  "jqueryUI",
  "jqueryWheel",
  "jqueryCSV",
  "underscore",
  "backbone",
  "views/clip-list-view"
]
, function ($, JqueryUI, JqueryWheel, JqueryCSV, _, Backbone, ClipListView) {

var TrackView = Backbone.View.extend({
    tagName: "div",

    className: "track",

    events: {
        'mousedown div.trackHandler': 'handlerMouseDown',
        'mousedown .trackMute': 'trackMuteMouseDown'
    },

    initialize: function (options) {
        _.bindAll(this, 'render', 'unrender', 'modelChanged', 'volumeChanged', 'remove', 'zoomIn', 'zoomOut', 'scroll',
            'setWidth', 'start', 'setCurrentTime', 'play', 'pause', 'zoomIn', 'zoomOut', 'resize', 'setTimeForPixel', 'setSocket',
            'mouseMove', 'mouseUp', 'handlerMouseDown', 'setMute', 'trackMuteMouseDown', 'unselect');

        this.socket = this.options.socket;
        this.timeForPixel = this.options.timeForPixel;
        this.parent = this.options.parent;

        this.model.bind('change', this.modelChanged);
        this.model.bind('remove', this.unrender);
        this.setWidth();
    },

    render: function () {
        var showTimeWidth = $('#showTime').width();
        this.sliderID = "slider-" + this.model.get('name');

        var handlerClasses = "trackHandler"
        if (this.model.get('selected')) handlerClasses += " trackHandlerSelected";

        var muteClasses = "trackMute"
        if (this.model.get('mute')) handlerClasses += " trackMuteSelected";

        $(this.el).html('<div id="handler-' + this.sliderID + '" class="' + handlerClasses + '">' +
                            '<div class="trackName">' +
                                this.model.get('name') +
                            '</div>' +

                            '<div class="volumeHandler">' +
                                '<div id="' + this.sliderID + '" class="volumeSlider"></div>' +
                                '<div id="show-' + this.sliderID + '" class="showVolume">' + this.model.get('volume') + '</div>' +
                            '</div>' +
                            '<div id="track-mute-' + this.sliderID + '" class="' + muteClasses + '" title="mute">' +
                            '</div>' +
                        '</div>' +
                        '<div id=' + this.model.get('name') + ' class="trackContent" style="width: ' + showTimeWidth + 'px"></div>');
        this.setWidth();
        return this;
    },

    /**
     * Setting of mute
     * @m   mute boolean setting 
     */
    setMute: function (m) {
        var mute = m;
        var oldM = this.model.get('mute');
        if (m = typeof m !== 'undefined') this.model.setMute(mute);
        else this.model.setMute(!this.model.get('mute'));

        if (this.model.get('mute')) {
            $("#track-mute-" + this.sliderID).addClass('trackMuteSelected');
        } else {
            $("#track-mute-" + this.sliderID).removeClass('trackMuteSelected');
        }

        var newM = this.model.get('mute');
        if (oldM !== newM) {                                        // propagate it to clipListView only on change
            this.clipListView.setMute(this.model.get('mute'));
        }
        if (newM) {
            $('#' + this.sliderID).slider('value', 0);
            $('#show-' + this.sliderID).html('0');
        } else {
            $('#' + this.sliderID).slider('value', this.model.get('volume'));
            $('#show-' + this.sliderID).html(this.model.get('volume'));
        }
    },

    /**
     * This method is triggered when clicking on mute button
     */
    trackMuteMouseDown: function () {
        this.setMute();
    },

    /**
     * Mouse down on track handler (isn't executed when clicking on child of track handler)
     */
    handlerMouseDown: function (e) {
        if ($(e.target).attr('id') == 'handler-' + this.sliderID) {                          // if I didn't click on child
            this.model.setSelected(!this.model.get('selected'));                             // toggle model (selected)
            if (this.model.get('selected')) {
                $('#handler-' + this.sliderID).addClass('trackHandlerSelected');
                this.parent.unselectTracks(this.model.get('name'));
            }
            else {
                $('#handler-' + this.sliderID).removeClass('trackHandlerSelected');
            }
        }
    },

    modelChanged: function () {
        this.volumeHandle();
        this.setMute(this.model.get('mute'));
    },

    volumeChanged: function (volume) {
        if (volume > 0) this.setMute(false);
        this.model.setVolume(volume);
        $('#show-' + this.sliderID).html(volume);
        this.clipListView.changeVolume(volume);

    },

    volumeHandle: function () {
        var self = this;
        $('#' + this.sliderID).slider({
            orientation: "vertical",
            range: "min",
            min: 0,
            max: 100,
            value: this.model.get('volume'),
            slide: function (event, ui) {
                self.volumeChanged(ui.value);
            }
        });
    },

    /**
     * Inicialization after rendering
     */
    start: function () {
        this.clipListView = new ClipListView({
            model: this.model,
            el: '#' + this.model.get('name'),
            socket: this.socket,
            timeForPixel: this.timeForPixel
        });
        $('.trackHandler').offset({ left: 0 });
        this.volumeHandle();
        this.setMute(this.model.get('mute'));
    },

    unrender: function () {
        $(this.el).remove();
    },

    remove: function () {
        this.model.destroy();
    },

    zoomIn: function () {
        this.clipListView.zoomIn();
    },

    zoomOut: function () {
        this.clipListView.zoomOut();
    },

    scroll: function () {
        this.clipListView.scroll();
    },

    /* dropped: function () {
         this.trigger("droppedTrack", this);
         alert("emituju droppedTrack");
     },*/

    setWidth: function () {
        $(this.el).width($('#showTime').width() + $('#addTrack').width());
        $('.trackContent').width($('#showTime').width());
        $('.trackHandler').offset({ left: 0 });
    },

    setCurrentTime: function (time) {
        this.clipListView.setCurrentTime(time);
    },

    play: function (time) {
        if (this.clipListView.play(time) == "over") return "over";
    },

    pause: function (time) {
        this.clipListView.pause(time);

    },

    resize: function () {
        //  $('.trackContent').width($('#showTime').width());
        this.clipListView.resize();
    },

    setTimeForPixel: function (timeForPixel) {
        this.timeForPixel = timeForPixel;
        this.clipListView.setTimeForPixel(timeForPixel);

    },

    setSocket: function (socket) {
        this.socket = socket;
        this.clipListView.setSocket(socket);
    },


    mouseMove: function (pos) {
        if (this.clipListView != null)
            this.clipListView.mouseMove(pos);
    },

    mouseUp: function (pos) {
        this.clipListView.mouseUp(pos);
    },

    unselect: function () {
        this.model.set({ selected: false });
        $('#handler-' + this.sliderID).removeClass('trackHandlerSelected');
    }
});

return TrackView;
});