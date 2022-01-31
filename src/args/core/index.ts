import { CliArgument, CliArguments, ConfigurationItem } from './types';

export function displayHelper(configuration : ConfigurationItem[]) {
    console.info(configuration.map(item => `${item.required ? item.alias.join(', ') : item.alias.map(aliasItem => `[${aliasItem}]`).join(', ')} ${item.quantity} ${item.type} ${item.description}`));
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
        displayHelper(configuration);
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
