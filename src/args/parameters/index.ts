import { ConfigurationItem } from './core/types';
import { argsToConfiguration } from './core/index';

export type Parameters = {
    inputFilePath: string;
    outputFilePath: string;
    packageFilePath: string;
};

/**
 * Function to check if any data is a Parameters
 * @param data The data to check if is a valid Parameters
 * @returns boolean, type narrowing of Parameters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isParameters(data: any): data is Parameters {
    return (
        typeof data === "object" &&
        [
            data?.inputFilePath,
            data?.outputFilePath,
            data?.packageFilePath,
        ].every((value) => typeof value === "string" && value.trim() !== "")
    );
}

// add configuration definition
const configuration: ConfigurationItem[] = [
    {
        key: "packageFilePath",
        alias: ["-p", "--package-file"],
        type: "string",
        quantity: 1,
        required: false,
        description: "",
        value: "package.json",
    },
    {
        key: "outputFilePath",
        alias: ["-o", "--output-file"],
        type: "string",
        quantity: 1,
        required: false,
        description: "",
        value: "audit-dependency-report-sonarqube.json",
    },
    {
        key: "inputFilePath",
        alias: ["-i", "--input-file"],
        type: "string",
        quantity: 1,
        required: false,
        description: "",
        value: "audit-dependency-report.json",
    }
];

/**
 * Function to read parameters of cli
 * @param args Cli arguments array
 * @returns The parameters object found (or null if parameter object is invalid)
 */
export function readParameters(args: string[]): Parameters | null {
    
    const params = argsToConfiguration(configuration, args);

    configuration.forEach((value: ConfigurationItem) => {
        params[value.key] =
            ["inputFilePath", "outputFilePath", "packageFilePath"].includes(
                value.key
            ) && typeof value.value === "string"
                ? path.resolve(process.cwd(), value.value)
                : value.value;
    });

    return isParameters(params) ? params : null;
}
