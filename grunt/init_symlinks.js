var fs = require('fs');
var Promise = require('bluebird');
var promise_lstat = Promise.promisify(fs.lstat, fs);
var promise_symlink = Promise.promisify(fs.symlink, fs);

function createLink(linkFileLocation, relativeLinkToStore, type) {
    return promise_lstat(linkFileLocation)
        .then(function (stat) {
            if (stat.isSymbolicLink()) {
                console.log('symlink at', linkFileLocation, 'already exists -- skipping creation');
            } else {
                throw 'file exists at ' + linkFileLocation + ' but is not a symlink';
            }
        })
        .caught(function (err) {
            if (err && err.code == 'ENOENT') {
                // symlink(srcPath, dstPath, type) syntax -- don't lie, you totally forgot the format of the arguments:
                //      srcPath: path of file or dir relative to dstPath (not relative to cwd)
                //      dstPath: location relative to cwd where the symlink file will be create
                //      type: 'file', 'dir', or 'junction' on Windows, otherwise ignored
                return promise_symlink(relativeLinkToStore, linkFileLocation, type).
                    then(function () {
                        console.log('created symlink at', linkFileLocation, 'to', relativeLinkToStore);
                    });
            } else {
                throw err;
            }
        });
}

module.exports = function initSymlinks() {
    return Promise.all([
        createLink('./node_modules/game', '../game', 'dir'),
        createLink('./node_modules/assets', '../assets', 'dir'),
        createLink('./node_modules/views', '../views', 'dir'),
        createLink('./node_modules/wires.js', '../wires.js', 'file')
    ]);
};
