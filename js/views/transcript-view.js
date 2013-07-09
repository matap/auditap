define([
  "jquery",
  "jqueryUI",
  "jqueryCSV",
  "underscore",
  "backbone"
]
, function ($, JqueryUI, JqueryCSV, _, Backbone) {

    /**
      * Transcript view
      */
    var TranscriptView = Backbone.View.extend({

        events: {

        },

        initialize: function (options) {
            _.bindAll(this, 'render', 'setTimeForPixel', 'setPath', 'renderTranscription', 'getCSV', 'processData', 'showWords');
            //$(this.el).empty();
            this.timeForPixel = this.options.timeForPixel;
            this.path = this.options.path;
            this.from = this.options.from;
            this.to = this.options.to;
            this.start = this.options.start;
            this.seekStart = this.options.seekStart;
            this.duration = this.options.duration;
            this.render();
        },

        render: function () {

            return this;
        },

        setTimeForPixel: function (timeForPixel) {
            this.timeForPixel = timeForPixel;
        },

        setPath: function (path) {
            this.path = path;
        },

        setFromTo: function (from, to) {
            this.from = from;
            this.to = to;
        },

        setStart: function (start, seekStart) {
            this.start = start;
            this.seekStart = seekStart;
        },

        /**
         * @from    from what time I have to render
         * @to    to what time I have to render
         * @start    start of clip
         * @seekStart    seek start of clip
         * @el    when clip model is changed, transcript element is re-render. So I have the same element but the old one has no connestions in DOM, so I set new el
         */
        renderTranscription: function (from, to, start, seekStart, duration, el) {
            if (this.data == null) return;
            if (typeof this.data == "undefined") return;

            from = typeof from !== 'undefined' ? from : this.from;
            to = typeof to !== 'undefined' ? to : this.to;
            start = typeof start !== 'undefined' ? start : this.start;
            seekStart = typeof seekStart !== 'undefined' ? seekStart : this.seekStart;
            duration = typeof duration !== 'undefined' ? duration : this.duration;
            if (typeof el !== 'undefined') this.setElement(el);

            $(this.el).empty();

            var self = this;
            for (var i = 0; i < this.data.length; i++) {
                var word = { start: parseInt(this.data[i][0]) / 10000000, end: parseInt(this.data[i][1]) / 10000000, word: this.data[i][2] }

                if ((word.word == "_SILENCE_") || (word.word == "<s>") || (word.word == "</s>")) continue;

                if ((word.start + start - seekStart > from) && (word.end + start - seekStart < to)) {       // if I am in rendered area of timeline
                    if ((word.start > seekStart) && (word.start < duration + seekStart)) {         // If word is in rendered part of clip
                        var wordWidth = (word.end - word.start) / self.timeForPixel + 'px';
                        var tmpElem = $('<div>').attr({
                            id: "word-" + i,
                            "class": 'transcriptWord',
                            title: word.word,
                            wordWidth: wordWidth
                        }).css({
                            left: (word.start - seekStart) / self.timeForPixel + 'px',
                            width: wordWidth,
                            "min-width": wordWidth
                        }).hover(
                            function () {
                                /*
                                     $(this).css({
                                         width: "auto",
                                         "min-width": $(this).attr("wordWidth"),
                                         zIndex: "50",
                                         backgroundColor: "#eeeeee"
                                     })
                               */
                            },
                            function () {
                                /* $(this).css({
                                     width: $(this).attr("wordWidth"),
                                     "min-width": $(this).attr("wordWidth"),
                                     zIndex: "10",
                                     backgroundColor: "white"
                                 });*/
                            });

                        tmpElem.append(word.word);

                        tmpElem.tooltip({
                            position: {
                                my: "left top",
                                at: "left top-20"
                            },
                            show: {
                                duration: "fast"
                            },
                            hide: {
                                effect: "hide"
                            }
                        });
                        $(this.el).append(tmpElem);
                    }
                }
            }
        },

        getCSV: function (csvFilePath) {
            var self = this;
            $.ajax({
                type: "GET",
                url: csvFilePath,
                dataType: "text",
                success: function (data) {
                    self.processData(data);
                }
            });
        },

        processData: function (data) {
            var self = this;
            $.csv.toArrays(data, { separator: " " },
                           function (err, data) {
                               self.data = data;
                               self.renderTranscription();
                           }
            );

        },

        showWords: function (words) {
            if (this.path != "@no") {
                this.getCSV(this.path);
            }

        }
    });

    return TranscriptView;
});