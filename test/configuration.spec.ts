import path from 'path';
import { promises } from 'fs';
import { readParameters } from '../src/args/parameters/index.ts';
const { fs } = promises; 

// test configuration
describe('configuration test', () => {
    console.log('configuration test');
    test('no args configuration parameters', async () => {
        const parameters = readParameters([]);
        const { packageFilePath, inputFilePath, outputFilePath } = parameters;

        expect(packageFilePath).toEqual(path.resolve(process.cwd(), 'package.json'));
        expect(inputFilePath).toEqual(path.resolve(process.cwd(), 'audit-dependency-report.json'));
        expect(outputFilePath).toEqual(path.resolve(process.cwd(), 'audit-dependency-report-sonarqube.json'));
    });

    test('attached configuration parameters', async () => {
        const parameters = readParameters(['--input-file=my-package/my-npm-audit-report.json', '--output-file=my-package/my-sonarqube-audit-report.json', '--package-file=my-package/package.json']);
        const { packageFilePath, inputFilePath, outputFilePath } = parameters;

        expect(packageFilePath).toEqual(path.resolve(process.cwd(), 'my-package/package.json'));
        expect(inputFilePath).toEqual(path.resolve(process.cwd(), 'my-package/my-npm-audit-report.json'));
        expect(outputFilePath).toEqual(path.resolve(process.cwd(), 'my-package/my-sonarqube-audit-report.json'));
    });

    test('detached configuration parameters', async () => {
        const parameters = readParameters(['--input-file', 'my-package/my-npm-audit-report.json', '--output-file', 'my-package/my-sonarqube-audit-report.json', '--package-file', 'my-package/package.json']);
        const { packageFilePath, inputFilePath, outputFilePath } = parameters;

        expect(packageFilePath).toEqual(path.resolve(process.cwd(), 'my-package/package.json'));
        expect(inputFilePath).toEqual(path.resolve(process.cwd(), 'my-package/my-npm-audit-report.json'));
        expect(outputFilePath).toEqual(path.resolve(process.cwd(), 'my-package/my-sonarqube-audit-report.json'));
    });
});
