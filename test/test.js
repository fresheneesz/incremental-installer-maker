var fs = require("fs")
var path = require('path') 

try {
    var makeInstaller = require('../makeInstaller')
} catch(e) {
    var makeInstaller = require('incremental-installer') // this is because requiring it this way is currently necessary in the packaged script
}

var Future = makeInstaller.Future


makeInstaller('mytestinstaller.sh', {
    nodeVersions: ['0.10.25'],
    stateFile: function(args) {
        return '/opt/prm/install.state'
    },

    scripts: [
        function(args) {
            console.log("one")
        },
        {   check: function(args) {
                console.log("checking two")
                return Future(true)
            },
            install: function(args) {
                console.log("Running two. The command-line arguments are: "+args)

                console.log('  '+fs.readFileSync('test.txt').toString())
                console.log('  '+fs.readFileSync('moreFiles/another.txt').toString())
                console.log('  '+fs.readFileSync('someFiles/yetAnother.txt').toString())
                console.log('  '+fs.readFileSync('test2.txt').toString())
                console.log('  '+fs.readFileSync('MIT_LICENSE').toString().split('\n')[0]) // just print out first line
            }
        },
        function(args) {
            var f = new Future
            setTimeout(function() {
                console.log("three")
                f.return()
            },100)
            return f
        },
        function(args) {
            process.nextTick(function() {
                console.log("four")
            })
        },
    ],

    files: [
        "test.txt",                 // single file
        "moreFiles/another.txt",    // file in folder
        "someFiles",                // directory
        path.resolve('test2.txt'),  // absolute file path
        "../MIT_LICENSE"            // file-path in ancestor directory
    ]

})
