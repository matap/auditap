define([
  "jquery",
  "jqueryUI",
  "jqueryWheel",
  "jqueryCSV",
  "underscore",
  "backbone",
  "views/track-view",
  "models/track-model",
  "models/clips-model"
]
, function ($, JqueryUI, JqueryWheel, JqueryCSV, _, Backbone, TrackView, Track, Clips) {

/**
 * Track list view
 * on initialization I get property collection, which is object in project "tracks"
 */
var TrackListView = Backbone.View.extend({
    el: $('.tracks'),
    events: {
        'click #addTrackImg': 'addTrack',
        'mousedown': 'mouseDown'
    },

    initialize: function (options) {
        //alert("inicializace");
        _.bindAll(this, 'render', 'addTrack', 'appendTrack', 'setCurrentTime', 'play', 'pause', 'zoomIn', 'zoomOut', 'scroll', 'resize', 'changeRange', 'setWidth', 'setTimeForPixel',
            'mouseDown', 'mouseMove', 'mouseUp', 'getMaxClipTime', 'copy', 'paste', 'copyAndDelete', 'isSelectedTrack', 'unselectTracks', 'reset'); // every function that uses 'this' as the current object should be in here
        this.timeForPixel = 0;
        this.copyObj = null;
        this.socket = this.options.socket;
        this.timeForPixel = this.options.timeForPixel;
        this.trackView = new Array();
        this.counter = 0;
        this.render();
        this.collection.bind('add', this.appendTrack);
        this.collection.bind('reset', this.reset);
    },

    reset: function () {
        alert("tady");
        $(this.el).empty();
        $(this.el).append("<div id='addTrack'><div id='addTrackImg' title='add track'><img src='img/add-track2.png' alt='add track' width=40 /></div></div>");
    },

    render: function () {
        var self = this;
        $(this.el).append("<div id='addTrack'><div id='addTrackImg' title='add track'><img src='img/add-track2.png' alt='add track' width=40 /></div></div>");

        _(this.collection.models).each(function (track) { // in case collection is not empty
            self.appendTrack(track);
        }, this);
    },

    addTrack: function () {
        var track = new Track();
        track.set(
            track.defaults()
        );

        track.set({
            name: track.get('name') + this.counter,
            volume: 100
        });

        this.collection.add(track);
    },

    appendTrack: function (track) {
        // this is very important part of code!!!
        // method "fetch" returns JSON, which is parsed. But only collection nested in first level. Collection clips isn't
        // parsed. So it is stored as array, but not as clips. This lines of code converts [object Array] to collection clips
        var clips = track.get('clips');
        if (Object.prototype.toString.call(clips) === '[object Array]')
            track.set('clips', new Clips(clips), { silent: true });

        this.trackView[this.counter] = new TrackView({
            model: track,
            socket: this.socket,
            timeForPixel: this.timeForPixel,
            parent: this
        });
        $(this.el).append(this.trackView[this.counter].render().el);
        
        this.trackView[this.counter].start();
        this.trackView[this.counter].setSocket(this.socket);
        this.counter++;
    },

    setCurrentTime: function (time) {
        this.currentTime = time;
        for (x in this.trackView) {
            this.trackView[x].setCurrentTime(time);
        }
    },

    play: function (time) {
        this.currentTime = time;
        var sign = "";
        for (x in this.trackView) {
            if (this.trackView[x].play(time) == "over") sign = "over";
        }
        return sign;
    },

    pause: function (time) {
        this.currentTime = time;
        for (x in this.trackView) {
            this.trackView[x].pause(time);
        }
    },

    setWidth: function () {
        $('.trackContent').width($('#showTime').width());
        $('.track').width($('#showTime').width() + $('#addTrack').width());
    },

    zoomIn: function () {
        this.setWidth();
        for (x in this.trackView) {
            this.trackView[x].zoomIn();
        }
    },

    zoomOut: function () {
        this.setWidth();
        for (x in this.trackView) {
            this.trackView[x].zoomOut();
        }
    },

    scroll: function () {
        for (x in this.trackView) {
            this.trackView[x].scroll();
        }
    },

    resize: function () {
        this.setWidth();

        for (x in this.trackView) {
            this.trackView[x].resize();
        }
    },

    changeRange: function () {
        this.setWidth();
    },

    setTimeForPixel: function (timeForPixel) {
        this.timeForPixel = timeForPixel;
        for (x in this.trackView) {
            this.trackView[x].setTimeForPixel(timeForPixel);
        }
    },

    setSocket: function (socket) {
        this.socket = socket;
        for (x in this.trackView) {
            this.trackView[x].setSocket(socket);
        }
    },

    someClipMoving: function () {
        for (x in this.trackView) {
            for (y in this.trackView[x].clipListView.clipView) {
                if (typeof this.trackView[x].clipListView.clipView[y] != "undefined") {
                    if (this.trackView[x].clipListView.clipView[y].moved && this.trackView[x].clipListView.clipView[y].model.get('selected')) return true;
                } else {
                    this.trackView[i].clipListView.clipView.splice(j, 1);
                }
            }
        }
        return false;
    },

    mouseDown: function (e) {
        var clip;
        for (var i = 0; i < this.trackView.length; i++) {
            for (var j = 0; j < this.trackView[i].clipListView.clipView.length; j++) {
                clip = this.trackView[i].clipListView.clipView[j];
                if (typeof clip != "undefined") {
                    clip.mousePos = e.pageX;
                    clip.lastStart = clip.model.get('start');
                    clip.lastWaveformRender = clip.model.get('start');

                } else {
                    this.trackView[i].clipListView.clipView.splice(j, 1);
                }
            }
        }
    },

    mouseMove: function (pos) {
        // resend mouseMove down
        for (x in this.trackView) {
            this.trackView[x].mouseMove();
        }

        // handle clips from tracklist view bacause of interaction between clips
        var clip;
        for (var i = 0; i < this.trackView.length; i++) {
            for (var j = 0; j < this.trackView[i].clipListView.clipView.length; j++) {
                clip = this.trackView[i].clipListView.clipView[j];
                if (typeof clip != "undefined") {
                    //console.log(this.trackView[i].clipListView.clipView.length);
                    if ((clip.dragging && !clip.rightShifted && !clip.leftShifted) || (clip.model.get('selected') && this.someClipMoving())) {
                        clip.moved = true;
                        var diff = clip.mousePos - pos;
                        if (clip.model.get('selected')) $('#alert').html(diff);
                        clip.model.setStart(clip.lastStart - diff * clip.timeForPixel);
                        $(clip.el).css('left', clip.model.get('start') / clip.timeForPixel + $('#addTrack').width());

                        // render waveform only when clip was moved over than 200 px
                        if (Math.abs(clip.model.get('start') / clip.timeForPixel - clip.lastWaveformRender / clip.timeForPixel) > 200) {
                            clip.renderWaveform();
                            clip.lastWaveformRender = clip.model.get('start');
                        }
                    }
                    if (clip.rightShifted && tool == 'mouseTool') {
                        clip.rightShiftEffect(pos);
                    }

                    if (clip.leftShifted && tool == 'mouseTool') {
                        clip.leftShiftEffect(pos);
                    }
                } else {
                    this.trackView[i].clipListView.clipView.splice(j, 1);
                }
            }
        }
    },

    /**
     * Returns false, if there is no intersect between models a and b; otherwise returns true
     */
    intersect: function (a, b) {
        if (a.get('start') + a.get('duration') <= b.get('start')) return false;
        if (b.get('start') + b.get('duration') <= a.get('start')) return false;
        return true;
    },

    /**
     * Intersects two clip models
     * @a   model, which is cutter
     * @b   model, which is cutting
     */
    intersectCut: function (a, b) {
        // model a is before model b
        if (a.get('start') < b.get('start')) {
            // check, if models intersection isn't zero
            if (a.get('start') + a.get('duration') > b.get('start')) {
                var diff = a.get('start') + a.get('duration') - b.get('start');                             // how much models intersect
                b.shiftStart(b.get('start') + diff, b.get('duration') - diff, b.get('seekStart') + diff);   // change model (start, duration, seekStart)

            }
        } else
            // model b is before model a
            if (b.get('start') < a.get('start')) {
                // check, if models intersection isn't zero
                if (b.get('start') + b.get('duration') > a.get('start')) {
                    var diff = b.get('start') + b.get('duration') - a.get('start');                         // how much models intersect
                    b.setDuration(b.get('duration') - diff);                                                // change model (only duration)
                }
            }
    },

    mouseUp: function (pos, e) {
        var selected = -1;
        var clip;

        // this iteration handles reaction on clip shifting and unselect every clip, which can't be selected
        for (x in this.trackView) {
            for (y in this.trackView[x].clipListView.clipView) {

                clip = this.trackView[x].clipListView.clipView[y];
                if (typeof clip != "undefined") {
                    if (clip.rightShifted && tool == 'mouseTool') {
                        var diff = clip.mousePos - pos;
                        clip.model.setDuration(clip.lastDuration - diff * clip.timeForPixel);
                        clip.changeModel();
                    }
                    if (clip.leftShifted && tool == 'mouseTool') {
                        var diff = clip.mousePos - pos;
                        clip.model.shiftStart(clip.lastStart - diff * clip.timeForPixel, clip.lastDuration + diff * clip.timeForPixel, clip.lastSeekStart - diff * clip.timeForPixel);
                        clip.changeModel();
                    }

                    selected = clip.mouseUp(pos);
                    if ((selected != 1) && (!e.ctrlKey) && (!this.trackView[x].clipListView.clipView[y].moved)) {
                        clip.unselect();
                    }
                }
            }
        }

        for (x in this.trackView) {
            for (y in this.trackView[x].clipListView.clipView) {
                if (this.trackView[x].clipListView.clipView[y].dragging) {
                    for (z in this.trackView[x].clipListView.clipView) {
                        if (y != z) {
                            var a = this.trackView[x].clipListView.clipView[y].model;
                            var b = this.trackView[x].clipListView.clipView[z].model;
                            if (this.intersect(a, b)) {
                                this.intersectCut(a, b);
                                this.trackView[x].clipListView.clipView[z].changeModel();
                            }
                        }
                    }
                }

                this.trackView[x].clipListView.clipView[y].dragging = false;
                this.trackView[x].clipListView.clipView[y].moved = false;
            }
        }
    },

    /**
     * Get time of clip, which ends at the latest
     */ 
    getMaxClipTime: function () {
        var maxWidth = new Array();
        var i = 0;
        this.collection.each(function (x) {
            var clips = x.get('clips');
            if (Object.prototype.toString.call(clips) === '[object Array]') {
                x.set('clips', new Clips(clips), { silent: true });
            }
            
            x.get('clips').each(function (a) {
                maxWidth[i] = a.get('start') + a.get('duration');
                i++;
            });
        });

        if (maxWidth.length > 0) {
            var max = maxWidth[0];

            for (var item = 0; item < maxWidth.length; item++) {
                if (maxWidth[item] > max) max = maxWidth[item];
            }
            return max;
        }
        return 0;
    },

    /**
     * Copies selected object.
     * @deleteObj - if this param is true, object is copied to memory and destroyed
     */
    copy: function (deleteObj) {
        var self = this;
        this.collection.each(function (x) {
            var clips = x.get('clips');
            if (Object.prototype.toString.call(clips) === '[object Array]') {
                x.set('clips', new Clips(clips), { silent: true });
            }
            x.get('clips').each(function (a) {
                if (a.get('selected')) {
                    self.copyObject = {
                        audioPath: a.get('audioPath'),
                        audioName: a.get('audioName'),
                        volume: a.get('volume'),
                        start: a.get('start'),
                        duration: a.get('duration'),
                        realDuration: a.get('realDuration'),
                        seekStart: a.get('seekStart'),
                        selected: a.get('selected'),
                        sampleRate: a.get('sampleRate'),
                        transcript: a.get('transcript')
                    };
                    if (deleteObj) {
                        a.destroy();
                    }
                } 
            });
        });
    },

    isSelectedTrack: function () {
        for (x in this.trackView) {
            if (this.trackView[x].model.get('selected')) {
                return true;
            }
        }
        return false;
    },

    paste: function () {
        if (this.copyObject != null) {
            var i = 0;
            tmpSel = this.isSelectedTrack();
            for (x in this.trackView) {
                if ((this.trackView[x].model.get('selected')) || ((tmpSel == false) && (i == 0))) {        // take selected track or first one in case if no track is selected
                    this.trackView[x].clipListView.addClip(
                        this.copyObject.audioName,
                        this.copyObject.audioPath,
                        this.copyObject.duration,
                        this.copyObject.realDuration,
                        this.currentTime,
                        this.copyObject.seekStart,
                        this.copyObject.transcript,
                        this.copyObject.sampleRate
                        );
                    return;
                }
                i++;
            }
        }
    },

    copyAndDelete: function () {
        this.copy(1);
    },

    /**
     * unselect tracks except track with name @name
     */
    unselectTracks: function (name) {
        for (x in this.trackView) {
            if (this.trackView[x].model.get('selected')) {
                if (this.trackView[x].model.get('name') == name) continue;
                this.trackView[x].unselect();
            }
        }
    }
});

return TrackListView;
});