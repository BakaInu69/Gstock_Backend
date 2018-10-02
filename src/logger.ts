const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf } = format;
const normalFormat = printf(info => {
    return `${info.timestamp} ${info.originalUrl} ${info.level}: ${info.message}`;
});
export const logger = createLogger({
    level: "info",
    format: combine(
        timestamp(),
        normalFormat
    ),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        new transports.File({ filename: "./log/general/error.log", level: "error" }),
        new transports.File({ filename: "./log/general/combined.log" }),
        // new winston.transports.File({ filename: "mongodb_query.log" })
    ]
});

const dbFormat = printf(info => `{"timestamp": "${info.timestamp}","source":"${info.source}","level": "${info.level}","message": ${info.message}`);

export const dbLogger = createLogger({
    level: "info",
    format: combine(
        timestamp(),
        dbFormat
    ),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        new transports.File({ filename: "./log/db/error.log", level: "error" }),
        // new transports.File({ filename: "combined.log" }),
        new transports.File({ filename: "./log/db/mongodb_query.log" })
    ]
});