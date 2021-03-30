require('dotenv').config()

const { createLogger, transports } = require('winston');
const { format } = require('logform');

const logger = createLogger({
    level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info",
    transports: [
        new transports.Console({
            level: "info",
            format: format.combine(
                format.colorize(),
                format.printf((info) => {
                    const rawLevel = info.level.slice(5, -5);
                    const level = info.level.replace(rawLevel, rawLevel.toUpperCase());
        
                    let log = `[${level}]`;
                    if (info.social && info.user) {
                        log += " ";
                        log += `[${info.social} - ${info.user}]`;
                    }
                    log += " ";
                    log += info.message.toString().trim();
                    return log;
                })
            ),
        }),
        new transports.File({
            filename: 'main.log',
            level: "http",
            format: format.combine(
                format.timestamp(),
                format.printf((info) => {
                    let log = `${info.timestamp} [${info.level.toUpperCase()}]`;
                    if (info.social && info.user) {
                        log += " ";
                        log += `[${info.social} - ${info.user}]`;
                    }
                    log += " ";
                    log += info.message.toString().trim()
                    return log;
                })
            )
        })
    ]
});

module.exports = { logger };