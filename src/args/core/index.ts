import { CliArgument, CliArguments, ConfigurationItem } from './types';

/**
 * Function to build help message of cli command
 * @param configuration The configuration object
 * @returns The help message
 */
export function getHelper(configuration : ConfigurationItem[]) : string {
    const aliasesMaxLength = 30;
    const quantityMaxLength = 3;
    const typeMaxLength = 8;
    return configuration.map(item => {
        const aliasDisplay = (item.required ? item.alias : item.alias.map(aliasItem => `[${aliasItem}]`)).join(', ');
        return `${aliasDisplay.padEnd(aliasesMaxLength, ' ')} ${String(item.quantity).padEnd(quantityMaxLength, ' ')} ${item.type.padEnd(typeMaxLength, ' ')} ${item.description}`
    }).join('\n');
}

/**
 * Function to extract options of cli command
 * @param configuration The configuration of options available
 * @param args arguments of cli
 * @returns Cli parameter object [key, value] fore each option
 */
export function argsToConfiguration (
    configuration: ConfigurationItem[],
    args: string[]
): {
    [key: string]: CliArgument | CliArguments;
} {
    if (['-h', '--help'].some(helpOption => args.includes(helpOption))) {
        console.info(getHelper(configuration));
        process.exit(0);
    }
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
