
`incremental-installer`
=====

A module that helps create scripts that install non-npm dependencies for a project. Allows for smoothly and incremental adding dependencies during development.

During development, multiple engineers on a project will need to add dependencies and configuration for the project - things like database schema changes, version upgrades, and additions to the technology stack. This library helps you create installers that can be run quickly on every pull from the repository to ensure all the correct configuration is in place. The installers created with this will be idempotent - meaning you can run them multiple times without bad things happening. The installer will only install pieces that have not yet been installed.

This way, engineers can easily be sure they have the correct setup, automatically.

What is it good for?
==============
* absolutely nothing!
* Wait actually, its good for creating installers for one-time dependencies of a project (databases, caching systems, encryption packages, etc),
* installers for automatically setting up and configuring development environments (git, nano, adding package repositories, configuring test users or test data, etc), for example installing on vagrant virtual machines,
* or setting up shared environments (creating users, creating directory structures, setting up groups and permissions, etc)


Example
=======

```javascript
var makeInstaller = require('incremental-installer')
var run = makeInstaller.run

makeInstaller('myInstaller.sh', {
    nodeVersions: ['0.10.25'], // indicates what node.js versions can be installed
    stateFile: function(args) {
        var installationLocation = args[1]
        return installationLocation+'/install.state'
    },

    scripts: [
        function(args) { // runs first, only if the state is 0
            run('yum install -y nano')
        },
        function(args) { // runs second, only if the state is less than 1
			run('yum install -y nano')
        },
        {  install: function(args) { // runs third, only if the 'check' function returns true
              run('yum install -y git')
           },
           check: function(args) { // checks to see if the install function of this object should be run
              if(isGitInstalled()) {
                  return false
              } else {
                  return true
              }
           }
        }
    ]

})
 ```


Install
=======

```
npm install incremental-installer
```

#Usage

## Steps

1. **Write the script builder** - Create a node.js script that requires 'incremental-installer' (it must be that name, currently, for the resulting script to work)
  * any non-built-in `require`d modules **other** than 'incremental-installer' must be added to the `files` list.
  * the script should specify a stateFile location (via the `options.stateFile` function) where the state of the install can be saved on the machine
2. **Run the script builder** - Running the node.js script you created will output a shell script at the `filepath` you specified
  * You must run the script in an environment where the commands`tar`, `uuencode`, `cp -Rf`, and `rm -Rf` are all available (so basically, a linux machine)
3. **Run the shell script on the target machine** - The resulting shell script should be copied to the machine on which you want to run the installation. Run the shell script wherever is appropriate with whatever commandline arguments are appropriate.
  * The script can be copied via scp or even simply copy-pasted into a terminal editor and saved.
  * currently this has to be a machine that can execute bash scripts, but does **not** require the `tar` or `uudecode` commands to already be installed (they will be automatically installed)
  * The script only needs to be run with `sudo` if you expect it to install node.js, `tar`, or `uudecode`. Otherwise you shouldn't have to use `sudo` unless your installation script itself requires it.
4. **Add to the script builder** - When you need to add more to the installation, add another function to the end of the `options.scripts` list and repeat steps 1-3
  * Running the installer will skip over the already-ran functions and only run the new one(s)

**Note**: The node install script runs in a temporary directory that is be deleted after the install process. If you want to access the directory that the shell script was run from, it is the parent directory of the directory in which the node script is run in (ie process.directory+"/..").

**Vagrant note**: this installer (like many many other things) won't work in a linux-vagrant *shared directory* in a windows host environment. Run it in a location outside the shared directory


## node API

```javascript
var makeInstaller = require('incremental-installer')
```

`makeInstaller(filepath, options)` - creates an installer shell script

