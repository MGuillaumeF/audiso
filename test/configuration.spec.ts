import path from "path";
import { readParameters } from "../src/args/parameters/index.ts";

// test configuration
describe("configuration test", () => {
  console.log("configuration test");
  test("no args configuration parameters", async () => {
    const parameters = await readParameters([]);
    const { packageFilePath, inputFilePath, outputFilePath } = parameters;

    expect(packageFilePath).toEqual(
      path.resolve(process.cwd(), "package.json")
    );
    expect(inputFilePath).toEqual(
      path.resolve(process.cwd(), "audit-dependency-report.json")
    );
    expect(outputFilePath).toEqual(
      path.resolve(process.cwd(), "audit-dependency-report-sonarqube.json")
    );
  });

  test("bad args configuration parameters", async () => {
    const parameters = await readParameters([
      "--input-file= ",
      "--output-file= ",
      "--package-file= "
    ]);
    const { packageFilePath, inputFilePath, outputFilePath } = parameters;

    expect(packageFilePath).toEqual(
      path.resolve(process.cwd(), "package.json")
    );
    expect(inputFilePath).toEqual(
      path.resolve(process.cwd(), "audit-dependency-report.json")
    );
    expect(outputFilePath).toEqual(
      path.resolve(process.cwd(), "audit-dependency-report-sonarqube.json")
    );
  });

  test("attached configuration parameters", async () => {
    const parameters = await readParameters([
      "--input-file=my-package/my-npm-audit-report.json",
      "--output-file=my-package/my-sonarqube-audit-report.json",
      "--package-file=my-package/package.json"
    ]);
    const { packageFilePath, inputFilePath, outputFilePath } = parameters;

    expect(packageFilePath).toEqual(
      path.resolve(process.cwd(), "my-package/package.json")
    );
    expect(inputFilePath).toEqual(
      path.resolve(process.cwd(), "my-package/my-npm-audit-report.json")
    );
    expect(outputFilePath).toEqual(
      path.resolve(process.cwd(), "my-package/my-sonarqube-audit-report.json")
    );
  });

  test("detached configuration parameters", async () => {
    const parameters = await readParameters([
      "--input-file",
      "my-package/my-npm-audit-report.json",
      "--output-file",
      "my-package/my-sonarqube-audit-report.json",
      "--package-file",
      "my-package/package.json"
    ]);
    const { packageFilePath, inputFilePath, outputFilePath } = parameters;

    expect(packageFilePath).toEqual(
      path.resolve(process.cwd(), "my-package/package.json")
    );
    expect(inputFilePath).toEqual(
      path.resolve(process.cwd(), "my-package/my-npm-audit-report.json")
    );
    expect(outputFilePath).toEqual(
      path.resolve(process.cwd(), "my-package/my-sonarqube-audit-report.json")
    );
  });

  test("test helper call", async () => {
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
      console.info("mocked process exit called");
    });
    await readParameters([
      "--input-file",
      "my-package/my-npm-audit-report.json",
      "--output-file",
      "my-package/my-sonarqube-audit-report.json",
      "--package-file",
      "my-package/package.json",
      "-h"
    ]);
    expect(mockExit).toHaveBeenCalledWith(0);

    await readParameters([
      "--input-file",
      "my-package/my-npm-audit-report.json",
      "--output-file",
      "my-package/my-sonarqube-audit-report.json",
      "--package-file",
      "my-package/package.json",
      "-v"
    ]);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
});
