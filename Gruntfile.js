/*jshint scripturl:true*/
/*global module*/

module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      less: {
        files: ['ext/less/*.less'],
        tasks: ['less:dev']
      }
    },

    less: {
      dev: {
        options: {},
        files: {
          'ext/css/main.css': 'ext/less/main.less'
        }
      },
      prod: {
        options: {
          compress: true
        },
        files: {
          'dist/css/main.min.css': 'ext/less/main.less'
        }
      }
    },


    uglify: {
      options: {
        quoteStyle: 1,
        screwIE8: true
      },
      library: {
        options: {
            preserveComments: 'all'
        },
        files: {
          'dist/lib/lib.min.js': ['ext/lib/jquery.js', 'ext/lib/jquery.crypt.js', 'ext/lib/md5.js', 'ext/lib/typeahead.js']
        }
      },
      sources: {
        files: {
          'dist/background.min.js': 'ext/background.js',
          'dist/contentScript.min.js': 'ext/contentScript.js',
          'dist/popup/popup.min.js': 'ext/popup/popup.js',
        }
      }
    },

    jshint: {
      all: ['Gruntfile.js', 'background.js', 'contentScript.js', 'popup/popup.js']
    },

    copy: {
        main: {
            expand: true,
            cwd: 'ext/',
            src: ['*.html', '*.json'],
            dest: 'dist/',
        },
        assets: {
            expand: true,
            cwd: 'ext/',
            src: 'assets/*',
            dest: 'dist/',
        },
        popup: {
            expand: true,
            cwd: 'ext/popup/',
            src: ['*.html', '*.gif'],
            dest: 'dist/popup/',
        },
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
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('default', ['watch']);
  grunt.registerTask('lint', ['csslint', 'jshint']);
  grunt.registerTask('minify', ['less:prod', 'uglify']);
  grunt.registerTask('build', ['minify', 'copy', 'compress:build']);
};
