'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        env: {
            options: {
            },
            dev: {
                NODE_ENV: 'development',
                DEST: 'temp'
            },
            build: {
                NODE_ENV: 'production',
                DEST: 'dist'
            },
            test: {
                NODE_ENV: 'test',
            }
        },
        nodeunit: {
            files: ['test/**/*_test.js']
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            lib: {
                src: ['routes/**/*.js', 'app.js', 'public/js/**/*.js', 'model/*.js']
            },
            test: {
                src: ['test/**/*.js']
            }
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            lib: {
                files: '<%= jshint.lib.src %>',
                tasks: ['jshint:lib', 'nodeunit']
            },
            test: {
                files: '<%= jshint.test.src %>',
                tasks: ['jshint:test', 'nodeunit']
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.js']
            }
        },
        simplemocha: {
            options: {
                globals: ['should'],
                timeout: 1000,
                ignoreLeaks: false,
                ui: 'bdd',
                reporter: 'spec'
            },
            all: {
                src: ['test/**/*.js']
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-env');

    // Default task.
    //grunt.registerTask('default', ['jshint', 'nodeunit']);
    //grunt.registerTask('default', ['jshint', 'mochaTest']);
    grunt.registerTask('default', ['jshint', 'simplemocha']);
    grunt.registerTask('test', ['env:test','jshint', 'simplemocha']);

};