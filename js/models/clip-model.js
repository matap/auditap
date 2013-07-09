define([
  "underscore",
  "backbone"
]
, function (_, Backbone) {

    /**
      * Clip model
      */
    var Clip = Backbone.Model.extend({
        /**
         * Default settings of clip
         */
        defaults: {
            id: 0,
            audioPath: 'clip name',
            audioName: 'audio name',
            volume: 100,
            start: 0,
            duration: 0,
            realDuration: 0,
            seekStart: 0,
            selected: false,
            sampleRate: 44100,
            transcript: 'path'

        },

        getID: function () {
            return this.get('id');
        },

        setID: function (id) {
            this.set({ id: id });
        },

        setStart: function (start) {
            if (start < 0) start = 0;
            this.set({ start: start });
        },

        getStart: function () {
            return this.get('start');
        },

        setSeekStart: function (seekStart) {
            if (seekStart < 0) seekStart = 0;
            this.set({ seekStart: seekStart });
        },

        setDuration: function (duration) {
            if (duration < 0) duration = 0;
            if (duration > this.get('realDuration') - this.get('seekStart')) duration = this.get('realDuration') - this.get('seekStart');
            this.set({ duration: duration });

            if (duration <= 0) {        // setting clip duration less than zero is same as erasing of clip
                this.destroy();
                return;
            }
        },

        setSelected: function (selected) {
            this.set({ selected: selected });
        },

        /**
         * When I shift start of clip, I have to change multiple models settings
         * This method validates input params to clip beeing consistent
         */
        shiftStart: function (start, duration, seekStart) {
            if (start < 0) start = 0;
            if (seekStart < 0) {

                start = start - seekStart;
                duration = duration + seekStart;
                seekStart = 0;

            }
            if (duration < 0) {
                duration = 0;
                start = this.get('start') + this.get('duration')
            }

            this.set({ start: start, duration: duration, seekStart: seekStart });
            if (duration <= 0) {
                this.destroy();
            }
        },

        /**
         * Reaction on cutting
         * Creates new clip like a clone of old one and sets new start, seekStart and duration values, which are counted from old clip
         */
        cut: function (time) {
            var newClip = this.clone();                                         // create new clip from old one
            var trackName = this.get('id').split("-");                          // get trackName from ID of old clip
            newClip.setID(trackName[0] + "-" + (this.collection.length + 1) + "-" + Math.floor((Math.random() * 10000) + 1));   // set new ID
            newClip.setStart(this.getStart() + time);
            newClip.setSeekStart(this.get('seekStart') + time);
            newClip.setDuration(this.get('duration') - time);
            this.collection.add(newClip);
            this.setDuration(time);                                             // old clip change duration
        },

        sync: function (method, model, options) {
            options.success && options.success("");
        }
    });

    return Clip;
});