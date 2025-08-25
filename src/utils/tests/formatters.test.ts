import { expect, test } from "vitest";
import {
  createBytesFormatter,
  createBytesLongFormatter,
  createNodesFormatter,
  createNodesLongFormatter,
  createDurationFormatter,
  createDurationLongFormatter,
  createScoreFormatter,
  createDateFormatter,
  createDatetimeFormatter,
} from "../format";

// Mock i18n object for testing
const mockI18n = {
  t: (key: string, _options?: { lng?: string }) => {
    const translations: Record<string, string> = {
      "Units.Bytes.Bytes": "Bytes",
      "Units.Bytes.BytesLong": "Bytes",
      "Units.Bytes.Kilobytes": "KB",
      "Units.Bytes.Megabytes": "MB",
      "Units.Bytes.Gigabytes": "GB",
      "Units.Bytes.Terabytes": "TB",
      "Units.Bytes.KilobytesLong": "Kilobytes",
      "Units.Bytes.MegabytesLong": "Megabytes",
      "Units.Bytes.GigabytesLong": "Gigabytes",
      "Units.Bytes.TerabytesLong": "Terabytes",
      "Units.Nodes.Thousand": "k",
      "Units.Nodes.Million": "M",
      "Units.Nodes.Billion": "B",
      "Units.Nodes.Trillion": "T",
      "Units.Nodes.Quadrillion": "Q",
      "Units.Nodes.Quintillion": "Qi",
      "Units.Nodes.Nodes": "nodes",
      "Units.Nodes.NodesPerSecond": "nodes/s",
      "Units.Duration.Seconds": "s",
      "Units.Duration.Minutes": "m",
      "Units.Duration.Hours": "h",
      "Units.Duration.Days": "d",
      "Units.Duration.SecondsLong": "seconds",
      "Units.Duration.MinutesLong": "minutes",
      "Units.Duration.HoursLong": "hours",
      "Units.Duration.DaysLong": "days",
      "Units.Score.Mate": "M",
      "Units.Score.DTZ": "DTZ",
      "Units.Score.Centipawns": "cp",
      "Units.Score.CentipawnsLong": "centipawns",
    };
    return translations[key] || key;
  },
  language: "en",
};

// Bytes Formatters
test("createBytesFormatter formats bytes correctly", () => {
  const bytesFormatter = createBytesFormatter(mockI18n);
  expect(bytesFormatter(1024)).toBe("1.00 KB");
  expect(bytesFormatter(1048576)).toBe("1.00 MB");
  expect(bytesFormatter(1073741824)).toBe("1.00 GB");
  expect(bytesFormatter(1099511627776)).toBe("1.00 TB");
  expect(bytesFormatter(512)).toBe("512.00 Bytes");
});

test("createBytesLongFormatter formats bytes with long labels", () => {
  const bytesLongFormatter = createBytesLongFormatter(mockI18n);
  expect(bytesLongFormatter(1024)).toBe("1.00 Kilobytes");
  expect(bytesLongFormatter(1048576)).toBe("1.00 Megabytes");
  expect(bytesLongFormatter(1073741824)).toBe("1.00 Gigabytes");
  expect(bytesLongFormatter(1099511627776)).toBe("1.00 Terabytes");
});

test("bytes formatters handle custom precision", () => {
  const bytesFormatter = createBytesFormatter(mockI18n);
  expect(bytesFormatter(1024, undefined, { decimals: 1 })).toBe("1.0 KB");
  expect(bytesFormatter(1536, undefined, { decimals: 1 })).toBe("1.5 KB");
});

// Nodes Formatters
test("createNodesFormatter formats nodes correctly", () => {
  const nodesFormatter = createNodesFormatter(mockI18n);
  expect(nodesFormatter(1000)).toBe("1k");
  expect(nodesFormatter(1000000)).toBe("1M");
  expect(nodesFormatter(1000000000)).toBe("1B");
  expect(nodesFormatter(1000000000000)).toBe("1T");
  expect(nodesFormatter(1000000000000000)).toBe("1Q");
  expect(nodesFormatter(1000000000000000000)).toBe("1Qi");
  expect(nodesFormatter(500)).toBe("500");
});

test("createNodesLongFormatter formats nodes with long labels", () => {
  const nodesLongFormatter = createNodesLongFormatter(mockI18n);
  expect(nodesLongFormatter(1000)).toBe("1,000 nodes");
  expect(nodesLongFormatter(1000000)).toBe("1,000,000 nodes");
  expect(nodesLongFormatter(1000000000)).toBe("1,000,000,000 nodes");
  expect(nodesLongFormatter(1000000000000)).toBe("1,000,000,000,000 nodes");
});

test("nodes formatters handle sub-1 values", () => {
  const nodesFormatter = createNodesFormatter(mockI18n);
  expect(nodesFormatter(0.5)).toBe("5.00e-1");
  expect(nodesFormatter(0.001)).toBe("1.00e-3");
});

