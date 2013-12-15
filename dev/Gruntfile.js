"use strict";

module.exports = function(grunt) {

    var pkg = grunt.file.readJSON("package.json");

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: pkg,
        banner: grunt.file.read("copy.js").replace(/@VERSION/, pkg.version),
        // Task configuration.
        uglify: {
            options: {
                banner: "<%= banner %>"
            },
            dist: {
                src: "<%= build.dist.dest %>",
                dest: "../raphael-min.js"
            }
        },
        build: {
            options: {
                banner: "<%= banner %>"
            },
            dist: {
                dest: "../raphael.js",
                src: [
                    "../eve/eve.js",
                    "raphael.core.js",
                    "raphael.svg.js"
                ]
            }
        }
    });


    // These plugins provide necessary tasks.
    grunt.loadNpmTasks("grunt-contrib-uglify");

    // Special concat/build task to handle Raphael's build requirements
    grunt.registerMultiTask(
        "build",
        "Concatenate source, remove individual closures, embed version",
        function() {
            var data = this.data,
                name = data.dest,
                src = data.src,
                options = this.options({
                    banner: ""
                }),
                // Start with banner
                compiled = options.banner,
                closureRegex = /window\.Raphael.*\(R\)\s*\{/,
                closureEndRegex = /\}\(window\.Raphael\);\s*$/,
                exposeRegex = /(\r?\n\s*\/\/\s*EXPOSE(?:\r|\n|.)*\}\)\);)/;

            // Concatenate src
            src.forEach(function(path) {
                var source = grunt.file.read(path);

                // If SVG module, remove the closure and add an early 
                // return if not required
                if (path === "raphael.svg.js") {
                    source = "\n\n" +
                        source.replace(closureRegex,
                            "(function(){\n" +
                            "    if (!R.svg) {\n" +
                            "        return;\n" +
                            "    }"
                        )
                        .replace( closureEndRegex, "})();" );

                    // Add source before EXPOSE line
                    compiled = compiled.replace(exposeRegex, source + "$1");
                } else {
                    compiled += source;
                }
            });

            grunt.file.write( name, compiled );

            grunt.log.ok("Built file " + name);
        });

    // Default task.
    grunt.registerTask("default", ["build", "uglify"]);
};
