const winston = require('winston');
require('winston-daily-rotate-file');
let path = require('path');


let {createLogger, format, transports} = winston;


let dailyFileTransport = new (winston.transports.DailyRotateFile)({
    filename: path.resolve('logs', '%DATE%.log'),
    datePattern: 'YYYY_MM_DD_HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: format.combine(
        format.timestamp(),
        format.simple()
    ),
});


dailyFileTransport.on('rotate', function (oldFilename, newFilename) {
    console.log('Log File Rotated!');
});




let transportModes = [new transports.Console({
    format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.simple(),
    )
})];

// if (env === 'production') {
//     transportModes.push(dailyFileTransport);
// }

let logger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.simple()
    ),
    transports: transportModes
});

module.exports = logger;




