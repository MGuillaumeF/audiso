#!/usr/bin/env node

// node imports
import { promises as fs } from "fs";
// cli args reading imports
import { readParameters, Parameters } from './args/parameters/index';
// cli logger
import { CliLogger, LoggerTheme } from './logger/core/index';

// spaces of pretty print of JSON objects
const JSON_LEFT_SPACE = 4;
// arguments of cli start at index 2
const CLI_ARGUMENT_PADDING = 2;
// init logger
const LOGGER = CliLogger.getInstance();

/**
 * type of vulnerability object of audit report (input)
 */
type Vulnerability = {
    /**
     * description of fix available or false if fix not available
     */
    fixAvailable: { name: string; version: string } | false;
    /**
     * the dependence with vulnerability is direct dependency declared in package json file. (false if sub-dependency)
     */
    isDirect: boolean;
    /**
     * the severity of vulnerability
     */
    severity: string;
};

/**
 * type of audit report (input)
 */
type Audit = {
    /**
     * the version of audit report
     */
    auditReportVersion: number;
    /**
     * metadata is the summary of result of report
     */
    metadata: {
        /**
         * object with vulnerability count by severity
         */
        vulnerabilities: {
            /**
             * count item, key is severity level
             */
            [key: string]: number;
        };
    };
    /**
     * object of vulnerabilities, each entry is a vulnerability
     */
    vulnerabilities: {
        /**
         * vulnerability item, key is package name of vulnerability
         */
        [key: string]: Vulnerability;
    };
};

/**
 * Function to check if any data is a Audit
 * @param data The data to check if is a valid Audit
 * @returns boolean, type narrowing of Audit
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
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
                LOGGER.error(LoggerTheme.DATA, 'Invalid metadata of vulnerability object', Error(`Invalid metadata ${key}, name of metadata is typeof ${typeof key}, value is ${value} of type ${typeof value}`));
            }
            return isValid;
        });

    result &&=
        typeof data?.vulnerabilities === "object" &&
        Object.entries(data.vulnerabilities).every(([key, value]) => {
            const isVulnerabilityCheck = isVulnerability(value);
            const isValid = typeof key === "string" && isVulnerabilityCheck;
            if (!isValid) {
                LOGGER.error(LoggerTheme.DATA, 'Invalid Audit Report', Error(`Invalid vulnerability ${key}, name of vulnerability is typeof ${typeof key}, vulnerability check result ${isVulnerabilityCheck}`));
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
function isVulnerability(data: any): data is Vulnerability {
    let result = true;
    result &&= typeof data?.fixAvailable === "boolean" ||
        [data?.fixAvailable?.name, data?.fixAvailable?.version].every(
            (value) => typeof value === "string"
        );
    result &&= typeof data?.isDirect === "boolean";
    result &&= ["info", "low", "moderate", "high", "critical"].includes(
        data?.severity
    );
    if (!result) {
        LOGGER.error(LoggerTheme.DATA, 'Bad vulnerability object definition', Error(`is not a valid vulnerability object, data fixAvailable of ${data?.fixAvailable}, is direct ${data?.isDirect}, severity ${data?.severity}`));
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
        ["critical", "CRITICAL"]
    ]);

    let auditJsonString = "";
    // read input file
    try {
        const buffer = await fs.readFile(params.inputFilePath);
        auditJsonString = buffer.toString();
    } catch (error) {
        LOGGER.error(LoggerTheme.DATA, "input file read failed", error);
        throw Error("input file read failed");
    }

    let audit: Audit | null = null;
    let data: unknown;

    // parsing of audit report
    try {
        data = JSON.parse(auditJsonString);
    } catch (error) {
        console.error("entry data invalid, parsing error", error);
        throw Error("entry data invalid, parsing error");
    }
    // narrowing of data as audit object
    if (isAudit(data)) {
        audit = data;
    } else {
        throw Error("entry data is not a valid npm-audit data");
    }
    const issues = [];
    // generate engine id for all issues
    const engineId = `npm-audit-${audit.auditReportVersion}`;
    // for each vulnerability object of audit report
    for (const [packageName, vulnerability] of Object.entries(
        audit.vulnerabilities
    )) {
        // filter direct vulnerability only
        if (vulnerability.isDirect) {
            const packageJsonFileBuffer = await fs.readFile(
                params.packageFilePath
            );
            const packageJsonFile = packageJsonFileBuffer.toString();
            const packageNameIndex = packageJsonFile.indexOf(packageName);
            // search rows where package name appears in package.json file
            const rows = packageJsonFile.slice(0, packageNameIndex).split("\n");
            const startLine = rows.length;
            // get column of package name in line on package.json
            const startColumn = rows.slice(-1).shift()?.length || 0;
            const endColumn = startColumn + packageName.length;

            let message = `The dependency ${packageName} has vulnerability`;
            if (vulnerability.fixAvailable) {
                message += `, fix available in ${vulnerability.fixAvailable.name} version : ${vulnerability.fixAvailable.version}`;
            }
            // add issue in sonarqube report array
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
                        endColumn
                    }
                }
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
                startColumn: 0
            }
        }
    });

    // write sonarqube generic issue report
    const output = JSON.stringify({ issues }, null, JSON_LEFT_SPACE);
    console.debug("issues generated", output);
    try {
        await fs.writeFile(params.outputFilePath, output);
    } catch (error) {
        console.error("output file write failed", error);
        throw Error('output error, report not writed');
    }
}

// if run with node command
if (require.main === module) {
    (async function () {
        try {
            // get arguments of process run
            const args = process.argv.slice(CLI_ARGUMENT_PADDING);

            const params = await readParameters(args);

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
    })();
}

const audiso = { auditToSonar };

export default audiso;
