var fs = require('fs');
var Promise = require('bluebird');
var promise_lstat = Promise.promisify(fs.lstat, fs);

// create the symlinks here in a script because msysgit on windows doesn't currently support committing directory symlinks
module.exports = function initSymlinks() {
    return Promise.all([
        createDirectoryLink('./node_modules/game', '../game'),
        createDirectoryLink('./node_modules/assets', '../assets'),
        createDirectoryLink('./node_modules/views', '../views')
    ]);
};

function createDirectoryLink(linkFileLocation, relativeLinkToStore) {
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
                // symlink syntax:
                //      symlinkSync(srcPath, dstPath)
                //          srcPath: path of file or dir relative to dstPath (not relative to cwd)
                //          dstPath: location relative to cwd where the symlink file will be created
                fs.symlinkSync(relativeLinkToStore, linkFileLocation, 'dir');
                console.log('created symlink at', linkFileLocation, 'to', relativeLinkToStore);
            } else {
                throw err;
            }
        });
}