test("nodes formatters handle custom precision", () => {
  const nodesFormatter = createNodesFormatter(mockI18n);
  expect(nodesFormatter(1500)).toBe("1.5k");
  expect(nodesFormatter(1000)).toBe("1k");
});

// Duration Formatters
test("createDurationFormatter formats duration correctly", () => {
  const durationFormatter = createDurationFormatter(mockI18n);
  expect(durationFormatter(1000)).toBe("1s");
  expect(durationFormatter(60000)).toBe("1m");
  expect(durationFormatter(3600000)).toBe("1h");
  expect(durationFormatter(65000)).toBe("1m 5s");
  expect(durationFormatter(3661000)).toBe("1h 1m 1s");
});

test("createDurationLongFormatter formats duration with long labels", () => {
  const durationLongFormatter = createDurationLongFormatter(mockI18n);
  expect(durationLongFormatter(1000)).toBe("1 seconds");
  expect(durationLongFormatter(60000)).toBe("1 minutes");
  expect(durationLongFormatter(3600000)).toBe("1 hours");
  expect(durationLongFormatter(65000)).toBe("1 minutes, 5 seconds");
  expect(durationLongFormatter(3661000)).toBe("1 hours, 1 minutes, 1 seconds");
});

test("duration formatters handle zero duration", () => {
  const durationFormatter = createDurationFormatter(mockI18n);
  const durationLongFormatter = createDurationLongFormatter(mockI18n);
  expect(durationFormatter(0)).toBe("0s");
  expect(durationLongFormatter(0)).toBe("0 seconds");
});

// Score Formatters
test("createScoreFormatter formats CP scores correctly", () => {
  const scoreFormatter = createScoreFormatter(mockI18n);
  expect(scoreFormatter({ type: "cp", value: 150 })).toBe("+1.50");
  expect(scoreFormatter({ type: "cp", value: -75 })).toBe("-0.75");
  expect(scoreFormatter({ type: "cp", value: 0 })).toBe("0.00");
});

test("createScoreFormatter formats mate scores correctly", () => {
  const scoreFormatter = createScoreFormatter(mockI18n);
  expect(scoreFormatter({ type: "mate", value: 5 })).toBe("+M5");
  expect(scoreFormatter({ type: "mate", value: -3 })).toBe("-M3");
});

test("createScoreFormatter formats DTZ scores correctly", () => {
  const scoreFormatter = createScoreFormatter(mockI18n);
  expect(scoreFormatter({ type: "dtz", value: 10 })).toBe("DTZ10");
  expect(scoreFormatter({ type: "dtz", value: -5 })).toBe("DTZ5");
});

test("score formatter handles custom precision", () => {
  const scoreFormatter = createScoreFormatter(mockI18n);
  expect(scoreFormatter({ type: "cp", value: 150 }, undefined, { precision: 1 })).toBe("+1.5");
  expect(scoreFormatter({ type: "cp", value: 150 }, undefined, { precision: 3 })).toBe("+1.500");
});

// Language Support
test("formatters respect language parameter", () => {
  const frenchI18n = {
    t: (key: string, _options?: { lng?: string }) => {
      const translations: Record<string, string> = {
        "Units.Bytes.Kilobytes": "Ko",
        "Units.Bytes.Megabytes": "Mo",
        "Units.Bytes.Gigabytes": "Go",
        "Units.Bytes.Terabytes": "To",
        "Units.Nodes.Thousand": "k",
        "Units.Nodes.Million": "M",
        "Units.Score.Mate": "M",
        "Units.Score.DTZ": "DTZ",
      };
      return translations[key] || key;
    },
    language: "fr",
  };

  const bytesFormatter = createBytesFormatter(frenchI18n);
  expect(bytesFormatter(1024, "fr")).toBe("1.00 Ko");
  expect(bytesFormatter(1048576, "fr")).toBe("1.00 Mo");
});

test("formatters fallback to i18n language", () => {
  const frenchI18n = {
    t: (key: string, _options?: { lng?: string }) => {
      const translations: Record<string, string> = {
        "Units.Bytes.Kilobytes": "Ko",
        "Units.Bytes.Megabytes": "Mo",
        "Units.Bytes.Gigabytes": "Go",
        "Units.Bytes.Terabytes": "To",
        "Units.Nodes.Thousand": "k",
        "Units.Nodes.Million": "M",
        "Units.Score.Mate": "M",
        "Units.Score.DTZ": "DTZ",
      };
      return translations[key] || key;
    },
    language: "fr",
  };

  const bytesFormatter = createBytesFormatter(frenchI18n);
  expect(bytesFormatter(1024)).toBe("1.00 Ko");
});

