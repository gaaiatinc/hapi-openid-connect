/**
 * Created by Ali on 3/15/2015.
 */
module.exports = function (grunt) {

    grunt.initConfig({
        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        src: ["lib/**", "WebComponents/**", "public/**", "scripts/**", "config/**", "logs/**", "*"],
                        dest: "build/Release",
                        options: {
                            timestamp: true,
                            mode: true
                        }
                    }
                ]
            }
        },
        clean: {
            build: {
                src: ["build/Release/**"]
            },
            logs: {
                src: ["build/Release/logs/app.log"]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");

    grunt.registerTask("build", ["clean:build", "copy:build", "clean:logs"]);
    grunt.registerTask("clean-dist", ["clean:build"]);
    grunt.registerTask("default", []);

};
