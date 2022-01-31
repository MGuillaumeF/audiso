import path from 'path';
import { isAudit } from '../src/audiso.ts';
import { getHelper } from '../src/parameters/index.ts';
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
        const configuration = getHelper([
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
        ]);
       
        expect(configuration).toBe('[-p], [--package-file]                     1  string  ');
    });
});
