export type CliArgument = string | boolean | number;

export type CliArguments = string[] | boolean[] | number[];

export type ConfigurationItem = {
    alias: string[];
    description: string;
    key: string;
    quantity: number;
    required: boolean;
    type: "string" | "number" | "boolean";
    value: CliArgument | CliArguments;
};
