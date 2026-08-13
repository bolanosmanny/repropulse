import { XMLParser } from 'fast-xml-parser';

export type ParsedTestOutcome = "passed" | "failed" | "skipped" | "error";

export type ParsedJUnitTest = { 
    suiteName: string;
    className: string;
    testName: string;
    outcome: ParsedTestOutcome;
    durationMs: number | null;
    failureType: string | null;
    failureMessage: string | null;
    sourceFile: string | null;
};

type XmlObject = Record<string, unknown>;

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    trimValues: true,
});

function asObject(value: unknown): XmlObject | null { 
    if (typeof value !== "object" || value === null || Array.isArray(value)) { 
        return null;
    }
    return value as XmlObject;
}

function asArray(value: unknown): unknown[] { 
    if (value === undefined) { 
        return [];
    }

    return Array.isArray(value) ? value: [value];
}

function getStringValue(value: unknown): string | null { 
    if (typeof value === "string") { 
        return value;
    }

    const objectValue = asObject(value);

    if ( 
        objectValue !== null && 
        typeof objectValue["#text"] === "string"
    ) { 
        return objectValue["#text"];
    }
    return null;
}

function getAttribute(
    xmlObject: XmlObject,
    attributeName: string 
): string | null { 
    const value = xmlObject[attributeName];

    return typeof value === "string" ? value : null;
}

function getDurationMs(testCase: XmlObject): number | null { 
    const timeInSeconds = getAttribute(testCase, "time");

    if (timeInSeconds === null) { 
        return null;
    }

    const parsedSeconds = Number(timeInSeconds);

    if (!Number.isFinite(parsedSeconds) || parsedSeconds < 0) { 
        return null;
    }

    return Math.round(parsedSeconds * 1000);
}

function getFailureDetails(testCase: XmlObject): { 
    outcome: ParsedTestOutcome;
    failureType: string | null;
    failureMessage: string | null;
} { 
    if ("failure" in testCase) { 
        const failure = asObject(testCase.failure);

        return { 
            outcome: "failed",
            failureType: failure ? getAttribute(failure, "type") : null,
            failureMessage: getStringValue(testCase.failure),
        };
    }

    if ("error" in testCase) { 
        const error = asObject(testCase.error);

        return { 
            outcome: "error",
            failureType: error ? getAttribute(error, "type") : null,
            failureMessage: getStringValue(testCase.error),
        };
    }

    if ("skipped" in testCase) {
        return { 
            outcome: "skipped",
            failureType: null,
            failureMessage: null,
        };
    }

    return { 
        outcome: "passed",
        failureType: null,
        failureMessage: null,
    };
}

function collectTestsFromSuite(
    suite: XmlObject,
    parsedTests: ParsedJUnitTest[] = []
) : void { 
    const suiteName = getAttribute(suite, "name") ?? "unknown";

    for (const testCaseValue of asArray(suite.testcase)) {
        const testCase = asObject(testCaseValue);

        if (testCase === null) { 
            throw new Error("Invalid test case must be an XML object");
        }

        const testName = getAttribute(testCase, "name");

        if (testName === null || testName.length === 0) { 
            throw new Error("JUnit test case is missing a name");
        }

        const failureDetails = getFailureDetails(testCase);

        parsedTests.push({
            suiteName,
            className: getAttribute(testCase, "classname") ?? "",
            testName,
            durationMs: getDurationMs(testCase),
            ...failureDetails,
            sourceFile: getAttribute(testCase, "file"),
        });
    }

    for (const nestedSuiteValue of asArray(suite.testsuite)) { 
        const nestedSuite = asObject(nestedSuiteValue);

        if (nestedSuite !== null) { 
            collectTestsFromSuite(nestedSuite, parsedTests);
        }
    }
}

export function parseJUnitXml(xml: string): ParsedJUnitTest[] { 
    const document = asObject(xmlParser.parse(xml));

    if (document === null) { 
        throw new Error("Invalid JUnit XML document");
    }

    const root = asObject(document.testsuites) ?? document;
    const suites = asArray(root.testsuite);

    if (suites.length === 0) {
        throw new Error("JUnit XML contains no test suites");
    }

    const parsedTests: ParsedJUnitTest[] = [];

    for (const suiteValue of suites) { 
        const suite = asObject(suiteValue);

        if (suite === null) { 
            throw new Error("JUnit test suite must be an XML object");
        }

        collectTestsFromSuite(suite, parsedTests);
    }

    return parsedTests;
}