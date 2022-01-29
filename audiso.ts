#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";

const JSON_LEFT_SPACE = 4;
const CLI_ARGUMENT_PADDING = 2;

type Parameters = {
    inputFilePath: string;
    outputFilePath: string;
    packageFilePath: string;
};

type Vulnerability = {
    fixAvailable: { name: string; version: string } | false;
    isDirect: boolean;
    severity: string;
};

type Audit = {
    auditReportVersion: number;
    metadata: {
        vulnerabilities: {
            [key: string]: number;
        };
    };
    vulnerabilities: {
        [key: string]: Vulnerability;
    };
};

type CliArgument = string | boolean | number;

type CliArguments = string[] | boolean[] | number[];

type ConfigurationItem = {
    alias: string[];
    description: string;
    key: string;
    quantity: number;
    required: boolean;
    type: "string" | "number" | "boolean";
    value: CliArgument | CliArguments;
};

/**
 * Function to check if any data is a Parameters
 * @param data The data to check if is a valid Parameters
 * @returns boolean, type narrowing of Parameters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isParameters(data: any): data is Parameters {
    return (
        typeof data === "object" &&
        [
            data?.inputFilePath,
            data?.outputFilePath,
            data?.packageFilePath,
        ].every((value) => typeof value === "string" && value.trim() !== "")
    );
}

/**
 * Function to check if any data is a Audit
 * @param data The data to check if is a valid Audit
 * @returns boolean, type narrowing of Audit
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAudit(data: any): data is Audit {
    let result = true;
    // check auditReportVersion field
    result &&= typeof data?.auditReportVersion === "number";
    // check metadata field
    result &&=
        typeof data?.metadata === "object" &&
        Object.entries(data.metadata).every(([key, value]) => {
            return typeof key === "string" && typeof value === "number";
        });

    result &&=
        typeof data?.vulnerabilities === "object" &&
        Object.entries(data.vulnerabilities).every(([key, value]) => {
            return typeof key === "string" && isVulnerability(value);
        });

    return result;
}

/**
 * Function to check if any data is a Vulnerability
 * @param data The data to check if is a valid Vulnerability
 * @returns boolean, type narrowing of Vulnerability
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isVulnerability(data: any): data is Vulnerability {
    let result = true;
    result &&=
        data?.fixAvailable === "boolean" ||
        [data?.fixAvailable?.name, data?.fixAvailable?.version].every(
            (value) => typeof value === "string"
        );
    result &&= typeof data?.isDirect === "boolean";
    result &&= ["info", "low", "moderate", "high", "critical"].includes(
        data?.severity
    );
    return result;
}

/**
 * Function to extract options of cli command
 * @param configuration The configuration of options available
 * @param args arguments of cli
 * @returns Cli parameter object [key, value] fore each option
 */
function argsToConfiguration(
    configuration: ConfigurationItem[],
    args: string[]
): {
    [key: string]: CliArgument | CliArguments;
} {
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

/**
 * Function to read parameters of cli
 * @param args Cli arguments array
 * @returns The parameters object found (or null if parameter object is invalid)
 */
function readParameters(args: string[]): Parameters | null {
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
        },
    ];

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

/**
 * Function to convert npm-audit report to sonarqube generic issue  json format
 * @param params Run parameters (entry, output, package)
 */
async function auditToSonar(params: Parameters): Promise<void> {
    // map to convert npm-audit severity to sonarqube severity
    const npmSeverityToSonar = new Map([
        ["info", "INFO"],
        ["low", "MINOR"],
        ["moderate", "MINOR"],
        ["high", "MAJOR"],
        ["critical", "CRITICAL"],
    ]);

    let auditJsonString = "";
    try {
        auditJsonString = (await fs.readFile(params.inputFilePath)).toString();
    } catch (error) {
        console.error("input file read failed", error);
        throw Error("input file read failed");
    }

    let audit: Audit | null = null;
    let data: unknown;
    try {
        data = JSON.parse(auditJsonString);
    } catch (error) {
        console.error("entry data invalid, parsing error", error);
        throw Error("entry data invalid, parsing error");
    }
    //if (isAudit(data)) {
        audit = data as Audit;
    /*} else {
        throw Error("entry data is not a valid npm-audit data");
    }*/
    const issues = [];
    const engineId = `npm-audit-${audit.auditReportVersion}`;
    for (const [packageName, vulnerability] of Object.entries(
        audit.vulnerabilities
    )) {
        if (vulnerability.isDirect) {
            const packageJsonFile = (
                await fs.readFile(params.packageFilePath)
            ).toString();
            const packageNameIndex = packageJsonFile.indexOf(packageName);
            const rows = packageJsonFile.slice(0, packageNameIndex).split("\n");
            const startLine = rows.length;
            const startColumn = rows.at(-1)?.length || 0;
            const endColumn = startColumn + packageName.length;

            let message = `The dependency ${packageName} has vulnerability`;
            if (vulnerability.fixAvailable) {
                message += `, fix available in ${vulnerability.fixAvailable.name} version : ${vulnerability.fixAvailable.version}`;
            }
            issues.push({
                engineId,
                ruleId: "dependency-vulnerability",
                severity: npmSeverityToSonar.get(vulnerability.severity),
                type: "VULNERABILITY",
                primaryLocation: {
                    message,
                    filePath: params.packageFilePath,
                    textRange: {
                        startLine,
                        startColumn,
                        endColumn,
                    },
                },
            });
        }
    }

    // add summary metadata issue as INFO in at the top of package.json file
    issues.push({
        engineId,
        ruleId: "summary-dependency-vulnerability",
        severity: "INFO",
        type: "VULNERABILITY",
        primaryLocation: {
            message: Object.entries(audit.metadata.vulnerabilities)
                .map((entry) => {
                    const [level, quantity] = entry;
                    return `- ${quantity} ${level}`;
                })
                .join(" \r\n"),
            filePath: params.packageFilePath,
            textRange: {
                startLine: 1,
                startColumn: 0,
            },
        },
    });

    // write sonarqube generic issue report
    const output = JSON.stringify({ issues }, null, JSON_LEFT_SPACE);
    console.debug("issues generated", output);
    try {
        await fs.writeFile(params.outputFilePath, output);
    } catch (error) {
        console.error("output file write failed", error);
        throw error;
    }
}

if (require.main === module) {
    try {
        // get arguments of process run
        const args = process.argv.slice(CLI_ARGUMENT_PADDING);

        const params = readParameters(args);

        if (params !== null) {
            auditToSonar(params);
        } else {
            console.error("parameters invalid");
            throw Error("entry parameters invalid");
        }
    } catch (error) {
        console.error("convert failed with error", error);
        process.exit(1);
    }
}

const audiso = { auditToSonar };

export default audiso;
