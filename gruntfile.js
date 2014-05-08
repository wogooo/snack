module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-html2js');

    // Default task.
    grunt.registerTask('default', ['jshint', 'build', 'karma:unit']);
    grunt.registerTask('build', ['clean', 'html2js', 'concat', 'less:build', 'copy:assets']);
    grunt.registerTask('release', ['clean', 'html2js', 'uglify', 'jshint', 'karma:unit', 'less:min', 'copy:assets']);
    grunt.registerTask('test-watch', ['karma:watch']);

    // Print a timestamp (useful for when watching)
    grunt.registerTask('timestamp', function () {
        grunt.log.subhead(Date());
    });

    var karmaConfig = function (configFile, customOptions) {
        var options = {
            configFile: configFile,
            keepalive: true
        };
        var travisOptions = process.env.TRAVIS && {
            browsers: ['Firefox'],
            reporters: 'dots'
        };
        return grunt.util._.extend(options, customOptions, travisOptions);
    };

    // Project configuration.
    grunt.initConfig({
        distdir: 'core/client/static',
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '<%= pkg.homepage ? " * " + pkg.homepage + "\\n" : "" %>' +
            ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;\n' +
            ' * Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n */\n',
        src: {
            js: ['core/client/app/**/*.js'],
            jsTpl: ['<%= distdir %>/templates/**/*.js'],
            specs: ['core/client/test/**/*.spec.js'],
            scenarios: ['core/client/test/**/*.scenario.js'],
            tpl: {
                app: ['core/client/app/**/*.tpl.html']
            },
            less: ['core/client/less/stylesheet.less'], // recess:build doesn't accept ** in its file patterns
            lessWatch: ['core/client/less/**/*.less']
        },
        clean: ['<%= distdir %>/*'],
        copy: {
            assets: {
                files: [{
                    dest: '<%= distdir %>',
                    src: '**',
                    expand: true,
                    cwd: 'core/client/assets/'
                }]
            }
        },
        karma: {
            unit: {
                options: karmaConfig('core/client/test/config/unit.js')
            }
            // watch: {
            //     options: karmaConfig('core/client/test/config/unit.js', {
            //         singleRun: false,
            //         autoWatch: true
            //     })
            // }
        },
        html2js: {
            app: {
                options: {
                    base: 'core/client/app'
                },
                src: ['<%= src.tpl.app %>'],
                dest: '<%= distdir %>/templates/app.js',
                module: 'templates.app'
            }
            // common: {
            //     options: {
            //         base: 'core/client/app/common'
            //     },
            //     src: ['<%= src.tpl.common %>'],
            //     dest: '<%= distdir %>/templates/common.js',
            //     module: 'templates.common'
            // }
        },
        concat: {
            dist: {
                options: {
                    banner: "<%= banner %>"
                },
                src: ['<%= src.js %>', '<%= src.jsTpl %>'],
                dest: '<%= distdir %>/snack-admin.js'
            },
            angular: {
                src: ['core/client/vendor/angular/angular.js', 'core/client/vendor/angular/*.js'],
                dest: '<%= distdir %>/angular.js'
            },
            'angular-ui': {
                src: ['core/client/vendor/angular-ui/**/*.js'],
                dest: '<%= distdir %>/angular-ui.js'
            },
            'engine.io': {
                src: ['core/client/vendor/engine.io/**/*.js'],
                dest: '<%= distdir %>/engine.io.js'
            }
        },
        uglify: {
            dist: {
                options: {
                    banner: "<%= banner %>"
                },
                src: ['<%= src.js %>', '<%= src.jsTpl %>'],
                dest: '<%= distdir %>/snack-admin.js'
            },
            angular: {
                src: ['<%= concat.angular.src %>'],
                dest: '<%= distdir %>/angular.js'
            },
            'angular-ui': {
                src: ['core/client/vendor/angular-ui/**/*.js'],
                dest: '<%= distdir %>/angular-ui.js'
            },
            'engine.io': {
                src: ['core/client/vendor/engine.io/**/*.js'],
                dest: '<%= distdir %>/engine.io.js'
            }
        },
        less: {
            build: {
                options: {
                    strictMath: true,
                    sourceMap: true,
                    outputSourceFiles: true,
                    sourceMapURL: 'snack-admin.css.map',
                    sourceMapFilename: '<%= distdir %>/snack-admin.css.map'
                },
                files: {
                    '<%= distdir %>/snack-admin.css': ['<%= src.less %>']
                }
            },
            min: {
                options: {
                    cleancss: true,
                    report: 'min'
                },
                files: {
                    '<%= distdir %>/snack-admin.css': ['<%= src.less %>']
                }
            }
        },
        watch: {
            all: {
                files: ['<%= src.js %>', '<%= src.specs %>', '<%= src.lessWatch %>', '<%= src.tpl.app %>'],
                tasks: ['default', 'timestamp']
            },
            build: {
                files: ['<%= src.js %>', '<%= src.specs %>', '<%= src.lessWatch %>', '<%= src.tpl.app %>'],
                tasks: ['build', 'timestamp']
            },
            app: {
                files: ['<%= src.js %>', '<%= src.specs %>', '<%= src.tpl.app %>'],
                tasks: ['build', 'timestamp']
            }
        },
        jshint: {
            files: ['gruntfile.js', '<%= src.js %>', '<%= src.jsTpl %>', '<%= src.specs %>', '<%= src.scenarios %>'],
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                boss: true,
                eqnull: true,
                globals: {}
            }
        }
    });

};
