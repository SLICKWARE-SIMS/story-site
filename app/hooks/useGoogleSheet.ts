"use client";

import { useEffect,useState } from "react";

export interface GoogleSheetRow {
  [key: string]: string | number;
}

export interface UseGoogleSheetReturn {
  data: GoogleSheetRow[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to load data from a public Google Spreadsheet
 * IMPORTANT: The spreadsheet must be "Shared" (not published) and viewable to anyone with the link
 *
 * @param spreadsheetId - The ID from the URL: https://docs.google.com/spreadsheets/d/{ID}/edit
 *                        Copy the long string between /d/ and /edit
 * @param sheetName - The name of the sheet to load (default: first sheet, gid=0)
 * @returns Object containing data array, loading state, error, and refresh function
 *
 * Example:
 * const { data, loading, error } = useGoogleSheet('1mPK-k8b7KtA9...', 'Sheet1');
 */
export function useGoogleSheet(
  spreadsheetId: string,
  sheetName: string = "Sheet1"
): UseGoogleSheetReturn {
  const [data, setData] = useState<GoogleSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSheetData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Google Sheets export URL for CSV format
      // Uses the /export endpoint which works with publicly shared sheets
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;

      const response = await fetch(url, {
        headers: {
          Accept: "text/csv",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
      }

      const csvText = await response.text();
      const rows = csvText.split("\n").filter((row) => row.trim());

      if (rows.length === 0) {
        setData([]);
        return;
      }

      // Parse CSV header
      const headers = rows[0]
        .split(",")
        .map((header) => header.trim().replace(/^"|"$/g, ""));

      // Parse data rows
      const parsedData: GoogleSheetRow[] = rows.slice(1).map((row) => {
        const values = parseCSVRow(row);
        const obj: GoogleSheetRow = {};

        headers.forEach((header, index) => {
          obj[header] = values[index] || "";
        });

        return obj;
      });

      setData(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (spreadsheetId) {
      fetchSheetData();
    }
  }, [spreadsheetId, sheetName]);

  return {
    data,
    loading,
    error,
    refresh: fetchSheetData,
  };
}

/**
 * Helper function to parse CSV row handling quoted values
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      // Column separator
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
