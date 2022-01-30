import path from 'path';
import { isAudit } from '../src/audiso.ts';
import { promises as fs } from 'fs';

// test configuration
describe('entry test', () => {

    console.log('entry test');

    test('empty audit report', async () => {
        expect(isAudit({})).toBeFalse();
        expect(isAudit(null)).toBeFalse();
        expect(isAudit(undefined)).toBeFalse();
    });

    test('audit first example', async () => {
        const example1 = await fs.readFile(path.resolve(process.cwd(), './test/resources/audit-example-1.json'));
        const example1Str = example.toString();
        expect(isAudit(JSON.parse(example1Str))).toBeTrue();
    });
});
