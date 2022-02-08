export enum ELoggerLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR
};

export const MLogLevel = new Map<ELoggerLevel, string>([
        [ELoggerLevel.DEBUG, 'DEBUG'],
        [ELoggerLevel.INFO, 'INFO'],
        [ELoggerLevel.WARN, 'WARN'],
        [ELoggerLevel.ERROR, 'ERROR']
]);

export type LoggerConfigurationItem = {
    level : ELoggerLevel,
    appenders : Array<(message: string) => void>
};

export abstract class Logger {
    private static logger: Logger;
    private configuration: { [key : string] : ILoggerConfigurationItem }

    /**
     * constructor of Logger
     * private to prevent direct
     */
    private constructor() { }

    /**
     * static method access to the singleton instance.
     */
    public static getInstance(): Logger {
        if (!Logger.logger) {
            Logger.logger = new Logger();
        }
        return Logger.logger;
    }

    /**
     * method to print message
     * @param theme the theme associated of log
     * @param messages the liste of message to log
     */
    public debug(theme: string, ...messages : string[]) {
        trace(ELoggerLevel.DEBUG, theme, ...messages);
    }
    /**
     * method to print message
     * @param theme the theme associated of log
     * @param messages the liste of message to log
     */
    public info(theme: string, ...messages : string[]) {
        trace(ELoggerLevel.INFO, theme, ...messages);
    }
    /**
     * method to print message
     * @param theme the theme associated of log
     * @param messages the liste of message to log
     */
    public warn(theme: string, ...messages : string[]) {
        trace(ELoggerLevel.WARN, theme, ...messages);
    }
    /**
     * method to print message
     * @param theme the theme associated of log
     * @param message the message to log
     * @param error the exception to log
     */
    public error<T extends Error>(theme: string, messages : string, error : T) {
        trace(ELoggerLevel.ERROR, theme, message, error);
    }
    /**
     * method to print message
     * @param theme the theme associated of log
     * @param message the message to log
     * @param error the exception to log
     */
    public fatal<T extends Error>(theme: string, messages : string, error : T) {
        trace(ELoggerLevel.FATAL, theme, message, error);
    }

    /**
     * method to print message
     * @param theme the theme associated of log
     * @param messages the liste of message to log
     */
    public trace(level: ELoggerLevel, theme: string, ...messages : string[]): void {
    if (level >= configuration[theme].level) {
        const message = getMessage(level, theme, messages);
        configuration[theme].appenders.forEach((appender) => appender(message));
    }
}

    /**
     * method to print message
     * @param theme the theme associated of log
     * @param message the message to log
     * @param error the exception to log
     */
    public trace<T extends Error>(level: ELoggerLevel, theme: string, message : string, error : T) {
        if (level >= configuration[theme].level) {
        const message = getMessage(level, theme, message, error);
        configuration[theme].appenders.forEach((appender) => appender(message));
    }
    /**
     * method to format message list to log
     * @param level the level of log
     * @param theme the theme associated of log
     * @param messages the liste of message to log
     * @return the formated log
     */
    public getMessage(level : ELoggerLevel, theme : string, messages : string[]) : string;
    /**
     * method to format message with error to log
     * @param level the level of log
     * @param theme the theme associated of log
     * @param message the message to log
     * @param error the exception to log
     * @return the formated log
     */
    public getMessage<T extends Error>(level : ELoggerLevel, theme : string, message : string, error : T) : string;
}




import path from path;
import { promises as fs } from fs;

const theme : {[key: string] : string} = {
    IO : 'IO',
    DATA : 'DATA'
};


export class CliLogger extends Logger {
    private batchLog : string[] = [];
    constructor () {
        this.configuration = {
            IO : {
                level : ELoggerLevel.INFO,
                appenders : [
                    console.info,
                    write
                ]
            },
            DATA : {
                level : ELoggerLevel.INFO,
                appenders : [
                    console.info,
                    write
                ]
            }
        };
    }
        private write(message : string) => {
            if (batchLog.length < 20) {
                batchLog.push(message);
            } else {
                fs.writeFile(path.resolve(process.cwd(), 'audiso.log'), `${batchLog.join('\n')}\n`, { flag : 'a' });
                batchLog = [];
            }
        }

       public getMessage<T extends Error>(level : ELoggerLevel, theme : string, message : string, error : T) : string {
            return `${(new Date()).toLocaleString('fr-FR')} [${MLogLevel.at(level)}] - ${theme} : ${message} ${error.message} - stack : ${error?.stack}`;
        }

        public getMessage(level : ELoggerLevel, theme : string, messages : string[]) : string {
            return `${(new Date()).toLocaleString('fr-FR')} [${MLogLevel.at(level)}] - ${theme} : ${messages.join(' ')}`;
        public stopLogger() : void {
            fs.writeFile(path.resolve(process.cwd(), 'audiso.log'), `${batchLog.join('\n')}\n`, { flag : 'a' });
                batchLog = [];
            delete Logger.logger;
        }
    }
}
