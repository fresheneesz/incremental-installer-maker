
`incremental-installer-maker`
=====

THIS MODULE IS OBSOLETE. It has been superceded by: [installer-maker](https://github.com/fresheneesz/installer-maker) and [incremental-installer](https://github.com/fresheneesz/incremental-installer).

Install
=======

```
npm install incremental-installer-maker
```

#Usage

## Steps

1. **Write the script builder** - Create a node.js script that requires 'incremental-installer-maker' (it must be that name, currently, for the resulting script to work)
  * any non-built-in `require`d modules **other** than 'incremental-installer-maker' must be added to the `files` list.
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
var makeInstaller = require('incremental-installer-maker')
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

`makeInstaller.run(command, printToConsole)` - runs a system command, displays the output on the console, and returns when the command is done. Throws an exception if the command returns an exit code other than `0`.
 * `command` - a string of the command to run
 * `printToConsole` - *(Optional- default true)* If true, output is displayed to the console. If false, its not.

`makeInstaller.Future` - a reference to [async-future](https://github.com/fresheneesz/asyncFuture) for convenience (e.g. to use in `options.scripts[n].check` above)

Tested OSes
==========

* Centos 6.5


Change Log
=========

* 0.0.1 - first!

License
=======
Released under the MIT license: http://opensource.org/licenses/MIT