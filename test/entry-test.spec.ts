import path from 'path';
import { isAudit } from '../src/audiso.ts';
import { getHelper, getVersion } from '../src/args/core/index.ts';
import { promises as fs } from 'fs';

// test configuration
describe('entry test', () => {

    console.log('entry test');

    test('empty audit report', async () => {
        expect(isAudit({})).toBeFalsy();
        expect(isAudit(null)).toBeFalsy();
        expect(isAudit(undefined)).toBeFalsy();
    });

    test('invalid audit report', async () => {
        expect(isAudit({auditReportVersion :2,metadata: {vulnerabilities : {unknown : 0}}, vulnerabilities:{dependence:{isDirect:'invalidBool', fixAvailable:{}}}})).toBeFalsy();
    });

    test('audit first example', async () => {
        const example1 = await fs.readFile(path.resolve(process.cwd(), './test/resources/audit-example-1.json'));
        const example1Str = example1.toString();
        expect(isAudit(JSON.parse(example1Str))).toBeTruthy();
    });

    test('helper', async () => {
        const configuration = await getHelper([
            {
                key: "packageFilePath",
                alias: ["-p", "--package-file"],
                type: "string",
                quantity: 1,
                required: false,
                description: "The path of package.json (default: ./package.json)",
                value: "package.json",
            },
            {
                key: "outputFilePath",
                alias: ["-o", "--output-file"],
                type: "string",
                quantity: 1,
                required: false,
                description: "The output path of sonarqube issue report (default: ./audit-dependency-report-sonarqube.json)",
                value: "audit-dependency-report-sonarqube.json",
            },
            {
                key: "inputFilePath",
                alias: ["-i", "--input-file"],
                type: "string",
                quantity: 1,
                required: false,
                description: "The input path of npm-audit report (default: ./audit-dependency-report.json)",
                value: "audit-dependency-report.json",
            }
        ]);
       
        expect(configuration).toBe('*** NOTICE : @mguillaumef/audiso v0.0.2\nThis module module convert npm-audit json report to sonarqube generic data issue report.\n[-p], [--package-file]         1   string   The path of package.json (default: ./package.json)\n[-o], [--output-file]          1   string   The output path of sonarqube issue report (default: ./audit-dependency-report-sonarqube.json)\n[-i], [--input-file]           1   string   The input path of npm-audit report (default: ./audit-dependency-report.json)');
        expect((await getVersion()).toBe('v0.0.2');
    });
});
