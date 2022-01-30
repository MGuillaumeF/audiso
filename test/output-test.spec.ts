import path from 'path';
import { promises as fs } from 'fs';
import audiso from '../src/audiso.ts';
import util from 'util';
import { exec } from 'child_process';
const cmd = util.promisify(exec);

async function audisoCmd(args : string[]) {
  try {
    const { stdout, stderr } = await cmd('audiso', args);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
  } catch (e) {
    console.error(e); // should contain code (exit code) and signal (that caused the termination).
  }
}

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

    test('audit first example output', async () => {
         await audisoCmd(['--input-file=test/resources/audit-example-1.json', '--output-file=test/resources/audit-example-output-2.json', '--package-file=test/resources/package-example-1.json']);

         const reportBuffer = await fs.readFile(path.resolve(process.cwd(), 'test/resources/audit-example-output-2.json'));
        const report = JSON.parse(reportBuffer.toString());
        
        expect(Array.isArray(report?.issues)).toBeTruthy();
        expect(report?.issues?.length).toBe(3);
    });

});
