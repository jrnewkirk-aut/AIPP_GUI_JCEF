**## JSON Message Contract

This section will detail message passing requirements and assumptions between Scilab and the browser"

Each section is intended to describe the conditions in the `select` statement within `browserCallback` in `json_viewer.sce`.

It should be noted that the requirements may require action by the AI in the Scilab script as well as in the HTML from the browser.

### Scilab 2025.1.0 bug workarounds

In my testing of the Scilab -> JCEF interface I have found that passing a JSON string from Scilab to the JCEF results in an error where the double quotes are not passed or parsed correctly. This issue is unique to Scilab 2025.1.0

To work around this issue, I have created two functions:
1. `sendSafeJSON`
   - Checks if Scilab is version 2025.1.0. If it is, it converts all double quotes `"` in the string with the longer string: `<-quote->`
2. `receiveSafeJSON`
   - Checks if Scilab is version 2025.1.0. If it is, it converts all `<-quote->` in the message with `"`.
     - Note that the browser side needs to have a way to identify if it needs to send a standard JSON string or if it needs to have `<-quote->`. I have not figured this out yet. Maybe if the browser receives JSON string with `<-quote->` present at any time it flips a boolean and knows to use it from then on.

### JSON message passing protocols

#### json_ascii method

##### Scilab -> Browser
- The required data is accumulated in a scilab structure. 
- The Scilab structure must have `type` as its first field. The type field must have a string that dictates what action is being taken so the browser knows which conditional to execute
- Example
    ```scilab
    s = struct()
    s.type = "plot_xy"
    s.data = [x,y]
    ```
- When the structure is complete, Scilab must convert the structure to json.
  - `json_string = toJSON(s);`
- With the JSON string prepared, the string is then converted to ascii. In scilab the full string can be converted at once.
  - Ex: `ascii_array = asciimat(json_string)`
- A new scilab structure must be created with type `json_ascii` and data containing the newly created ascii_array
  - Ex: 
  ```scilab
  s2 = struct()
  s2.type = "json_ascii"
  s2.data = ascii_array
  ```
- The new structure must then be converted to a string
  - Ex: `jsonOut = toJson(s2)`
- The new string must then be passed through `sendSafeJSON`
  - Ex: `jsonOut = sendSafeJSON(jsonOut)`
    - This checks for 2025.1.0 Scilab version and add the double quote work around if necessary
- `jsonOut` is then added to the browsers `data` field
  - Ex: `set(browser, "data", jsonOut);`
- The browser callback is called
  - Ex: `cb(jsonOut)`

- The browser should now have been sent the message
- The browser needs to check for the presence of `<-quote->` in the passed message
  - If it is present it needs to record that the 2025.1.0 double quote workaround is active.
    - This requires that the `<-quote->` in the input string be replace with `"`
    - This will also require the browser to replace `"` with `<-quote->` prior to sending any JSON to Scilab.
    - If `<-quote->` is not present the JSON string can be parsed as is
- With the double quote checks complete, the browser can then parse the string as a JSON
  - This should have two fields
  1. type
  2. data
  - When `"type"="json_ascii"` the browser should take the double array in `data` and convert it from ascii to a string.
  - This string can then be parsed as JSON.

##### Browser -> Scilab

- Based on the earlier messages from Scilab, the browser should have logic to know whether the json_ascii method is being used and know wether it needs to defensively parse and send the strings. (2025.1.0 bug)
- Data should be sent using the logic outlined above.

#### ascii method (preferred)

This method was developed as a workaround to the string passing issues experienced in Scilab 2025.1.0 and is the preferred method when it is possible.

##### Scilab -> Browser

- The required data is accumulated in a scilab structure. 
- The Scilab structure must have `type` as its first field. The type field must have a string that dictates what action is being taken so the browser knows which conditional to execute
- Example
    ```scilab
    s = struct()
    s.type = "plot_xy"
    s.data = [x,y]
    ```
- When the structure is complete, Scilab must convert the structure to json.
  - `json_string = toJSON(s);`
- With the JSON string prepared, the string is then converted to ascii. In scilab the full string can be converted at once.
  - Ex: `ascii_array = asciimat(json_string)`


- `ascii_array` is then added to the browsers `data` field
  - Ex: `set(browser, "data", ascii_array);`
- The browser callback is called
  - Ex: `cb(ascii_array)`
- The browser must have logic to identify that a simple array of doubles has been sent.
  - This should trigger a conversion from ascii to a string
  - The string should then be parsed as JSON
- This method eliminates the difficult bug handling with double quotes and removes the need to create a structure two separate times.

##### Browser -> Scilab

- When the browser want to send a message to Scilab it must be in JSON format with the `type` field used to trigger the logic within Scilab.
- The `data` field should contain all of the data that is being sent to Scilab.
  - This can be a full JSON file or simpler if need be depending on the case called out in `type`
- The browser must then convert the JSON to a string
- The string must then be converted to an ascii array
- The browser then sends the ascii array to Scilab
- Scilab must have logic to identify that a simple array of doubles has been received.
  - When this is the case it can convert the whole array to a string with one command
    - Ex: `json_string = asciimat(ascii_array)`
- The `json_string` can then be converted to a scilab structure 
  - Ex: `scilab_structure = fromJSON(json_string)`

### Select cases

#### case "select_file"

When "select_file" is sent from the browser to Scilab, Scilab must launch a `uigetdir` and have the user select a directory.

Preferred approach = ascii_method

#### case "select_csv"

When "select_csv" is sent from the browser to Scilab, Scilab must launch a `uigetdir` and have the user select a csv.

Preferred approach = ascii_method


#### case "request_pyrolist"

Preferred approach = ascii_method

#### case "save_json_ascii"

Preferred approach = ascii_method

**