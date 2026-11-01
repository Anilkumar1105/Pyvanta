# Pyvanta import-driven visualizations

## What changed
- The visualization template now includes a README sheet with import requirements and JSON examples.
- Imported visualization steps can render SQL table snapshots with column headers, row data, row highlighting, and animated transitions.
- Existing Python visualization types and import workflow remain available.

## SQL table step format
Add a `visualizationSteps` JSON array to a SQL row. Each step can include `note`, `output`, and `visualization`:

```json
[
  {
    "note": "Read the student records.",
    "visualization": {
      "kind": "table",
      "tableName": "students",
      "columns": ["id", "name", "marks"],
      "rows": [[1, "Anu", 85], [2, "Ravi", 72], [3, "Sara", 91]],
      "highlightRows": [2]
    }
  },
  {
    "note": "Keep only marks greater than 80.",
    "visualization": {
      "kind": "table",
      "tableName": "students — filtered",
      "columns": ["id", "name", "marks"],
      "rows": [[1, "Anu", 85], [3, "Sara", 91]]
    }
  }
]
```

`highlightRows` uses zero-based row indexes. `rows` may be arrays matching the `columns` order or objects keyed by column name. The visualizer does not execute arbitrary SQL; provide the correct snapshot for each educational step.

## Deploy
Push `code-visualizations.js`, `code-visualizations.css`, `code-visualizations-admin.js`, and this guide to the existing GitHub Pages deployment. No Firestore migration is required. Use the admin visualization import to import the updated workbook, then publish the program.
