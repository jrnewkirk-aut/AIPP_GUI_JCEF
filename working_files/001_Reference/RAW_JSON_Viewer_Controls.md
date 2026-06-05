# RAW JSON View and Edit Controls

Within the GUI space for editing AIPP input JSON files there must be a tab to view the JSON itself. 

The tab must be called "RAW JSON" and not "Code"

The JSON editor must have the following characteristics:

1. Scrollable
2. Editable
3. Syntax Highlight
   1. Colors to highlight hierarchy
   2. Syntax highlighting for error checking
4. Collapsible and Expandable
   1. individual chunks of the JSON should be expandable and collapsible.
   2. There should be a button within the window for the JSON code viewer itself to expand and collapse all.
5. An apply button and an undo button must be present within the window for the JSON code viewer itself.
6. A search bar should be available in the json code viewer itself
   1. This should reduce the visible JSON to only the lines that contain the field in the search bar.
7. The overall window must behave like a standard text editor.
   1. Fields must be editable
   2. You must be able to copy and paste sections of code
      1. If the JSON is not valid there should be an error that appears when you click apply.