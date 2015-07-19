'use strict';

module.exports = function (grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        env: {
            debug: {
                DEBUG: 'DEBUG'
            },
            trace: {
                TRACE: 'TRACE'
            }
        },
        browserify: {
            client: {
                src: 'game/survive/game/Client.js',
                dest: 'assets/scripts/game_out.js'
            }
        },

        // Watch Config
        watch: {
            files: ['views/**/*'],
            options: {
                livereload: true
            },
            scripts: {
                files: [
                    'assets/scripts/**/*.js',
                ],
            },
            css: {
                files: [
                    'assets/styles/**/*.css',
                ],
            },
            images: {
                files: [
                    'assets/images/**/*.{png,jpg,jpeg,webp}'
                ],
            },
            express: {
                files:  [ 'app.js', '!**/node_modules/**', '!Gruntfile.js' ],
                tasks:  [ 'express:dev' ],
                options: {
                    nospawn: true // Without this option specified express won't be reloaded
                }
            },
        },

        jshint: {
            jshintrc: true,
            options: {
                node: true,
                browser: true
            },
            dev: [
                'game/**/*.js',
            ]
        },

        // Clean Config
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        'dist/*',
                        '!dist/.git*'
                    ]
                }]
            },
            server: ['.tmp'],
        },

        // Express Config
        express: {
            options: {
              // Override defaults here
            },
            dev: {
                options: {
                    script: 'app.js'
                }
            }
        },

        open: {
            dev: {
                path: 'http://127.0.0.1:3000',
                app: 'Chrome'
            }
        },

        // Copy Config
        // Put files not handled in other tasks here
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: 'assets',
                    dest: 'dist/assets',
                    src: [
                        '*.{ico,png,txt}',
                        '.htaccess',
                        'images/**/*.{webp,gif}',
                        'styles/fonts/{,*/}*.*',
                    ]
                }]
            },
            styles: {
                expand: true,
                dot: true,
                cwd: 'assets/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            },
        },

        bowerInstall: {
            dev: {
                src: [],
                dependencies: true,
                devDependencies: true
            }
        },

        preprocess: {
            options: {
                inline: true
            },
            js: {
                src: 'assets/scripts/game_out.js'
            },
            html: {
                files: [{
                    expand: true,
                    cwd: './views/',
                    src: [ '**/*.html', '!out/**/*'],
                    dest: './views/out/',
                    ext: '.html'
                }]
            }
        }
    });

    // Register Tasks
    // Workon
    grunt.registerTask('install', [
        'npm-install',
        'bowerInstall:dev'
    ]);
    grunt.registerTask('dev', 'Start working on this project.', [
        'jshint:dev',
        'browserify',
        'preprocess:js',
        'preprocess:html',
        'express:dev',
        'open:dev',
        'express-keepalive'
    ]);
    grunt.registerTask('dev-debug', 'Start working on this project.', [
        'env:trace',
        'env:debug',
        'jshint:dev',
        'browserify',
        'preprocess:js',
        'preprocess:html',
        'express:dev',
        'open:dev',
        'express-keepalive'
    ]);
    grunt.registerTask('dev-trace', 'Start working on this project.', [
        'env:trace',
        'jshint:dev',
        'browserify',
        'preprocess:js',
        'preprocess:html',
        'express:dev',
        'open:dev',
        'express-keepalive'
    ]);
};
