/**
 * Audio editor
 * Created by: Stanislav Kadlcik (xkadlc03@fit.vutbr.cz)
 * 2013
 */

define([
  "underscore",
  "backbone",
  "models/project-model",
  "views/project-view"
]
, function (_, Backbone,  Project, ProjectView) {

    var initialize = function () {
        var tool = 'mouseTool';                                                                 // global variable tool

        if (window.location.hash.replace('#', '').length > 0) {
            var project = new Project({ _id: window.location.hash.replace('#', '') });
            var projectView = new ProjectView({ model: project });
        } else {
            var project = new Project({/* _id: */ });               // new project model
            // save empty project to get ID
            project.save({}, {
                success: function (model, response) {
                    window.location.hash = '#' + project.get('_id');
                    var projectView = new ProjectView({ model: project });                       // project view
                },
                error: function (model, response) {
                    alert("Error: cant get ID from server");
                }
            });
        }
    }

    return {
        initialize: initialize
    };
});