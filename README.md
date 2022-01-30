# audiso

[![AUDISO - DEFAULT](https://github.com/MGuillaumeF/audiso/actions/workflows/default.yml/badge.svg?branch=main)](https://github.com/MGuillaumeF/audiso/actions/workflows/default.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=MGuillaumeF_audiso&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=MGuillaumeF_audiso)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=MGuillaumeF_audiso&metric=coverage)](https://sonarcloud.io/summary/new_code?id=MGuillaumeF_audiso)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=MGuillaumeF_audiso&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=MGuillaumeF_hangman-game)
[![wakatime](https://wakatime.com/badge/user/9f76e922-98e1-4ef0-b832-f1f6bb21d4c3/project/c585b742-afcf-4449-bcd0-d7c4231715bf.svg)](https://wakatime.com/badge/user/9f76e922-98e1-4ef0-b832-f1f6bb21d4c3/project/c585b742-afcf-4449-bcd0-d7c4231715bf)

## description 
This module module convert npm-audit json report to sonarqube generic data issue report

## how to use

### generate npm-audit report (npm>=8)

```
cd project
npm audit --json > audit-dependency-report.json

audiso --package-file=./package.json --input-file=./audit-dependency-report.json --output-file=audit-dependency-report-sonarqube.json
```

### update sonar-project.properties

```
# add package.json in sources index
sonar.sources=src,public,package.json

# add sonarqube report
sonar.externalIssuesReportPaths=audit-dependency-report-sonarqube.json
```
