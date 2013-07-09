/**
 * Created by Stanislav Kadlcik
 * xkadlc03@fit.vutbr.cz
 * 2013
 */


define([
  "jquery",
  "jqueryUI",
  "jqueryWheel",
  "jqueryCSV",
  "underscore",
  "backbone",
  "views/time-markers-view",
  "views/tracker-view",
  "views/track-list-view"
]
, function ($, JqueryUI, JqueryWheel, JqueryCSV, _, Backbone, timeMarkersView, trackerView, TrackListView) {

    var timelineView = Backbone.View.extend({

        el: $('#timeline'),

        events: {
            'mousemove': 'mousemove',
            'mousedown div#showTime': 'mousedownshowtime',
            'mouseup': 'mouseup',
            'scroll': 'scroll',
            'dropped': 'dropped'
        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'resize', 'zoomIn', 'zoomOut', 'mousemove', 'mouseup', 'mousedownshowtime',
                'centerToTracker', 'scroll', 'play', 'pause', 'changeRange', 'setSocket', 'getTimeForPixel',
                'copy', 'paste', 'copyAndDelete'); // every function that uses 'this' as the current object should be in here
            $(window).bind("resize.app", _.bind(this.resize, this));

            this.range = 60;
            this.minRange = 60;
            this.timeMarkersView = new timeMarkersView({ range: this.range });

            this.socket = this.options.socket;
            
            this.timeForPixel = this.timeMarkersView.getTimeForPixel();
            this.playing = false;

            this.trackerView = new trackerView({ timeForPixel: this.timeForPixel });

            this.counter = 0;
            this.render();

            this.trackListView = new TrackListView({
                collection: this.model,
                socket: this.socket,
                timeForPixel: this.timeForPixel
            });
            //this.trackListView.setTimeForPixel(this.timeForPixel);
            this.period = 10;

            this.mouseDownShowTimeHandler = false;

            var self = this;
            $(this.el).mousewheel(function (event, delta) {
                if (event.altKey) {
                    self.mouseIn();
                } else {
                    this.scrollLeft -= (delta * 30);
                    event.preventDefault();
                }
            });
        },

        render: function () {
        },

        play: function () {
            if (this.trackListView.getMaxClipTime() < this.trackerView.getTime()) return;

            var self = this;
            var now = new Date().getTime();
            var trackerTime = self.trackerView.getTime();
            this.interval = setInterval(function () {
                self.trackerView.setTime((trackerTime * 1000 + (new Date().getTime() - now)) / 1000);
                if ((self.trackerView.getPosition() - $(self.el).scrollLeft()) < 30) {
                    self.centerToTracker();
                }
                if ($(self.el).width() - (self.trackerView.getPosition() + $(self.el).offset().left - $(self.el).scrollLeft()) < 30) {
                    self.centerToTracker(10);
                }
                if (self.trackListView.play(self.trackerView.getTime()) == "over") {
                    if (self.trackListView.getMaxClipTime() < self.trackerView.getTime()) {
                        self.pause();
                    }
                }
            }, this.period);

            this.playing = true;
            $('#play').css("background-image", "url(img/stop.png)");
        },

        pause: function () {
            clearInterval(this.interval);
            this.trackListView.pause(this.trackerView.getTime());

            this.playing = false;
            $('#play').css("background-image", "url(img/play3.png)");

        },

        resize: function () {
            return;
            /*
            this.timeMarkersView.resize();
            this.timeForPixel = this.timeMarkersView.getTimeForPixel();
            this.trackerView.setTimeForPixel(this.timeForPixel);
            this.trackerView.setTime(this.trackerView.getTime());
            
            // this cause delay on propagate of resize - is not propagate on every event, but only on event, which is 100 ms without change
            var self = this;
            clearTimeout(this.doResize);
            this.doResize = setTimeout(function () {
                self.trackListView.setTimeForPixel(self.timeForPixel);
                self.trackListView.resize();
            }, 100);
            */
        },

        centerToTracker: function (a) {
            a = typeof a !== 'undefined' ? a : 2;
            $(this.el).scrollLeft(this.trackerView.getPosition() - $(this.el).width() / a);
        },

        moveView: function () {
            //  $(this.el).animate({ scrollLeft: this.trackerView.getPosition() - $(this.el).width() / 2 }, 300);
        },

        zoomIn: function () {
            this.timeMarkersView.zoomIn();
            this.timeForPixel = this.timeMarkersView.getTimeForPixel();

            this.trackerView.setTimeForPixel(this.timeForPixel);
            this.trackerView.zoom();

            this.trackListView.zoomIn();
            this.trackListView.setTimeForPixel(this.timeForPixel);
        },

        zoomOut: function () {
            this.timeMarkersView.zoomOut();
            this.timeForPixel = this.timeMarkersView.getTimeForPixel();

            this.trackerView.setTimeForPixel(this.timeForPixel);
            this.trackerView.zoom();
            this.trackListView.zoomOut();
            this.trackListView.setTimeForPixel(this.timeForPixel);
        },

        mousedownshowtime: function (e) {
            this.mouseDownShowTimeHandler = true;
            this.pause();
            var relativeXPosition = e.pageX - $(this.el).offset().left + $(this.el).scrollLeft() - $('.trackHandler').width(); // - $(this.trackerView.el).width() / 2;
            if (relativeXPosition < 0) relativeXPosition = 0;
            if (relativeXPosition > this.range / this.timeForPixel) relativeXPosition = this.range / this.timeForPixel;

            this.trackerView.setPosition(relativeXPosition);
            this.trackListView.setCurrentTime(this.trackerView.getTime());
        },

        mousemove: function (e) {
            if (this.trackerView.dragging) {
                var relativeXPosition = e.pageX - $(this.el).offset().left + $(this.el).scrollLeft() - $('.trackHandler').width(); // - $(this.trackerView.el).width() / 2;
                if (relativeXPosition < 0) relativeXPosition = 0;
                if (relativeXPosition > this.range / this.timeForPixel) relativeXPosition = this.range / this.timeForPixel;
                this.trackerView.setPosition(relativeXPosition);
            }

            if (this.mouseDownShowTimeHandler == false) {
                this.trackListView.mouseMove(e.pageX);
            }
        },

        mouseup: function (e) {
            if (this.mouseDownShowTimeHandler == false && this.trackerView.dragging == false) {
                this.trackListView.mouseUp(e.pageX, e);
            }

            this.trackerView.dragging = false;
            this.mouseDownShowTimeHandler = false;
            this.changeRange();
        },

        scroll: function () {
            $('.trackHandler').offset({ left: $(this.el).offset().left });
            $('#showTime').offset({ top: $(this.el).offset().top });    // always positioned to the top of timeline
            $('#addTrack').offset({ left: $(this.el).offset().left, top: $(this.el).offset().top });
            this.trackListView.scroll();                                // on scroll I must change offset of always visible divs
        },

        /**
         * Dropped is emited, when clip is dropped to trackListView
         */
        dropped: function () {
            this.changeRange();
        },

        /**
         * Changes range of timeline
         */
        changeRange: function () {
            var oldRange = this.range;
            this.range = this.trackListView.getMaxClipTime() + 50;
            if (Math.abs(this.range - oldRange) > 25) {                                        // if range has been changed over than 25 s
                if (this.range < this.minRange) this.range = this.minRange;
                this.timeMarkersView.changeRange(this.range);
                this.trackListView.changeRange();
            }
        },

        setSocket: function (socket) {
            this.socket = socket;
            this.trackListView.setSocket(socket);
        },

        getTimeForPixel: function () {
            return this.timeForPixel;
        },

        copy: function () {
            this.trackListView.copy();
        },

        paste: function () {
            this.trackListView.paste();
        },

        copyAndDelete: function () {
            this.trackListView.copyAndDelete();
        }
    });

    return timelineView;
});