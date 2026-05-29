# RAW JSON View and Edit Controls

Within the GUI space for editing AIPP input JSON files there must be a tab to view the JSON itself. 

The tab must be called "RAW JSON" and not "Code"

The JSON editor must have the following charactistics:

1. Scrollable
2. Editable
3. Syntax Highlight
   1. Colors to highlight hierarachy
   2. Syntax highlighting for error checking
4. Collapsible and Expandable
   1. individual chunks of the JSON should be expandable and collapsible.
   2. There should be a button within the window for the JSON code viewer itself to expand and collapse all.
5. Numbering
   1. There should be an intelligent way to identify the number of an item that is in an array of object.
      1. Greyed out label or something like that. This should not get in the way but should be improve readability.
6. An apply button and an undo button must be present within the window for the JSON code viewer itself.
7. A search bar should be available in the json code viewer itself
   1. This should reduce the visible JSON to only the lines that contain the field in the search bar.