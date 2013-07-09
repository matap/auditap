/**
 * Created by Stanislav Kadlcik
 * xkadlc03@fit.vutbr.cz
 * 2013
 */


define([
  "jquery",
  "underscore",
  "backbone",
  "showTime"
]
, function ($, _, Backbone, ShowTime) {
    
/**
  * View, which takes care about tracker
  */
var trackerView = Backbone.View.extend({
    el: $('#tracker'),
    events: {
        'mousedown': 'mousedown',
        'mousemove': 'mousemove',
        'mouseup': 'mouseup'
    },
    initialize: function (options) {
        _.bindAll(this, 'render', 'setPosition', 'getPosition', 'setTime', 'getTime', 'setTimeForPixel', 'mousedown', 'mousemove', 'mouseup', 'zoom'); // every function that uses 'this' as the current object should be in here
        this.time = 0.0
        this.position = 0;
        this.render();
        this.timeForPixel = options.timeForPixel;
        this.setPosition(this.position);
        this.dragging = false;
        //this.setTime(this.time);
    },

    render: function () {
        $(this.el).offset({
            left: Math.round(this.position - $(this.el).width() / 2 - $('#timeline').scrollLeft() + $('.trackHandler').width())
        });
        $('#trackertime').html(convertTime(this.time, 4));

    },

    setPosition: function (pos) {
        this.position = pos;
        this.time = pos * this.timeForPixel;
        this.render();
    },

    getPosition: function () {
        return this.position;
    },

    setTime: function (time) {
        this.time = time;
        this.position = time / this.timeForPixel;
        this.render();
    },

    getTime: function () {
        return this.time;
    },

    zoom: function () {
        this.setTime(this.time);
    },

    setTimeForPixel: function (timeForPixel) {
        this.timeForPixel = timeForPixel;
    },

    mousedown: function (e) {
        this.dragging = true;
        //this.initialX = e.pageX;// - $(this.el).width() / 2;
        return false; // prevents default behavior
    },

    mouseup: function (e) {
        /*   this.dragging = false;
        this.setPosition(e.pageX );*/
    },

    mousemove: function (e) {
        if (this.dragging) {
            //   this.model.setTopLeft(e.pageX - this.initialX, e.pageY - this.initialY);
            /*  $(this.el).offset({
            left: e.pageX - $(this.el).width() / 2
            });*/
            // this.setPosition(e.pageX - $(this.el).width() / 2);
        }
    }
});

return trackerView;
});