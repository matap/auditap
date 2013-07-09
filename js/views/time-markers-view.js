define([
  "jquery",
  "jqueryUI",
  "jqueryWheel",
  "underscore",
  "backbone",
  "showTime"

]
, function ($, JqueryUI, JqueryWheel, _, Backbone, ShowTime) {



/**
 * View of time markers in timeline
 */
var timeMarkersView = Backbone.View.extend({
    el: $('#showTime'), // el attaches to existing element
    events: {
        //'click': 'myalert'
        // 'mousedown': 'mousedown'
    },
    initialize: function (options) {
        _.bindAll(this, 'render', 'showTimeRender', 'resize', 'zoomIn', 'zoomOut', 'renderTime', 'changeRange'); // every function that uses 'this' as the current object should be in here
        this.range = options.range;
        this.timeForPixel = 0.0;
        this.zoomFactor = 1.5;
        this.counter = 0;
        this.resize();
        this.render(this.range);
    },

    /**
     * On change of range, I must rerender view with new range
     */
    changeRange: function (range) {
        var diff = range - this.range;
        this.range = range;
        this.renderTime(this.step, this.timeForPixel, this.elemWidth, range);       // rerender

        this.timelineWidth = this.timelineWidth + diff / this.step * this.elemWidth;
    },

    showTimeRender: function (range, width) {
        var minElemWidth = 70;
        var maxElemWidth = 500;

        this.elemWidth = width / range;
        this.step = 1;
        if (this.elemWidth > maxElemWidth) this.step = (maxElemWidth / this.elemWidth);
        else if (this.elemWidth < minElemWidth) this.step = Math.round(minElemWidth / this.elemWidth);

        this.elemWidth = this.elemWidth * this.step;

        //  if (elemWidth > maxElemWidth) step = maxElemWidth / elemWidth;
        // else if (elemWidth < minElemWidth) step = (minElemWidth / elemWidth);

        this.timeForPixel = this.step / this.elemWidth;
        $('#alert').html("time  for pixel: " + this.timeForPixel);
        this.renderTime(this.step, this.timeForPixel, this.elemWidth, range);

    },

    /**
     * Rendering of time markers
     * @step    double number, which tells how many markers I dont render between two markers, which are rendered
     * @timeForPixel    how many time costs one pixel
     * @elemWidth   width of one element (time marker)
     * @range   range in seconds (floating point number), which I must render
     */
    renderTime: function (step, timeForPixel, elemWidth, range) {
        $('#showTime .time').remove();
        //var strMarker = $("<div class='marker'></div>").css("width", elemWidth + 'px');

        var decimalCount = 1;
        if (step >= 1) {
            decimalCount = 1;
        } else {
            decimalCount = 1.0 / step + 1;
        }
        for (var i = 0.0; i < range; i = i + step) {
            $(this.el).append($("<div class='time'><div style='clear: both'>" + convertTime(i, decimalCount) + "</div></div>").css("width", elemWidth + 'px'));
        }
        if (step > 1) {
            if (step > 7) {
                step = 3;
            }
            $('.time').append($("<div class='marker'></div>").css("width", (elemWidth - step) / step + 'px').css("height", '5px'))
            for (var j = 0; j < step - 1; j++) {
                $('.time').append($("<div class='marker'></div>").css("width", (elemWidth - step) / step + 'px').css("height", '2px'))
            }
        } else if ((step > 0.08) && (range < 3600)) { // 3600s = 60 min
            $('.time').append($("<div class='marker'></div>").css("width", (elemWidth - 5) / 5 + 'px').css("height", '5px'))
                  .append($("<div class='marker'></div>").css("width", (elemWidth - 5) / 5 + 'px').css("height", '2px'))
                  .append($("<div class='marker'></div>").css("width", (elemWidth - 5) / 5 + 'px').css("height", '2px'))
                  .append($("<div class='marker'></div>").css("width", (elemWidth - 5) / 5 + 'px').css("height", '2px'))
                  .append($("<div class='marker'></div>").css("width", (elemWidth - 5) / 5 + 'px').css("height", '2px'));
        }
        else {
            $('.time').append($("<div class='marker'></div>").css("width", elemWidth + 'px').css("height", '5px'))
        }
    },

    getTimeForPixel: function () {
        return this.timeForPixel;
    },

    render: function (range) {
        this.showTimeRender(range, this.timelineWidth);
    },

    resize: function () {
        this.timelineWidth = $('#timeline').width() * 1;
        this.render(this.range);
    },

    zoomIn: function () {
        this.timelineWidth = this.timelineWidth * this.zoomFactor;
        this.render(this.range);
    },

    zoomOut: function () {
        this.timelineWidth = this.timelineWidth / this.zoomFactor;
        this.render(this.range);
    }
});


return timeMarkersView;
});