define([
  "jquery",
  "jqueryUI",
  "jqueryWheel",
  "jqueryCSV",
  "underscore",
  "backbone",
  "views/transcript-view"

]
, function ($, JqueryUI, JqueryWheel, JqueryCSV, _, Backbone, TranscriptView) {

    /**
      * View of clip model
      */
    var ClipView = Backbone.View.extend({
        tagName: "div",
        className: "clip",

        events: {
            'mousedown div.clipRightShifter': 'rightShift',
            'mousedown div.clipLeftShifter': 'leftShift',
            'mousedown': 'mouseDown',
            'click': 'clicked'
        },

        initialize: function (options) {
            _.bindAll(this, 'changeModel', 'modelWasChanged', 'render', 'drawCanvas', 'clearCanvas', 'renderWaveform', 'setData', 'myremove', 'setCurrentTime', 'play', 'pause', 'zoomIn', 'zoomOut',
                'renderTranscription', 'scroll', 'setTimeForPixel', 'resize',
                'changeVolume', 'setMute', 'setSocket', 'mouseDown', 'mouseMove', 'mouseUp', 'selectionClassHandler', 'unselect', 'clicked', 'keyDown', 'keyUp',
                'rightShift', 'leftShift', 'leftShiftEffect', 'rightShiftEffect',
                'initTranscript');

            $(document).bind('keydown', this.keyDown);
            $(document).bind('keyup', this.keyUp);

            this.model.bind('change', this.modelWasChanged);
            this.model.bind('remove', this.myremove);
            this.socket = this.options.socket;
            this.timeForPixel = this.options.timeForPixel;
            this.parent = this.options.parent;

            this.ctrlKey = false;
            this.dragging = false;
            this.mousePos = 0;
            this.moved = false;
            this.selected = false;
            this.rightShifted = false;
            this.leftShifted = false;
            this.oldVolume = 1.0;
            this.playing = false;
            this.pcm = new Array();
            this.toRender = new Array();
            //this.audio = new Audio(this.model.get('audioPath'));
            //alert(this.model.get('audioPath'));

            function getFileExtension(fileName) {
                return fileName.substr((Math.max(0, fileName.lastIndexOf(".")) || Infinity) + 1);
            }

            function nameWithoutExt(fileName) {
                return fileName.substr(0, fileName.lastIndexOf('.'));
            }
            
            var audioPathNoExtension = nameWithoutExt(this.model.get('audioPath'));
            if (navigator.userAgent.search("MSIE") >= 0) {
                audioPathNoExtension += ".mp3";
            }
            else if (navigator.userAgent.search("Chrome") >= 0) {
                audioPathNoExtension += ".mp3";
            }
            else if (navigator.userAgent.search("Firefox") >= 0) {
                audioPathNoExtension += ".ogg";
            }
            else if (navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0) {//<< Here
                audioPathNoExtension += ".mp3";
            }
            else if (navigator.userAgent.search("Opera") >= 0) {
                audioPathNoExtension += ".ogg";
            }
            else {
                audioPathNoExtension += ".mp3";
            }

            
            //this.audio = document.createElement('audio');
            this.audio = new Audio();
            this.audio.src = audioPathNoExtension;
            this.audio.preload = "auto";
            this.audio.load();

            this.lastScroll = 0;
            this.lastWaveformRender = 0;

            this.canvasLength = 1200;
            this.initTranscript();
        },

        changeModel: function () {
            this.render();
            this.renderWaveform();
            this.renderTranscription();
        },

        modelWasChanged: function () {
            //alert("modelWasChanged");
        },

        transcriptId: function (modelId) {
            return 'transcript-' + modelId;
        },

        initTranscript: function () {
            this.transcriptView = new TranscriptView({
                el: $('#' + this.transcriptId(this.model.get('id'))),
                timeForPixel: this.timeForPixel,
                path: this.model.get('transcript'),
                from: ($('#timeline').scrollLeft() - 1000) * this.timeForPixel,
                to: ($('#timeline').scrollLeft() + $('#timeline').width() + 1000) * this.timeForPixel,
                start: this.model.get('start'),
                seekStart: this.model.get('seekStart'),
                duration: this.model.get('duration')
            });

            this.transcriptView.showWords();
        },

        render: function () {
            $(this.el).html('');
            this.clipId = 'clip-' + this.model.get('id');
            $(this.el).attr('id', this.clipId);
            $(this.el).css('left', this.model.get('start') / this.timeForPixel + $('#addTrack').width());
            $(this.el).width(this.model.get('duration') / this.timeForPixel);

            if ($(this.el).width() > 20) {
                $(this.el).append('<div class="clipLeftShifter"></div>');
                $(this.el).append('<div class="clipRightShifter"></div>');
            }

            $(this.el).append('<div class="clipName"> <div style="padding-left: 6px; padding-right: 6px; padding-top: 1px">' + this.model.get('audioName') + '</div></div>');
            $(this.el).append('<div id="' + this.transcriptId(this.model.get('id')) + '" class="transcript"></div>');

            var tmpWidth = $(this.el).width();
            var canvasMaxWidth = this.canvasLength + 1;

            this.canvas = new Array();
            this.canvasID = new Array();

            for (var i = 0; tmpWidth != 0; i++) {
                var newWidth = canvasMaxWidth;
                if (tmpWidth > canvasMaxWidth) newWidth = canvasMaxWidth;
                else newWidth = tmpWidth;

                var tmpId = 'canvas-' + this.model.get('id') + '-' + $('canvas').length;
                var tmpElem = $('<canvas>').attr({
                    id: tmpId
                }).css({
                    width: newWidth + 'px',
                    height: 100 + '%',
                    marginLeft: -1 + 'px',
                    visibility: 'hidden'
                });

                this.canvas[i] = { id: tmpId, elem: tmpElem, rendered: false };
                $(this.el).append(this.canvas[i].elem);

                if (tmpWidth > canvasMaxWidth) tmpWidth -= canvasMaxWidth - 1;
                else tmpWidth = 0;
            }

            if (this.model.get('selected'))
                $(this.el).addClass('selected');
            else
                $(this.el).removeClass('selected');

            return this;
        },

        isScrolledIntoView: function (elem) {
            if (typeof elem != "undefined") {
                if (typeof $(elem) != "undefined") {
                    if (typeof $(elem).offset() != "undefined") {
                        var elemLeft = $(elem).offset().left;
                        var elemRight = elemLeft + $(elem).width();
                        return ((elemLeft > (this.canvasLength * (-2))) && (elemRight < $(window).width() + this.canvasLength * 3));
                    }
                }
            }
            return false;
        },

        /**
         * Draw selected canvas
         * @elem    DOM object of canvas
         * @actualCanvas    order of canvas in clip
         * @seekStartPosition   seek start of clip
         */
        drawCanvas: function (elem, actualCanvas, seekStartPosition) {
            $(elem).css({ "visibility": "visible" });
            var context = elem.getContext('2d');
            context.webkitImageSmoothingEnabled = false;
            context.mozImageSmoothingEnabled = false;
            context.canvas.width = this.canvas[actualCanvas].elem.width();
            context.canvas.height = this.canvas[actualCanvas].elem.height();
            context.lineWidth = 1;
            context.strokeStyle = '#39372a';
            context.beginPath();
            var endJ = this.canvasLength * 2;
            if (this.canvas.length - 1 > actualCanvas) endJ = this.canvasLength * 2 + 2;      // if it is not last canvas
            for (var j = 0; j < endJ; j++) {

                if (j == 0) context.moveTo(Math.round(j / 2) + 0.5, this.canvas[actualCanvas].elem.height() - this.pcm[Math.round(actualCanvas * (this.canvasLength * 2) + j + seekStartPosition * 2)] / 1000 * 50 - 75.5);
                else {
                    context.lineTo(Math.round(j / 2) + 0.5, this.canvas[actualCanvas].elem.height() - this.pcm[Math.round(actualCanvas * (this.canvasLength * 2) + j + seekStartPosition * 2)] / 1000 * 50 - 75.5);
                }
            }
            context.stroke();
            this.canvas[actualCanvas].rendered = true;

        },

        clearCanvas: function (elem, actualCanvas) {
            var context = elem.getContext('2d');
            context.clearRect(0, 0, elem.width, elem.height);
            this.canvas[actualCanvas].rendered = false;
        },

        /**
         * Render waveform of audio
         */
        renderWaveform: function () {
            actualCanvas = 0;
            actualPCM = 0;
            var seekStartPosition = this.model.get('seekStart') / this.timeForPixel;
            if (this.pcm.length > 0) {                          // buffered PCM
                for (var i = 0; i < this.canvas.length; i++) {
                    var elem = document.getElementById(this.canvas[i].id);
                    //var elem = $(this.canvas[i].id);
                    if (this.isScrolledIntoView(elem) && !this.canvas[i].rendered) {
                        this.drawCanvas(elem, i, seekStartPosition);
                    }
                    else if (!this.isScrolledIntoView(elem) && this.canvas[i].rendered) {
                        this.clearCanvas(elem, i);
                    }
                }
            } else {                                            // not buffered PCM - I must access to server
                this.socket.emit('getPCM', { id: this.model.get('id'), path: this.model.get('audioPath'), start: this.model.get('start'), duration: this.model.get('duration'), sapleRate: this.model.get('sampleRate'), resolution: $(this.el).width() / this.model.get('duration') * this.model.get('realDuration') * 2 });
            }
        },

        /**
         * When socket.io gets data, calls this method setData, which stores PCM into own variable and render it
         */
        setData: function (data) {
            var actualCanvas = data.index;
            var actualPCM = data.index * this.canvasLength * 2;

            if (data.value != "error") {
                for (var i = 0; i < data.value.length; i++) {
                    this.pcm[actualPCM] = data.value[i];
                    actualPCM++;
                }
                if (actualCanvas < this.canvas.length) {
                    var elem = document.getElementById(this.canvas[actualCanvas].id);
                    var seekStartPosition = this.model.get('seekStart') / this.timeForPixel;
                    if (this.isScrolledIntoView(elem)) {
                        if (typeof elem != "undefined") {
                            if (this.pcm[Math.round(actualCanvas * (this.canvasLength * 2) + this.canvas[actualCanvas].elem.width() * 2 - 2 + seekStartPosition * 2)] != null)
                                this.drawCanvas(elem, actualCanvas, seekStartPosition);
                            else {
                                this.toRender[this.toRender.length] = { rendered: false, element: elem, canvasIndex: actualCanvas, seekStartPos: seekStartPosition, width: elem.width };
                            }
                        }
                    }
                    actualCanvas++;
                }

                if (this.toRender.length > 0) {
                    for (var n = 0; n < this.toRender.length; n++) {
                        var actual = this.toRender[n];
                        if (actual.rendered == false) {
                            if (this.pcm[Math.round(actual.canvasIndex * (this.canvasLength * 2) + this.canvas[actual.canvasIndex].elem.width() * 2 - 2 + actual.seekStartPos * 2)] != null) {
                                this.drawCanvas(actual.element, actual.canvasIndex, actual.seekStartPos);
                                actual.rendered = true;
                            }
                        }
                    }
                }
            } else {
                //alert("error");
            }
        },

        myremove: function () {
            this.delMe = true;
            this.parent.deleteMe();
        },

        setCurrentTime: function (time) {
            if ((time > this.model.get('start')) && ((this.model.get('start') + this.model.get('duration')) > time)) {
                this.audio.currentTime = this.model.get('seekStart') + time - this.model.get('start');
            }
        },

        play: function (time) {
            if (this.playing == false) {
                if ((time > this.model.get('start')) && ((this.model.get('start') + this.model.get('duration')) > time)) {
                    if (this.audio.readyState > 2) {
                        this.audio.currentTime = this.model.get('seekStart') + time - this.model.get('start');
                        this.audio.play();
                        this.playing = true;
                        return "playing";
                    }
                    else {
                        return "notReady";
                    }
                }
            } else {    // playing == true 
                if ((this.model.get('start') + this.model.get('duration')) < time) {
                    this.pause();
                    return "over";
                }
            }
        },

        pause: function (time) {
            this.audio.pause();
            this.playing = false;
        },

        zoomIn: function () {
            this.pcm = [];
            this.toRender = [];
        },

        zoomOut: function () {
            this.pcm = [];
            this.toRender = [];
        },

        renderTranscription: function () {
            var from = ($('#timeline').scrollLeft() - 1000) * this.timeForPixel;
            var to = ($('#timeline').scrollLeft() + $('#timeline').width() + 1000) * this.timeForPixel;

            this.transcriptView.renderTranscription(from, to, this.model.get('start'), this.model.get('seekStart'), this.model.get('duration'), $('#' + this.transcriptId(this.model.get('id'))));
        },

        scroll: function () {
            if (Math.abs($('#timeline').scrollLeft() - this.lastScroll) > 1000) {            // if scroll is bigger than 1000 I will re-render waveform, because waveform exceeds only 500 px to both sides
                this.lastScroll = $('#timeline').scrollLeft();
                this.renderWaveform();
                this.renderTranscription();
            }
        },

        setTimeForPixel: function (timeForPixel) {
            this.timeForPixel = timeForPixel;
            this.changeModel();
            this.transcriptView.setTimeForPixel(timeForPixel);
            this.renderTranscription();
        },

        resize: function () {
            this.pcm = [];
            this.toRender = [];
            this.renderWaveform();
        },

        changeVolume: function (vol) {
            this.volume = vol;
            this.oldVolume = vol / 100.0;
            this.audio.volume = vol / 100.0;
        },

        setMute: function (m) {
            if (m) {
                this.oldVolume = this.audio.volume;
                this.audio.volume = 0;
            } else {
                this.audio.volume = this.oldVolume;
            }
        },

        setSocket: function (socket) {
            this.socket = socket;
        },

        /**
         * reaction on event "mousedown div.clipRightShifter"
         */
        rightShift: function (e) {
            this.rightShifted = true;
            this.lastDuration = this.model.get('duration');
            this.mousePos = e.pageX;
        },

        /**
         * reaction on event "mousedown div.clipLeftShifter"
         */
        leftShift: function (e) {

            this.leftShifted = true;
            this.lastStart = this.model.get('start');
            this.lastDuration = this.model.get('duration');
            this.lastSeekStart = this.model.get('seekStart');
            this.mousePos = e.pageX;
        },

        /**
         * Effect on mouse dragging the edge of clip. Clip can't be rendered every mouse move - so I only render the edge (clipLeftShifter)
         * @pos mouse position relative to screen
         */
        leftShiftEffect: function (pos) {

            var leftShift = pos - this.mousePos;
            if ((leftShift < 0) && (Math.abs(leftShift) > this.model.get('seekStart') / this.timeForPixel)) leftShift = -1 * this.model.get('seekStart') / this.timeForPixel;
            $(this.el).children('.clipLeftShifter').css({ backgroundColor: "red", left: leftShift + "px" });
        },

        /**
        * Effect on mouse dragging the edge of clip. Clip can't be rendered every mouse move - so I only render the edge (clipRightShifter)
        * @pos mouse position relative to screen
        */
        rightShiftEffect: function (pos) {
            var rightShift = pos - this.mousePos;
            if ((rightShift + (this.model.get('duration') - this.model.get('seekStart')) / this.timeForPixel) > (this.model.get('realDuration') / this.timeForPixel))
                rightShift = (this.model.get('realDuration') - this.model.get('duration') - this.model.get('seekStart')) / this.timeForPixel
            $(this.el).children('.clipRightShifter').css({ backgroundColor: "red", right: -rightShift + "px" });
        },

        /**
         * Reaction on mouse down event
         */
        mouseDown: function (e) {
            this.dragging = true;
            this.mousePos = e.pageX; // - $('#timeline').offset().left + $('#timeline').scrollLeft() - $('.trackHandler').width();
            this.lastStart = this.model.get('start');

            $(this.el).addClass('zIndex');
        },

        /**
         * NOT a reaction on clip mouse down, it is called from parent view
         * Only change mouse cursor
         * Another interaction is handled form trackListView
         */
        mouseMove: function (pos) {
            if (tool == 'cutTool' && !this.rightShifted && !this.leftShifted) {
                $(this.el).css('cursor', 'url(cursor-cut.cur), default');
            }
            else {
                $(this.el).css('cursor', 'default');
            }
        },

        /**
         * NOT a reaction on clip mouse down, it is called from parent view
         */
        mouseUp: function (pos) {
            if (this.dragging) {
                $(this.el).removeClass('zIndex');
                if (this.dragging && !this.moved && !this.rightShifted && !this.leftShifted && tool == 'mouseTool') {
                    if (!this.model.get('selected')) {
                        this.model.setSelected(true);
                    }
                    else {
                        this.model.setSelected(false);
                    }
                    //this.changeModel();
                    this.selectionClassHandler();
                }
                //this.dragging = false;
                //this.moved = false;
                this.rightShifted = false;
                this.leftShifted = false;

                if (tool == 'cutTool') {
                    this.model.cut((pos - $('#timeline').offset().left + $('#timeline').scrollLeft() - $('.trackHandler').width()) * this.timeForPixel - this.model.get('start'));
                    this.changeModel();
                }
                if (this.model.get('selected')) return 1; else return 0;
            }
            return -1;
        },

        selectionClassHandler: function () {
            if (this.model.get('selected') == true)
                $("#" + this.clipId).addClass('selected');
            else
                $("#" + this.clipId).removeClass('selected');
        },

        unselect: function () {
            var change = false;
            if (this.model.get('selected') == true) change = true;
            this.model.setSelected(false);
            this.selectionClassHandler();
        },

        clicked: function () {

        },

        keyDown: function (evt) {

        },

        keyUp: function (evt) {
            evt = evt || window.event;
            if (evt.keyCode == 46) {
                if (this.model.get('selected')) {
                    this.myremove();
                }
            }

        }
    });
    return ClipView;
});