#!/usr/bin/env node

import { promises as fs } from "fs";

import { readParameters, Parameters } from './args/parameters/index';

const JSON_LEFT_SPACE = 4;
const CLI_ARGUMENT_PADDING = 2;

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

/**
 * Function to check if any data is a Audit
 * @param data The data to check if is a valid Audit
 * @returns boolean, type narrowing of Audit
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isAudit(data: any): data is Audit {
    let result = true;
    // check auditReportVersion field
    result &&= typeof data?.auditReportVersion === "number";
    // check metadata field
    result &&=
        typeof data?.metadata?.vulnerabilities === "object" &&
        Object.entries(data.metadata.vulnerabilities).every(([key, value]) => {
            const isValid = typeof key === "string" && typeof value === "number";
            if (!isValid) {
                console.error(`Invalid metadata ${key}, name of metadata is typeof ${typeof key}, value is ${value} of type ${typeof value}`);
            }
            return isValid;
        });

    result &&=
        typeof data?.vulnerabilities === "object" &&
        Object.entries(data.vulnerabilities).every(([key, value]) => {
            const isVulnerabilityCheck = isVulnerability(value);
            const isValid = typeof key === "string" && isVulnerabilityCheck;
            if (!isValid) {
                console.error(`Invalid vulnerability ${key}, name of vulnerability is typeof ${typeof key}, vulnerability check result ${isVulnerabilityCheck}`);
            }
            return isValid;
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
    if (!result) {
        console.error(`is not a valid vulnerability object, data fixAvailable of ${data?.fixAvailable}, is direct ${data?.isDirect}, severity ${data?.severity}`);
    }
    return result;
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
        const buffer = await fs.readFile(params.inputFilePath);
        auditJsonString = buffer.toString();
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
    if (isAudit(data)) {
        audit = data;
    } else {
        throw Error("entry data is not a valid npm-audit data");
    }
    const issues = [];
    const engineId = `npm-audit-${audit.auditReportVersion}`;
    for (const [packageName, vulnerability] of Object.entries(
        audit.vulnerabilities
    )) {
        if (vulnerability.isDirect) {
            const packageJsonFileBuffer = await fs.readFile(
                params.packageFilePath
            );
            const packageJsonFile = packageJsonFileBuffer.toString();
            const packageNameIndex = packageJsonFile.indexOf(packageName);
            const rows = packageJsonFile.slice(0, packageNameIndex).split("\n");
            const startLine = rows.length;
            const startColumn = rows.slice(-1).shift()?.length || 0;
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
