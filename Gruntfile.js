/*jshint scripturl:true*/
/*global module*/

module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      less: {
        files: ['src/less/*.less'],
        tasks: ['less:dev']
      }
    },

    less: {
      dev: {
        options: {},
        files: {
          'src/css/main.css': 'src/less/main.less'
        }
      },
      prod: {
        options: {
          compress: true
        },
        files: {
          'dist/css/main.min.css': 'src/less/main.less'
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
          'dist/lib/lib.min.js': ['src/lib/jquery.js', 'src/lib/jquery.crypt.js', 'src/lib/md5.js', 'src/lib/typeahead.js']
        }
      },
      sources: {
        files: {
          'dist/background.min.js': 'src/background.js',
          'dist/contentScript.min.js': 'src/contentScript.js',
          'dist/popup/popup.min.js': 'src/popup/popup.js',
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
        strict: {
            options: {
                import: 2
            },
            src: ['src/css/*.css']
        }
    },

    jshint: {
        options: {
            csslintrc: '.csslintrc'
        },
        all: {
            src: ['Gruntfile.js', 'src/background.js', 'src/contentScript.js', 'src/popup/popup.js']
        }
    },

    copy: {
        main: {
            expand: true,
            cwd: 'src/',
            src: ['*.html', '*.json'],
            dest: 'dist/',
        },
        assets: {
            expand: true,
            cwd: 'src/',
            src: 'assets/*',
            dest: 'dist/',
        },
        popup: {
            expand: true,
            cwd: 'src/popup/',
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
  grunt.loadNpmTasks('grunt-htmlhint');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');

  grunt.registerTask('default', ['watch']);
  grunt.registerTask('lint', ['htmlhint', 'csslint', 'jshint']);
  grunt.registerTask('minify', ['less:prod', 'uglify']);
  grunt.registerTask('build', ['minify', 'copy', 'compress:build']);
};