* `filepath` - The shell script is created in this location
* `options` - A set of options for how the installer is created. Has the following properties:
 * `nodeVersions` - An array of acceptable node.js versions, each in the format 'X.XX.XX' (e.g. '0.10.25'). *Currently the version of node.js is not checked.*
 * `stateFile(args)` - A function that returns the path to where the state file will be stored
   * The full path to the state-file location will be created if it doesn't already exist.
   * *The function takes in the commandline arguments to the shell script as its only parameter. `args` comes directly from process.argv of the top-level script)*
 * `files` - A list of files and folders the installation script will need to run. These files will be embedded in the shell script. They can be accessed from the script as if the files were in their current relative locations.
 * `scripts` - A list of functions to run in order. In maintaining this installer script, it is important that the order of these functions remains the same, and new functions are only added at the end. This is because the installation state of the machine is recorded as the number of functions run. If the order is changed, the next time the installer is run on a partially installed machine, already-ran functions may run, and necessary functions may not run.
   * Each element in the array can either be:
     * A function. In this case, the function is run if the stateFile contains a number greater-than-or-equal-to the index of the element. *The function takes in the commandline arguments to the shell script as its only parameter.*
       * If a function returns a future (*see [async-future](https://github.com/fresheneesz/asyncFuture)*), the next function will wait until that future resolves before running the next function.
     * An object with the following properties:
       * `install(args)` - A function.
         * If the function returns a future (*see [async-future](https://github.com/fresheneesz/asyncFuture)*), the next function will wait until that future resolves before running the next function.
       * `check(args)` - A function that returns Future(true) (*see [async-future](https://github.com/fresheneesz/asyncFuture)*) if the `install` function of the object should be run.
       * *Both these functions take in the commandline arguments to the shell script as its only parameter.*

`makeInstaller.run(command, printToConsole)` - runs a system command, displays the output on the console, and returns when the command is done. Throws an exception if the command returns an exit code other than 1.
 * `command` - a string of the command to run
 * `printToConsole` - *(Optional- default true)* If true, output is displayed to the console. If false, its not.

`makeInstaller.Future` - a reference to [async-future](https://github.com/fresheneesz/asyncFuture) for convenience (e.g. to use in `options.scripts[n].check` above)

Tested OSes
==========

* Centos 6.5

Todo
====

* Test on various operating systems
* if node.js exists, check to make sure the version is one of the listed nodeVersions
* Improve the way incremental-installer creates the archive:
  * Either use this for the original tarring instead of creating a temporary folder: http://stackoverflow.com/questions/21790843/how-to-rename-files-you-put-into-a-tar-archive-using-linux-tar/21795845
  * or use tar-stream and zlip to create the archive (best solution, but more complex)
    * You can use [tar-fs](https://github.com/mafintosh/tar-fs) to pack directories!
* use browserify to package together the main script, so the user doesn't have to manually specify which dependencies to package up
* Make this work for windows

How to Contribute!
============

Anything helps:

* Creating issues (aka tickets/bugs/etc). Please feel free to use issues to report bugs, request features, and discuss changes
* Updating the documentation: ie this readme file. Be bold! Help create amazing documentation!
* Submitting pull requests.

How to submit pull requests:

1. Please create an issue and get my input before spending too much time creating a feature. Work with me to ensure your feature or addition is optimal and fits with the purpose of the project.
2. Fork the repository
3. clone your forked repo onto your machine and run `npm install` at its root
4. If you're gonna work on multiple separate things, its best to create a separate branch for each of them
5. edit!
6. If it's a code change, please add to the unit tests (at test/protoTest.js) to verify that your change
7. When you're done, run the test and test the resulting installer on a fresh linux installation (try vagrant) to make sure things still work right
  * The resutling installer ("mytestinstaller.sh") should print out all the files in the embedded package, then should print 'one', 'checking two', 'Running two. ...' and print the command line arguments, 'three', then 'four' the first time
  * Subsequent runs should *not* print out 'one', 'three', or 'four' but should print out the rest.
  * I recommend using vagrant snapshots to test your work
8. Commit and push your changes
9. Submit a pull request: https://help.github.com/articles/creating-a-pull-request


Change Log
=========

* 0.0.1 - first!

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT