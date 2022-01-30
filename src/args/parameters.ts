import { ConfigurationItem } from './core/types.ts';

export type Parameters = {
    inputFilePath: string;
    outputFilePath: string;
    packageFilePath: string;
};

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
