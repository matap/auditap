define([
  "underscore",
  "backbone",
  "models/track-model"
]
, function (_, Backbone, Track) {
    var Tracks = Backbone.Collection.extend({
        model: Track
    });

    return Tracks;
});