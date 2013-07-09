define([
  "underscore",
  "backbone",
  "models/clips-model"
]
, function (_, Backbone, Clips) {

    var Track = Backbone.Model.extend({
        defaults: function () {
            return {
                name: 'track',
                volume: '100',
                mute: false,
                selected: false,
                clips: new Clips()
            };
        },

        getName: function () {
            return this.get('name');
        },

        setSelected: function (selected) {
            this.set({ selected: selected });
        },

        setMute: function (m) {
            this.set({ mute: m });
        },

        setVolume: function (volume) {
            this.set({ volume: volume });
        },

        parse: function (data) {
                        this.get('clips').reset(data.clips);
            delete data.clips;
            return data;
        },

        sync: function (method, model, options) {
            options.dataType = "json";
            return Backbone.sync(method, model, options);
        }
    });

    return Track;
});