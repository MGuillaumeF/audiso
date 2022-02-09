export enum ELoggerLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
    FATAL
};

export const MLogLevel = new Map<ELoggerLevel, string>([
        [ELoggerLevel.DEBUG, 'DEBUG'],
        [ELoggerLevel.INFO, 'INFO'],
        [ELoggerLevel.WARN, 'WARN'],
        [ELoggerLevel.ERROR, 'ERROR'] ,
        [ELoggerLevel.FATAL, 'FATAL']
]);

export type LoggerConfigurationItem = {
    level : ELoggerLevel,
    appenders : Array<(message: string) => void>
};

export abstract class Logger {
    protected configuration: { [key : string] : LoggerConfigurationItem } = {};

    /**
     * constructor of Logger
     * protected to prevent direct
     */
    protected constructor() { }

    /**
     * method to print message
     * @param theme the theme associated of log
     * @param messages the liste of message to log
     */
    public debug(theme: string, ...messages : string[]) {
        this.trace(ELoggerLevel.DEBUG, theme, messages);
    }
    /**
     * method to print message
     * @param theme the theme associated of log
     * @param messages the liste of message to log
     */
    public info(theme: string, ...messages : string[]) {
        this.trace(ELoggerLevel.INFO, theme, messages);
    }
    /**
     * method to print message
     * @param theme the theme associated of log
     * @param messages the liste of message to log
     */
    public warn(theme: string, ...messages : string[]) {
        this.trace(ELoggerLevel.WARN, theme, messages);
    }
    /**
     * method to print message
     * @param theme the theme associated of log
     * @param message the message to log
     * @param error the exception to log
     */
    public error(theme: string, message : string, error : Error) {
        this.trace(ELoggerLevel.ERROR, theme, [message], error);
    }
    /**
     * method to print message
     * @param theme the theme associated of log
     * @param message the message to log
     * @param error the exception to log
     */
    public fatal(theme: string, message : string, error : Error) {
        this.trace(ELoggerLevel.FATAL, theme, [message], error);
    }

    /**
     * method to print message
     * @param theme the theme associated of log
     * @param messages the list of message to log
     * @param error the exception to log
     */
    public trace(level: ELoggerLevel, theme: string, messages : string[], error ?: Error) {
        if (level >= this.configuration[theme].level) {
            const message = this.getMessage(level, theme, messages, error);
            this.configuration[theme].appenders.forEach((appender) => appender(message));
        }
    }
     /**
     * method to format message with error to log
     * @param level the level of log
     * @param theme the theme associated of log
     * @param messages the list of message to log
     * @param error the exception to log
     * @return the formated log
     */
    public abstract getMessage(level : ELoggerLevel, theme : string, messages : string[], error ?: Error) : string;
}




import path from path;
import { promises as fs } from fs;

const theme : {[key: string] : string} = {
    IO : 'IO',
    DATA : 'DATA'
};


export class CliLogger extends Logger {
    private batchLog : string[] = [];

    private static logger: CliLogger;
    /**
     * static method access to the singleton instance.
     */
    public static getInstance(): CliLogger {
        if (! CliLogger.logger) {
            CliLogger.logger = new CliLogger();
        }
        return CliLogger.logger;
    }

    constructor () {
        super();
        this.configuration = {
            IO : {
                level : ELoggerLevel.INFO,
                appenders : [
                    console.info,
                    this.write
                ]
            },
            DATA : {
                level : ELoggerLevel.INFO,
                appenders : [
                    console.info,
                    this.write
                ]
            }
        };
    }
        private write(message : string) : void {
            if (this.batchLog.length < 20) {
                this.batchLog.push(message);
            } else {
                fs.writeFile(path.resolve(process.cwd(), 'audiso.log'), `${this.batchLog.join('\n')}\n`, { flag : 'a' });
                this.batchLog = [];
            }
        }

       public getMessage<T extends Error>(level : ELoggerLevel, theme : string, messages : string[], error ?: Error) : string {
            return `${(new Date()).toLocaleString('fr-FR')} [${MLogLevel.get(level)}] - ${theme} : ${messages.join(' ')} ${error?.message} - stack : ${error?.stack}`;
        }

        public stopLogger() : void {
            fs.writeFile(path.resolve(process.cwd(), 'audiso.log'), `${this.batchLog.join('\n')}\n`, { flag : 'a' });
            this.batchLog = [];
            delete CliLogger.logger;
        }
}
