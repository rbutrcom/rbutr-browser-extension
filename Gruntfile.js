/*jshint scripturl:true*/
/*global module*/

module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      less: {
        files: ['src/less/*.less'],
        tasks: ['less', 'lint']
      }
    },

    less: {
      prod: {
        options: {},
        files: {
          'dist/css/rbutr.css': 'src/less/rbutr.less'
        }
      }
    },

    htmlhint: {
        options: {
            htmlhintrc: '.htmlhintrc'
        },
        html: {
            src: ['src/**/*.html']
        }
    },

    csslint: {
        options: {
            csslintrc: '.csslintrc'
        },
        css: {
            src: ['dist/css/*.css']
        }
    },

    jshint: {
        options: {
            jshintrc: true
        },
        all: {
            src: ['Gruntfile.js', 'src/background.js', 'src/contentScript.js', 'src/popup/popup.js']
        }
    },

    copy: {
        main: {
            expand: true,
            cwd: 'src/',
            src: ['*.html', '*.js', '*.json'],
            dest: 'dist/'
        },
        assets: {
            expand: true,
            cwd: 'src/',
            src: 'assets/*',
            dest: 'dist/'
        },
        scripts: {
            expand: true,
            cwd: 'src/lib',
            src: '*',
            dest: 'dist/lib'
        },
        popup: {
            expand: true,
            cwd: 'src/popup/',
            src: '*',
            dest: 'dist/popup/'
        }
    },

    compress: {
        build: {
            options: {
                archive: 'build/rbutr.zip'
            },
            files: [{
                expand: true,
                cwd: 'dist/',
                src: ['**']
            }]
        }
    }

  });

  // load and register tasks
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-htmlhint');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('default', ['watch']);
  grunt.registerTask('lint', ['htmlhint', 'csslint', 'jshint']);
  grunt.registerTask('compile', ['less']);
  grunt.registerTask('build', ['compile', 'copy', 'compress:build']);
};
