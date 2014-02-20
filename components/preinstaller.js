var install = require("incremental-installer")
install.switch = 'run'
var run = install.run

//  nvm - so we can upgrade node
//run('wget -qO- https://raw.github.com/creationix/nvm/master/install.sh | sh')

var mainScript = process.argv[2]

require("./"+mainScript)