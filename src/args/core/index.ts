import { promises as fs } from 'fs';
import path from 'path';
import { CliArgument, CliArguments, ConfigurationItem } from './types';

/**
 * Function to build help message of cli command
 * @param configuration The configuration object
 * @returns The help message
 */
export async function getHelper(configuration : ConfigurationItem[]) : Promise<string> {
    const packageFileContebtBuffer = await fs.readFile(path.resolve(__dirname, '../../../package.json'));
    const packageJson = JSON.parse(packageFileContebtBuffer.toString());
    let title = '*** NOTICE';
    const version = typeof packageJson?.version === 'string' ? `v${packageJson.version}` : '';
    if (typeof packageJson?.name === 'string') {
     title += ` : ${packageJson.name} ${version}`;
    }
    if (typeof packageJson?.description === 'string') {
     title += `\n${packageJson.description}`;
    }
    const aliasesMaxLength = 30;
    const quantityMaxLength = 3;
    const typeMaxLength = 8;
    const rows = configuration.map(item => {
        const aliasDisplay = (item.required ? item.alias : item.alias.map(aliasItem => `[${aliasItem}]`)).join(', ');
        return `${aliasDisplay.padEnd(aliasesMaxLength, ' ')} ${String(item.quantity).padEnd(quantityMaxLength, ' ')} ${item.type.padEnd(typeMaxLength, ' ')} ${item.description}`
    });
    return [title, ...rows].join('\n');
}

/**
 * Function to build version message of cli command
 * @returns The version message
 */
export async function getVersion() : Promise<string> {
    const packageFileContebtBuffer = await fs.readFile(path.resolve(__dirname, '../../../package.json'));
    const packageJson = JSON.parse(packageFileContebtBuffer.toString());
   
    return typeof packageJson?.version === 'string' ? `v${packageJson.version}` : 'unknown version';
}

/**
 * Function to display helper if have options on cli command args
 * @param configuration The configuration of options available
 * @param args arguments of cli
 */
async function manageHelper (configuration: ConfigurationItem[], args: string[]) : Promise<void> {
    if (['-h', '--help'].some(helpOption => args.includes(helpOption))) {
        let result = 0;
        try {
            console.info(await getHelper(configuration));
        } catch (error) {
            console.error('helper message print error', error);
            result = 1;
        }
        process.exit(result);
    }
}

/**
 * Function to display version if have options on cli command args
 * @param args arguments of cli
 */
async function manageVersion (args: string[]) : Promise<void> {
    if (['-v', '--version'].some(helpOption => args.includes(helpOption))) {
        let result = 0;
        try {
            console.info(await getVersion());
        } catch (error) {
            console.error('version message print error', error);
            result = 1;
        }
        process.exit(result);
    }
}

/**
 * Function to extract options of cli command
 * @param configuration The configuration of options available
 * @param args arguments of cli
 * @returns Cli parameter object [key, value] fore each option
 */
export async function argsToConfiguration (
    configuration: ConfigurationItem[],
    args: string[]
): Promise<{
    [key: string]: CliArgument | CliArguments;
}> {
    await manageHelper(configuration, args);
    await manageVersion(args);
    // create empty parameters scope
    const params: {
        [key: string]: CliArgument | CliArguments;
    } = {};

    configuration.forEach((value: ConfigurationItem) => {
        const newValue = args.find((arg) => {
            return value.alias
                .map((reg) => RegExp(`${reg}=\\S+`))
                .some((regTest) => regTest.test(arg));
        });
        if (newValue) {
            value.value = newValue.split("=")[1];
        } else {
            const optionIndex = args.findIndex((arg) => {
                return value.alias.some((regTest) => regTest === arg);
            });
            if (optionIndex !== -1) {
                value.value =
                    value.quantity === 1
                        ? args[optionIndex + 1]
                        : args.slice(
                              optionIndex + 1,
                              optionIndex + value.quantity
                          );
            }
        }

        if (value.required && value.value === undefined) {
            console.error(
                `${value.alias.join(", ")} required option is not defined`
            );
            throw Error(
                `${value.alias.join(", ")} required option is not defined`
            );
        }
    });
    return params;
}
