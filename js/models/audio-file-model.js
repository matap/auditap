define([
  "underscore",
  "backbone"
]
, function (_, Backbone) {

    /**
     * Model of audio file in project 
     */
    var AudioFile = Backbone.Model.extend({
        defaults: {
            name: 'jmeno',
            path: '/home/user/cesta',
            duration: 40,
            sampleRate: 44100,
            transcript: "@no"
        },

        sync: function (method, model, options) {
            options.success && options.success("");
        }
    });
    return AudioFile;
});