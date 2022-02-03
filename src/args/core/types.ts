/**
 * type of single arg of cli
 */
export type CliArgument = string | boolean | number;

/**
 * type of list args of cli
 */
export type CliArguments = string[] | boolean[] | number[];

/**
 * type of one argument of cli
 */
export type ConfigurationItem = {
    alias: string[];
    description: string;
    key: string;
    quantity: number;
    required: boolean;
    type: "string" | "number" | "boolean";
    value: CliArgument | CliArguments;
};
