define([
  "underscore",
  "backbone",
  "models/clip-model"
]
, function (_, Backbone, Clip) {

    /**
     * Collection of clip models
     */
    var Clips = Backbone.Collection.extend({
        model: Clip
    });

    return Clips;
});