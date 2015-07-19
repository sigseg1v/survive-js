var isServer = typeof window === 'undefined';
var limit = require('../../etc/ratelimiter.js');

function TracelogWrite(Tracelog, domLoaded) {
    var self = this;

    var logger = null;
    var persistentLogger = null;
    if (!isServer) {
        domLoaded.then(function () {
            logger = document.getElementById('tracelog');
            persistentLogger = document.getElementById('tracelog-debug');
        });
    }

    var writeLog_throttled = limit(1000/5, writeLog);
    self.step = function step() {
        writeLog_throttled();
    };

    function writeLog() {
        if (persistentLogger) {
            persistentLogger.value = '';
        }
        Tracelog.entities.forEach(function (ent) {
            var messages = ent.components.tracelog.messageQueue;
            while (messages.length > 0) {
                logMessage(ent.constructor.name + '[' + ent.id + ']: ' + messages.pop() + '\n');
            }
            if (ent.components.tracelog.persistent) {
                logPersistentMessage(ent.constructor.name + '[' + ent.id + ']: ' + Object.keys(ent.components.tracelog.persistent).map(function (k) { return ent.components.tracelog.persistent[k]; }).join('\n\t') + '\n');
            }
        });
        if (logger) {
            logger.scrollTop = logger.scrollHeight;
        }
    }

    function logMessage(message) {
        if (!isServer && logger) {
            logger.value += message;
        } else if (isServer) {
            console.log(message);
        }
    }

    function logPersistentMessage(message) {
        if (!isServer && persistentLogger) {
            persistentLogger.value += message;
        } else if (isServer) {
            console.log(message);
        }
    }
}

module.exports = TracelogWrite;
module.exports.$inject = ['component/Tracelog', 'documentReady'];
