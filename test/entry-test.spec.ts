import path from 'path';
import { isAudit } from '../src/audiso.ts';
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
});
