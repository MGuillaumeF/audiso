import path from 'path';
import { promises as fs } from 'fs';
import audiso from '../src/audiso.ts';

// test output
describe('output test', () => {

    console.log('output test');

    test('audit first example output', async () => {
        await audiso.auditToSonar({
            inputFilePath: path.resolve(process.cwd(), 'test/resources/audit-example-1.json'),
            outputFilePath: path.resolve(process.cwd(), 'test/resources/audit-example-output-1.json'),
            packageFilePath: path.resolve(process.cwd(), 'test/resources/package-example-1.json')
        });
        const reportBuffer = await fs.readFile(path.resolve(process.cwd(), 'test/resources/audit-example-output-1.json'));
        const report = JSON.parse(reportBuffer.toString());
        
        expect(Array.isArray(report?.issues)).toBeTruthy();
        expect(report?.issues?.length).toBe(3);
    });
});
