
requirejs.config({
    paths: {
        "tmpl": "tmpl.min",
        "jquery": "libs/jquery/jquery.min",
        "jqueryUI": "libs/jquery/jquery-ui.min",
        "jqueryWheel": "libs/jquery/jquery.mousewheel",
        "jqueryCSV": "libs/jquery/jquery.csv-0.71.min",
        "load-image": "load-image.min",
        "canvas-to-blob": "canvas-to-blob.min",
        "image-gallery": "jquery.image-gallery.min",
        "jqueryTransport": "jquery.iframe-transport",
        "fileupload": "jquery.fileupload",
        "fileupload-fp": "jquery.fileupload-fp",
        "fileupload-ui": "jquery.fileupload-ui",
        "fileupload-jui": "jquery.fileupload-jui",
        "fileupload-main": "file-upload-main",
        "underscore": "libs/underscore/underscore-min",
        "backbone": "libs/backbone/backbone-min",
        "showTime": "libs/showTime"
    },

    shim: {
        'jquery': {
            exports: '$'
        },
        'jqueryUI': {
            deps: ['jquery'],
            exports: 'JqueryUI'
        },

        'tmpl': {
         
        },

        'fileupload-main': {
            deps: ["fileupload-jui"],
            exports: 'FileuploadMain'
        },

        'jqueryWheel': {
            deps: ['jquery', 'jqueryUI'],
            exports: 'JqueryWheel'
        },
        'jqueryCSV': {
            deps: ['jquery'],
            exports: 'JqueryCSV'
        },
        'jqueryForm': {
            deps: ['jquery'],
            exports: 'JqueryForm'
        },
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'showTime': {
            exports: 'ShowTime'
        }
    }
});


require([
  'app'
], function (App) {
    App.initialize();
});