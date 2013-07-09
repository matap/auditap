define([
  "jquery",
  "jqueryUI",
  "jqueryWheel",
  "jqueryCSV",
  "underscore",
  "backbone",
  "views/clip-view",
  "models/clip-model"

]
, function ($, JqueryUI, JqueryWheel, JqueryCSV, _, Backbone, ClipView, Clip) {
    var ClipListView = Backbone.View.extend({
        events: {
            'dragover': '_dragOverEvent',
            'dragenter': '_dragEnterEvent',
            'dragleave': '_dragLeaveEvent',
            'drop': '_dropEvent'
        },

        initialize: function (options) {
            _.bindAll(this, 'showExistingClips', 'render', 'addClip', 'appendClip', 'setCurrentTime', 'play', 'pause', 'zoomIn', 'zoomOut', 'scroll', 'resize', 'setTimeForPixel',
               'changeVolume', 'setMute', 'setSocket', 'mouseMove', 'mouseUp',
               '_dragOverEvent', '_dragEnterEvent', '_dragLeaveEvent', '_dropEvent', 'deleteMe');   
            this._draghoverClassAdded = false;
            this.socket = this.options.socket;
            
            this.timeForPixel = this.options.timeForPixel;
            this.mute = false;
            this.volume = 100;
            this.mousePosition = 0;
            this.counter = 0;
            this.clipView = new Array();
            this.render();


            this.collection = this.model.get('clips');
            this.collection.bind('add', this.appendClip);                                       // collection add event binder
            
            this.showExistingClips();
        },

        /**
         * It calls function, that creates view for existing models
         */
        showExistingClips: function () {
            var self = this;
            this.collection.each(
                function (clip) {
                    self.appendClip(clip);
                }
            );
        },

        render: function () {
            var self = this;
            $(this.el).append("");
            /*_(this.collection.models).each(function (clip) {
                self.appendClip(clip);
            }, this);*/
        },

        addClip: function (_audioName, _audioPath, _duration, _realDuration, _start, _seekStart, _transcript, _sampleRate) {
            for (x in this.clipView) {
                var tmpClip = this.clipView[x];
                if ((tmpClip.model.get('start') < _start) && (tmpClip.model.get('start') + tmpClip.model.get('duration') > _start)) {
                    tmpClip.model.set({ duration: _start - tmpClip.model.get('start') });
                    tmpClip.changeModel();
                }
                if ((tmpClip.model.get('start') < _start) && (tmpClip.model.get('start') + tmpClip.model.get('duration') > _start)) {
                    tmpClip.model.set({ duration: _start - tmpClip.model.get('start') });
                    tmpClip.changeModel();
                } if (_start < tmpClip.model.get('start') && (_start + _duration > tmpClip.model.get('start'))) {
                    var diff = _start + _duration - tmpClip.model.get('start');
                    tmpClip.model.set({
                        start: tmpClip.model.get('start') + diff,
                        seekStart: tmpClip.model.get('seekStart') + diff,
                        duration: tmpClip.model.get('duration') - diff
                    });
                    tmpClip.changeModel();
                }
            }
            var clip = new Clip();
            clip.set({
                id: this.model.get('name') + "-" + (this.collection.length + 1) + "-" + Math.floor((Math.random() * 10000) + 1),                // bracket because of left priority of operator (it adds it like numbers - not string)
                audioPath: _audioPath,
                audioName: _audioName,
                duration: _duration,
                realDuration: _realDuration,
                start: _start,
                seekStart: _seekStart,
                transcript: _transcript,
                sampleRate: _sampleRate
            });
            this.collection.add(clip);
            //alert("hojaja" + JSON.stringify(this.model.get('clips')));
        },

        /** 
         * Creates view of model @clip and appends it to list of clips
         */
        appendClip: function (clip) {
            this.clipView[this.counter] = new ClipView({
                model: clip,
                socket: this.socket,
                timeForPixel: this.timeForPixel,
                parent: this
            });
            $(this.el).append(this.clipView[this.counter].render().el);
            this.clipView[this.counter].setSocket(this.socket);
            this.clipView[this.counter].changeVolume(this.volume);
            this.clipView[this.counter].setMute(this.mute);
            this.clipView[this.counter].changeModel();
            this.clipView[this.counter].initTranscript();
            this.counter++;
        },

        setCurrentTime: function (time) {
            for (x in this.clipView) {
                this.clipView[x].setCurrentTime(time);
            }
        },

        play: function (time) {
            var sign = "";
            for (x in this.clipView) {
                if (this.clipView[x].play(time) == "over") sign = "over";
            }
            return sign;
        },

        pause: function (time) {
            for (x in this.clipView) {
                this.clipView[x].pause(time);
            }
        },

        zoomIn: function () {
            for (x in this.clipView) {
                this.clipView[x].zoomIn();
            }
        },

        zoomOut: function () {
            for (x in this.clipView) {
                this.clipView[x].zoomOut();
            }
        },

        scroll: function () {
            for (x in this.clipView) {
                this.clipView[x].scroll();
            }
        },

        resize: function () {
            for (x in this.clipView) {
                this.clipView[x].resize();
            }
        },

        setTimeForPixel: function (timeForPixel) {
            this.timeForPixel = timeForPixel;
            for (x in this.clipView) {
                this.clipView[x].setTimeForPixel(timeForPixel);
            }
        },

        changeVolume: function (vol) {
            this.volume = vol;
            for (x in this.clipView) {
                this.clipView[x].changeVolume(vol);
            }
        },

        setMute: function (m) {
            this.mute = m;
            for (x in this.clipView) {
                this.clipView[x].setMute(m);
            }
        },

        setSocket: function (socket) {
            this.socket = socket;
            for (x in this.clipView) {
                this.clipView[x].setSocket(socket);
            }
        },

        mouseMove: function (pos) {
            this.mousePosition = pos;
            for (x in this.clipView) {
                this.clipView[x].mouseMove(pos);
            }
        },

        mouseUp: function (pos) {
            var c = -1;
            for (x in this.clipView) {
                this.clipView[x].mouseUp(pos);
            }
        },

        deleteMe: function () {
            var i = 0;
            var self = this;
            for (x in this.clipView) {
                if (this.clipView[x].delMe == true) {
                    this.clipView[x].model.destroy({
                        success: function (model, response) {
                            self.clipView[x].remove();
                            self.clipView.splice(x, 1);
                        },
                        error: function (model, response) {
                        }
                    });
                }
                i++;
            }
        },

        _dragOverEvent: function (e) {
            if (e.originalEvent) e = e.originalEvent
            var data = this._getCurrentDragData(e)

            if (this.dragOver(data, e.dataTransfer, e) !== false) {
                if (e.preventDefault) e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
            }
        },

        _dragEnterEvent: function (e) {
            if (e.originalEvent) e = e.originalEvent
            if (e.preventDefault) e.preventDefault()
        },

        _dragLeaveEvent: function (e) {
            if (e.originalEvent) e = e.originalEvent
            var data = this._getCurrentDragData(e)
            this.dragLeave(data, e.dataTransfer, e)
        },

        _dropEvent: function (e) {
            if (e.originalEvent) e = e.originalEvent
            var data = this._getCurrentDragData(e)

            if (e.preventDefault) e.preventDefault()
            if (e.stopPropagation) e.stopPropagation()

            if (this._draghoverClassAdded) $(this.el).removeClass("draghover")

            this.drop(data, e.dataTransfer, e)
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
            var realPos = e.pageX - $('#timeline').offset().left + $('#timeline').scrollLeft() - $('.trackHandler').width();
            if (data.transcript != "@yes") this.addClip(data.name, data.path + data.name, data.duration, data.duration, realPos * this.timeForPixel, 0, data.transcript, data.sampleRate);
            $(this.el).trigger("dropped", this);
        }

    });

    return ClipListView;
});