// Edge Cases
test("handles zero values", () => {
  const bytesFormatter = createBytesFormatter(mockI18n);
  const nodesFormatter = createNodesFormatter(mockI18n);
  const durationFormatter = createDurationFormatter(mockI18n);
  const scoreFormatter = createScoreFormatter(mockI18n);

  expect(bytesFormatter(0)).toBe("0 Bytes");
  expect(nodesFormatter(0)).toBe("0.00e+0");
  expect(durationFormatter(0)).toBe("0s");
  expect(scoreFormatter({ type: "cp", value: 0 })).toBe("0.00");
});

test("handles very large values", () => {
  const bytesFormatter = createBytesFormatter(mockI18n);
  const nodesFormatter = createNodesFormatter(mockI18n);

  expect(bytesFormatter(Number.MAX_SAFE_INTEGER)).toBe("8192.00 TB");
  expect(nodesFormatter(Number.MAX_SAFE_INTEGER)).toBe("9.0Q");
});

test("handles negative values appropriately", () => {
  const bytesFormatter = createBytesFormatter(mockI18n);
  const nodesFormatter = createNodesFormatter(mockI18n);
  const scoreFormatter = createScoreFormatter(mockI18n);

  expect(bytesFormatter(-1024)).toBe("1.00 KB"); // Absolute value
  expect(nodesFormatter(-1000)).toBe("1k"); // Absolute value
  expect(scoreFormatter({ type: "cp", value: -150 })).toBe("-1.50"); // Preserves sign
});

// Date Formatters
test("createDateFormatter formats dates correctly", () => {
  const testDate = new Date("2025-08-23T12:00:00Z");

  // Test default mode (no storage provided) - should default to intl
  const defaultDateFormatter = createDateFormatter(mockI18n);
  const defaultResult = defaultDateFormatter(testDate, "en", { timeZone: "UTC" });
  expect(typeof defaultResult).toBe("string");
  expect(defaultResult).toBe("2025-08-23"); // International format (default)

  // Test locale mode
  const mockLocaleStorage = {
    getItem: (key: string) => (key === "dateFormatMode" ? "locale" : null),
  };
  const localeDateFormatter = createDateFormatter(mockI18n, mockLocaleStorage as Storage);
  const localeResult = localeDateFormatter(testDate, "en", { timeZone: "UTC" });
  expect(typeof localeResult).toBe("string");
  expect(localeResult).toBe("8/23/25"); // Locale format

  // Test international mode
  const mockIntlStorage = {
    getItem: (key: string) => (key === "dateFormatMode" ? "intl" : null),
  };
  const intlDateFormatter = createDateFormatter(mockI18n, mockIntlStorage as Storage);
  const intlResult = intlDateFormatter(testDate, "en", { timeZone: "UTC" });
  expect(typeof intlResult).toBe("string");
  expect(intlResult).toBe("2025-08-23"); // International format
});

test("createDatetimeFormatter formats datetimes correctly", () => {
  const testDate = new Date("2025-08-23T13:55:00Z");

  // Test default mode (no storage provided) - should default to intl
  const defaultDatetimeFormatter = createDatetimeFormatter(mockI18n);
  const defaultResult = defaultDatetimeFormatter(testDate, "en", { timeZone: "UTC" });
  expect(typeof defaultResult).toBe("string");
  expect(defaultResult).toBe("2025-08-23, 13:55"); // International format (default)

  // Test locale mode
  const mockLocaleStorage = {
    getItem: (key: string) => (key === "dateFormatMode" ? "locale" : null),
  };
  const localeDatetimeFormatter = createDatetimeFormatter(mockI18n, mockLocaleStorage as Storage);
  const localeResult = localeDatetimeFormatter(testDate, "en", { timeZone: "UTC" });
  expect(typeof localeResult).toBe("string");
  expect(localeResult).toBe("08/23/2025, 13:55"); // Locale format

  // Test international mode
  const mockIntlStorage = {
    getItem: (key: string) => (key === "dateFormatMode" ? "intl" : null),
  };
  const intlDatetimeFormatter = createDatetimeFormatter(mockI18n, mockIntlStorage as Storage);
  const intlResult = intlDatetimeFormatter(testDate, "en", { timeZone: "UTC" });
  expect(typeof intlResult).toBe("string");
  expect(intlResult).toBe("2025-08-23, 13:55"); // International format
});

test("date formatters handle non-Date values", () => {
  const mockStorage = {
    getItem: (key: string) => (key === "dateFormatMode" ? "locale" : null),
  };
  const dateFormatter = createDateFormatter(mockI18n, mockStorage as Storage);
  const datetimeFormatter = createDatetimeFormatter(mockI18n, mockStorage as Storage);

  expect(dateFormatter("not a date", "en")).toBe("not a date");
  expect(datetimeFormatter(123, "en")).toBe("123");
  expect(dateFormatter(null, "en")).toBe("null");
});