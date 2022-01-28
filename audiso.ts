#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");

type Parameters = {
    inputFilePath: string;
    outputFilePath: string;
    packageFilePath: string;
};

type Audit = {
    auditReportVersion: number;
    metadata: {
        vulnerabilities: {
            [key: string]: number;
        };
    };
    vulnerabilities: {
        [key: string]: {
            fixAvailable: { name: string; version: string } | false;
            isDirect: boolean;
            severity: string;
        };
    };
};

type CliArgument = string
            | boolean
            | number;

type CliArguments = string[]
            | boolean[]
            | number[];

async function auditToSonar(params: Parameters) : Promise<void> {
    const npmSeverityToSonar = new Map([
        ["info", "INFO"],
        ["low", "MINOR"],
        ["moderate", "MINOR"],
        ["high", "MAJOR"],
        ["critical", "CRITICAL"],
    ]);

    let auditJsonString = "";
    try {
        auditJsonString = await fs.readFile(params.inputFilePath);
        auditJsonString = auditJsonString.toString();
    } catch (error) {
        console.error("input file read failed", error);
        throw Error("input file read failed");
    }

    const audit = JSON.parse(auditJsonString) as Audit;
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
            const startColumn = rows.at(-1).length;
            const endColumn = startColumn + packageName.length;

            issues.push({
                engineId,
                ruleId: "dependency-vulnerability",
                severity: npmSeverityToSonar.get(vulnerability.severity),
                type: "VULNERABILITY",
                primaryLocation: {
                    message: `The dependency ${packageName} has vulnerability${
                        vulnerability.fixAvailable
                            ? `, fix available in ${vulnerability.fixAvailable.name} version : ${vulnerability.fixAvailable.version}`
                            : ""
                    }`,
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
                .join("\n"),
            filePath: params.packageFilePath,
            textRange: {
                startLine: 1,
                startColumn: 0,
            },
        },
    });
    const output = JSON.stringify({ issues }, null, 4);
    console.debug("issues generated", output);
    try {
        await fs.writeFile(params.outputFilePath, output);
    } catch (error) {
        console.error("output file write failed", error);
        throw error;
    }
}

if (require.main === module) {
    // get arguments of process run
    const args = process.argv.slice(2);

    const params: {
        [key: string]:
            | CliArgument
            | CliArguments
    } = {};

    const configuration = [
        {
            key: "packageFilePath",
            alias: ["-p", "--package-file"],
            type: "string",
            quantity: 1,
            required: false,
            description: "",
            value: path.resolve(process.cwd(), "package.json"),
        },
        {
            key: "outputFilePath",
            alias: ["-o", "--output-file"],
            type: "string",
            quantity: 1,
            required: false,
            description: "",
            value: path.resolve(
                process.cwd(),
                "audit-dependency-report-sonarqube.json"
            ),
        },
        {
            key: "inputFilePath",
            alias: ["-i", "--input-file"],
            type: "string",
            quantity: 1,
            required: false,
            description: "",
            value: path.resolve(process.cwd(), "audit-dependency-report.json"),
        },
    ];

    configuration.forEach((value) => {
        const newValue = args.find((arg) => {
            return value.alias
                .map((reg) => RegExp(`${reg}=\\S+`))
                .some((regTest) => regTest.test(arg));
        });
        if (newValue) {
            value.value = path.resolve(process.cwd(), newValue.split("=")[1]);
        } else {
            const optionIndex = args.findIndex((arg) => {
                return value.alias.some((regTest) => regTest === arg);
            });
            if (optionIndex !== -1) {
                value.value = path.resolve(
                    process.cwd(),
                    value.quantity === 1
                        ? args[optionIndex + 1]
                        : args.slice(
                              optionIndex + 1,
                              optionIndex + value.quantity
                          )
                );
            }
        }

        params[value.key] = value.value;

        if (value.required && value.value === undefined) {
            console.error(
                `${value.alias.join(", ")} required option is not defined`
            );
            throw Error(`${value.alias.join(", ")} required option is not defined`);
        }
    });
    auditToSonar(params as Parameters);
}

const audiso = { auditToSonar };

export default audiso;
