# AIPP GUI Controls

This document is intended to create a more continuous memory and ensure that features are maintained and carried over between versions developed by an AI Agent.

**The AIPP User guide is a great resource for how the input deck is parsed and should be referenced when developing new features.**

## General instructions

The basis of the GUI interface is the JSON input file. If the input JSON has a key, it needs to be included in the pop up. There is no need for fancy logic for unknown keys but they must have a entry in the pop up that is a basic editable window. This allows for flexibility in the GUI as new features are added or allows for dummy keywords that can be used to aid in documentation

## HTML protocol

HTML needs to  be developed with modules according to the instructions in `HTML_Handling.md`. To be clear; every time the Scilab script runs it builds all of the modular HTML, CSS and Java files into one file that can be opened as a JCEF browser in Scilab. This file is retained in `/browser_files/dist/bundle.html`.

## Scilab and JCEF rules

Scilab code and the JCEF browser development and communication must follow the guidelines in `Scilab_JCEF_rules.md`

## AIPP3 User Guide

A comprehensive markdown document already exists with a user guide for AIPP. This GUI is intended to interface with the JSON files for AIPP and the user guide, `AIPP3_UserGuide.md`,should be referenced when developing new features.

## Pop Up Interfaces

### Chamber

`chambers` in the model are an array of 2 or more chamber objects. 

The most basic chamber has an initialization and a mol fraction. This defines the mixture

```json
{
    "label": "Initiator_______________________________",
    "init_type": "PVT",
    "volume": "1500 mm^3",
    "temperature": "294.15 K",
    "pressure": "101325 Pa",
    "mol_fractions": {
    "N2": 0.8,
    "O2": 0.2
    }
}
```

The mixture within a chamber is not named object but is the collection of fields that are not **pyro** or **filter** within a chamber.

These fields are...

* **label** (optional) - a label for the chamber.
* **init_type** - the type of initialization used to prepare the enclosed mixture in a thermodynamic equilibrium state. It must be one of the following options:
    * **"mPT"** - use *mass*, *pressure*, and *temperature* to specify the state.
    * **"PVT"** - use *pressure*, *volume*, and *temperature* to specify the state.
    * **"mVT"** - use *mass*, *volume*, and *temperature* to specify the state.
    * **"nVT"** - use *moles*, *volume*, and *temperature* to specify the state.
    * **"rho_mVT"** - use *mass-density*, *volume*, and *temperature* to specify the state.
* **mol_fractions** - the composition of the enclosed mixture described using mole fractions.
* **temperature** - the temperature of the mixture at thermodynamic equilibrium.
* **volume** (optional) - the total volume of the chamber containing the mixture.
    * NOTE: *this is the volume in the absence of any other objects occupying space (pyros and/or filters), the volume occupied by the mixture will be the difference between this value and the total volumes of pyros and filters.*
* **mass** (optional) - the total mass of the mixture.
* **density** (optional) - mass-density of the mixture.
* **moles** (optional) - the total amount of the mixture.
* **pressure** (optional) - the total pressure of the mixture.

This means that **at a minimum** the following keys are required for a chamber and must be included in the chamber pop up:

- init_type
  - child keys will vary based on init_type selection.
  - The pop up must have a smart way of selecting the init_type and updated the child keys correctly
- mol_fractions
  - these must include the standard species and must add up to one.
    - standard species: Ar, CO, CO2, H2, H2O, He, N2, N2O, O2.
  - The pop up must have tools to normalize to one, and to add a custom row with another species as an option.

Label should be added to the pop up menu as the very first entry to make it easy for the user. The default value can be blank. If no value is added, the key `label` should not be added to the JSON for the chamber. 

#### Pyro

Chambers can optionally have one or more pyros. These are input as an array of pyros under the `pyro` keyword

Example: 

```json
{
    "label": "Initiator_______________________________",
    "init_type": "PVT",
    "volume": "1500 mm^3",
    "temperature": "294.15 K",
    "pressure": "101325 Pa",
    "mol_fractions": {
    "N2": 0.8,
    "O2": 0.2
    },
    "pyro": [
    {
        "formulation": "MNP358B1Production_20250528",
        "mass": "39.5 g",
        "piles": 1,
        "flame_spread_time": "0.0 ms",
        "ignition_time": {
        "triggering_event": "SimStart",
        "time_delay": "0.001 s"
        },
        "shape": {
        "geometry": "tablet",
        "total_height": "2.2 mm",
        "diameter": "5.7 mm",
        "dome_height": "0.08 mm"
        },
        "burn_rate_modifications": {
        "reference_burn_rate": "20.61 mm/s",
        "burn_rate_temperature_sensitivity": "0.00155 1/K"
        }
    }
    ]
}
```

A pyro is not required in the chamber. The chamber pop up must have tools to both remove a pyro from a chamber and add a pyro to a chamber. There is no limit on the number of pyros allowed in a chamber.

##### Pyrolist population

An exhaustive pyro list already exists for the program that will run this input file. 

If the directory where the main scilab program resides is /root the pyrolist is located in /root/aipp_files/pyrolist.json

Scilab must read in this file,parse it, and pass it to the browser using the appropriate methods called out in the README for the Scilab->JCEF connection.

Mandatory pyro inputs:

- formulation: pyro formulation called out in the pyrolist file.
  - The pop up for the chambers must have a utility to select the formulation from the pyro list.This utility must have a drop down to select from the full list and it must be searchable as well so the user can refine the list by typing.
  - There must also be a way to inspect the formulation in the pop up.
    - There should be an "i" button for information.
      - Hovering over the "i" should give a light preview of all the information for that formulation
      - clicking the "i" should expand and give a nice looking overview of the information for the pyro
- piles: this must be an integer number from 1-N
- ignition time: this is dependent on an event and has the following child components.
  - triggering_event
    - The default event is "SimStart" alternative events should be identified from reading the AIPP user guide and a drop down should be available to select from different events. There should also be the option to manually type a custom event
  - time_delay: string with a double followed by time units. Ex. "0.001 s"

- shape:
  - the shape should be selectable by a drop down box. the child components will change based on the shape selection. The configurations for the shape should be pulled from the User Guide
- burn_rate_modifications:
  - This is tricky because the burn_rate_modifications key is optional. In addition, it can have 1-N child keys.
  - For the pyro section in the chamber pop up the burn rate modifications must be handled as follows:
    - A collapsible burn_rate_modifications section must be present
    - The collapsible section must contain these options:
      - reference_burn_rate (optional) - an alternative reference burn rate that overrides the baseline value.
      - burn_rate_exponent (optional) - an alternative burn rate exponent that overrides the baseline value.
      - temperature_sensitivity (optional) - an alternative temperature sensitivity that overrides the baseline value.
      - reference_burn_rate_scaling (optional) - a scaling applied to the baseline value of the reference burn rate.burn_rate_exponent_scaling (optional) - a scaling 
      - applied to the baseline value of the burn rate rate exponent.
      - temperature_sensitivity_scaling (optional) - a scaling applied to the baseline value of the temperature sensitivity.
      - pressure_units (optional) - units for the pressure array when using a lookup table.
      - burn_rate_units (optional) - units for the burn rate array when using a lookup table.
      - pressure_array (optional) - an array of pressure values.
      - burn_rate_array (optional) - an array of burn rate values.
    - Each option must have a check box next to it, if the checkbox is not selected the option should be greyed out.
    - If the input JSON already has some of the optional keys they should be selected automatically and editable
    - If no modifications are present the key does not need to be added to the JSON.

Quantities
- the quantity can be prescribed as either a mass or a number. This is to allow for selection of 1-N of the pyro shape outlined in the "shape" keyword.
  - There must be a smart selector in the pop up that lets you select either a mass or a quantity.

#### Filters

A chamber can optionally have a filter. If there are no filters the filter key does not need to be included in the JSON.

Each chamber pop up must have the option to add a filter or remove an existing filter. There is no limit to the number of filters in a chamber.

Required keys:

- material: this will be a string.
  - the default should always be "steel" when creating a new filter
- mass: this is a string that contains a double value and a unit. 
  - Ex: "0.0 g" (set the default to 0.0 when creating a new one)
- method: string value to select an options
  - Options: "PERCENTAGE", "KNTU"
    - There must be a smart selector drop down menu to select which method to use.
- coefficient: double value
  - set the default as 0.0 when creating a new filter
    - This must be written to the JSON as a double value
- orifices:
  - an array of 1-N integers this allows for a filter to be connected to more than one orifice
  - Ex: single connection. "orifices": [4]
  - Ex: multiple connection. "orifices": [4, 6, 7]
    - The pop up should list the current orifices as a number in the orifices section. There should be a checkbox system to select which orifices the filter is connected to.
      - **Important**: an orifice should only be able to be selected if it's "from" connection is connected to that chamber. If it is not connected to that chamber on its "from" side, the filter would not be able to interact with that filter in reality.

### Orifice

Mandatory keys will be listed in the order that they should be shown in the orifice pop up. 

- label: This is an optional key. It should be blank if it is not present in the JSON input. If it remains blank it should not be written to the JSON.
- diameter: a string containing a double and a unit
  - Ex: "1.0 mm"
  - We shouldn't ever use a different unit that mm. It is okay to hard code mm and just let the user type in the diameter value in the box.
- from: an integer value
  - the chamber that is on the from side for the orifice
- to: an integer value
  - the chamber that is on the to side of the orifice.
- viscous_flow_factor: a double value
  - This should be limited to [0.0-1.0]
    - The user should be able to type the value in a box.
    - There should also be a slider than can either be manually dragged or adjusted with the mouse scroll wheel to adjust the value within the limits.
    - The default value should be zero when making a new orifice.
- open: a boolean
  - This should be a toggle that lets you toggle between true or false. The default value should be false
- one_way: a boolean
  - This should be a toggle that lets you toggle between true or false. The default value should be false
  - if one_way is false, the flow chart should show arrows on both connecting nodes of te line between the orifice and the chamber
  - if one_way is true, the flow chart should only show an arrow on the "to" node.
- opens_at: this value will depend on what is listed.
  - The orifice pop up GUI should have a selector with two options: "pressure" and "event_based"
  - If pressure is selected, the keyword will have a string containing a double and a pressure unit.
    - Ex: "opens_at": "1.0 MPa"
    - The GUI should have a selector for pressure units and a box to allow input of the double value. If an integer is used the GUI must write it to the JSON string as a double.
      - Pressure unit selector options: ["MPa", "KPa", "Pa"]
  - if event_based is selected the opens_at will have child components of triggering_event and time_delay.
    - Ex:
    ```JSON
    "opens_at": {
            "triggering_event": "SimStart",
            "time_delay": "0.05 s"
          }
    ```
    - triggering_event must have the option to use a custom string. This allows for new development and currently unknown options.
      - There also must be a drop down selector with options for the triggering event. This should be identified from the AIPP user guide
      - the default event should be "SimStart"
    - time_delay is a string with a double and a unit
      - The double must be written to the JSON string a double even if the user uses and integer
      - the units must be selectable from a drop down with options of ["ms" and "s"]
        - The default should be "ms"
- Cd is the discharge coefficient its keys will depend on the selection of the basis.
  - The basis should be selectable from a drop down menu
    - Options: ["constant", "time", "pressure"]
      - "constant"
        - will have the child key: "Cd_value" which is a double value
          - This should default to 1.0
            - The value should not exceed 1.0
            - The user should be able to type it in a box
            - The user should be able to adjust it by grabbing or scrolling on a slider to adjust within its limits
    - "time"
      - will have child keys:
        - time_units - the time units used for the time array.
          - selectable from a drop down menu
            - options: ["ms", "s"]
              - default: "ms"
        - time_array - the times relative to when the orifice opened.
          - an array of double values
            - must be monotonically increasing
        - Cd_array - the discharge coefficient at the listed times.
          -  - an array of double values
        - continuity - the scheme used to calculate values between the listed points.
          - must be set with a toggle with the left side being "discrete" and the right side being "interpolate"
    - "pressure"
      - will have child keys:
        - pressure_units - the time units used for the time array.
          - selectable from a drop down menu
            - options: ["MPa", "KPa", "Pa"]
              - default: "MPa"
        - pressure_array - the pressure differentials.
          - an array of double values
            - must be monotonically increasing
        - Cd_array - the discharge coefficient at the listed pressures.
          -  - an array of double values
        - continuity - the scheme used to calculate values between the listed points.
          - must be set with a toggle with the left side being "discrete" and the right side being "interpolate"
    - inputs for "time" and "pressure"
      - instead of having a basic json input cell for pressure/time_array and Cd_array a table must be used
      - The table will have two columns
        - column 1: x values
          - depending on the selection this will be either time or pressure values
        - column 2: y_values
          - This will be the Cd_array values
      - The table must have an option to read in the data from a CSV
        - The CSV will have two columns
          - Column 1:
            - Row 1: x_units
              - These must match the units selected by the user in the GUI, otherwise a pop up message should appear explaining the issue and asking for a correction
            - Rows 2:N
              - These will be the x values for the table
          - Column 2:
            - Row 1: x_units
              - These must match the units selected by the user in the GUI, otherwise a pop up message should appear explaining the issue and asking for a correction
              - In the case of the Cd the units should not matter so no error is required
            - Rows 2:N
              - These will be the y values for the table

### Wall

Walls in the model are an array of wall objects under the `walls` keyword in the assembly.

Walls are used to model heat transfer boundaries or heat transfer paths between chambers, the environment, and/or other walls. A wall can represent a physical wall with material, area, thickness, and temperature information, or it can act as part of a chained heat-transfer definition depending on its connection objects.

Each wall has two connection objects:

- `left_connection`
- `right_connection`

The connection objects define what the wall is thermally connected to on each side.

Example:

{
 "label": "Initiator wall",
 "temperature": "294.15 K",
 "area": "10.0 cm^2",
 "thickness": "1.0 mm",
 "material": "steel",
 "left_connection": {
  "type": "CONSTANT_TEMPERATURE",
  "temperature": "294.15 K"
 },
 "right_connection": {
  "type": "CONSTANT_COEFFICIENT",
  "chamber_index": 1,
  "heat_transfer_coefficient": "1.0E+2 W/(m^2 K)"
 }
}

A wall is not required in every model. The GUI must have tools to add a wall to the assembly and remove an existing wall from the assembly. There is no limit on the number of walls allowed in the assembly.

Mandatory keys should be listed in the order they should be shown in the wall pop up.

- label:
  - This is an optional key.
  - It should be blank if it is not present in the JSON input.
  - If it remains blank it should not be written to the JSON.
  - The label should be the first item in the wall pop up.

- temperature:
  - This is a string containing a double value and a temperature unit.
  - Example: `"294.15 K"`
  - This should be editable as a text box.
  - The default value when creating a new wall should be `"294.15 K"`.

- area:
  - This is a string containing a double value and an area unit.
  - Example: `"1.0 cm^2"`
  - This should be editable as a text box.
  - The default value when creating a new wall should be `"1.0 cm^2"`.

- thickness:
  - This is a string containing a double value and a length unit.
  - Example: `"1.0 mm"`
  - This should be editable as a text box.
  - The default value when creating a new wall should be `"1.0 mm"`.

- material:
  - This is a string.
  - The default value when creating a new wall should be `"steel"`.
  - The GUI can initially use a basic text box.
  - In the future this should be connected to the materials list if the materials file is passed into the browser.

- left_connection:
  - This is a required connection object.
  - The GUI must provide a smart editor for this object.
  - The first entry in the connection editor must be a `type` selector.
  - The child keys shown in the connection editor must change based on the selected `type`.

- right_connection:
  - This is a required connection object.
  - The GUI must provide a smart editor for this object.
  - The first entry in the connection editor must be a `type` selector.
  - The child keys shown in the connection editor must change based on the selected `type`.

#### Wall connection types

Each wall connection must have a `type` key.

The `type` key should be selected using a drop down menu with the following options:

- `"CONSTANT_TEMPERATURE"`
- `"CONSTANT_HEAT"`
- `"WALL"`
- `"CONSTANT_COEFFICIENT"`
- `"VARIABLE_COEFFICIENT"`

The child keys for the connection object depend on the selected `type`.

##### CONSTANT_TEMPERATURE

This connection type represents a boundary held at a constant temperature.

Example:

{
 "type": "CONSTANT_TEMPERATURE",
 "temperature": "294.15 K"
}

Required keys:

- type:
  - Must be `"CONSTANT_TEMPERATURE"`.

- temperature:
  - This is a string containing a double value and a temperature unit.
  - Example: `"294.15 K"`
  - This should be editable as a text box.
  - The default value should be `"294.15 K"`.

When this type is selected in the GUI, only the `temperature` child input should be shown under the type selector, unless unknown keys already exist in the JSON.

##### CONSTANT_HEAT

This connection type represents a boundary with a constant heat transfer rate.

Example:

{
 "type": "CONSTANT_HEAT",
 "heat": "0.0 W"
}

Required keys:

- type:
  - Must be `"CONSTANT_HEAT"`.

- heat:
  - This is a string containing a double value and a power unit.
  - Example: `"0.0 W"`
  - This should be editable as a text box.
  - The default value should be `"0.0 W"`.

When this type is selected in the GUI, only the `heat` child input should be shown under the type selector, unless unknown keys already exist in the JSON.

##### WALL

This connection type connects one wall to another wall.

Example:

{
 "type": "WALL",
 "wall_index": 2
}

Required keys:

- type:
  - Must be `"WALL"`.

- wall_index:
  - This is an integer value.
  - This identifies the wall connected to this side of the current wall.
  - The GUI should provide a drop down selector populated with the current wall indices.
  - The GUI should also allow manual integer entry if needed for flexibility.
  - The value should be written to JSON as an integer.

When this type is selected in the GUI, only the `wall_index` child input should be shown under the type selector, unless unknown keys already exist in the JSON.

The GUI should warn the user if a wall is connected to itself. Ideally, this should be blocked or highlighted as an invalid connection.

##### CONSTANT_COEFFICIENT

This connection type connects the wall to a chamber using a constant heat transfer coefficient.

Example:

{
 "type": "CONSTANT_COEFFICIENT",
 "chamber_index": 1,
 "heat_transfer_coefficient": "1.0E+2 W/(m^2 K)"
}

Required keys:

- type:
  - Must be `"CONSTANT_COEFFICIENT"`.

- chamber_index:
  - This is an integer value.
  - This identifies the chamber connected to this side of the wall.
  - The GUI should provide a drop down selector populated with the current chamber indices.
  - The GUI should also allow manual integer entry if needed for flexibility.
  - The value should be written to JSON as an integer.

- heat_transfer_coefficient:
  - This is a string containing a double value and heat-transfer-coefficient units.
  - Example: `"1.0E+2 W/(m^2 K)"`
  - This should be editable as a text box.
  - The default value should be `"1.0E+2 W/(m^2 K)"`.

When this type is selected in the GUI, the `chamber_index` and `heat_transfer_coefficient` child inputs should be shown under the type selector, unless unknown keys already exist in the JSON.

##### VARIABLE_COEFFICIENT

This connection type connects the wall to a chamber using a variable heat transfer coefficient model.

Example:

{
 "type": "VARIABLE_COEFFICIENT",
 "chamber_index": 1,
 "scale_factor": 1.0
}

Required keys:

- type:
  - Must be `"VARIABLE_COEFFICIENT"`.

- chamber_index:
  - This is an integer value.
  - This identifies the chamber connected to this side of the wall.
  - The GUI should provide a drop down selector populated with the current chamber indices.
  - The GUI should also allow manual integer entry if needed for flexibility.
  - The value should be written to JSON as an integer.

- scale_factor:
  - This is a double value.
  - The default value should be `1.0`.
  - The value should be written to JSON as a number, not as a string.

When this type is selected in the GUI, the `chamber_index` and `scale_factor` child inputs should be shown under the type selector, unless unknown keys already exist in the JSON.

#### Wall pop up behavior

The wall pop up should use the following order:

- label
- temperature
- area
- thickness
- material
- left_connection
- right_connection
- additional wall keys

The `left_connection` and `right_connection` sections should each be collapsible or visually grouped so the user can clearly understand which side of the wall is being edited.

Each connection section must have:

- a `type` selector
- dynamic child inputs based on the selected type
- a basic editable section for unknown keys already present in the connection object

If the user changes the connection type, the GUI should replace the known child keys for the previous type with the default child keys for the selected type. Unknown keys should not be silently deleted unless the user explicitly removes them.

#### Wall graph behavior

Walls should be shown in the assembly graph as wall nodes.

Wall graph connections should be shown as dashed connections.

If a wall connection references a chamber using `chamber_index`, the graph should show a dashed connection between the wall and the referenced chamber.

If a wall connection references another wall using `wall_index`, the graph should show a dashed connection between the current wall and the referenced wall.

The graph does not need arrows for wall connections unless a future version of AIPP defines a directional wall convention.

#### Adding a wall

When a new wall is created from the GUI, the default wall should be:

{
 "label": "New Wall",
 "temperature": "294.15 K",
 "area": "1.0 cm^2",
 "thickness": "1.0 mm",
 "material": "steel",
 "left_connection": {
  "type": "CONSTANT_TEMPERATURE",
  "temperature": "294.15 K"
 },
 "right_connection": {
  "type": "CONSTANT_TEMPERATURE",
  "temperature": "294.15 K"
 }
}

The wall should be appended to the `walls` array.

After the wall is added, the GUI should open the wall pop up automatically so the user can immediately edit the wall.

#### Removing a wall

The GUI must support removing a wall from the `walls` array.

Before removing a wall, the GUI should scan for dependencies.

The dependency scan should check:

- other walls with `left_connection.type = "WALL"` and matching `wall_index`
- other walls with `right_connection.type = "WALL"` and matching `wall_index`
- wall indices greater than the removed wall index that may need to be shifted down by one

If another wall directly references the wall being removed, the GUI should block removal or require the user to reassign the connection before removal.

If a wall index is greater than the removed wall index, the GUI can automatically remap the index down by one, but the user should be shown a preview of the change before it is applied.

#### Unknown wall keys

The GUI must preserve unknown wall keys.

If a wall object contains a key that is not handled by the smart wall editor, the key must still appear in the wall pop up under an `additional wall keys` section.

The additional wall keys section does not need smart logic.

The section can use a basic editable field for each unknown key.

Examples of unknown keys that must be preserved:

{
 "label": "Wall with documentation key",
 "temperature": "294.15 K",
 "area": "1.0 cm^2",
 "thickness": "1.0 mm",
 "material": "steel",
 "documentation_note": "This is a user-defined note.",
 "left_connection": {
  "type": "CONSTANT_TEMPERATURE",
  "temperature": "294.15 K"
 },
 "right_connection": {
  "type": "CONSTANT_TEMPERATURE",
  "temperature": "294.15 K"
 }
}

#### Topology Add / Remove / Dependency Management

The assembly topology is made up of arrays of chambers, orifices, and walls.

These arrays are located under the `assembly` keyword:

{
 "assembly": {
  "chambers": [...],
  "orifices": [...],
  "walls": [...]
 }
}

The GUI currently supports adding new topology entities from the top toolbar using the `Add` menu.

The current add menu includes:

- Add Chamber
- Add Orifice
- Add Wall

The GUI also has infrastructure for removing topology entities through the entity pop up.

The remove workflow is especially important because several JSON fields reference topology items by array index. If an item is removed, index-based references may need to be blocked, remapped, or manually repaired.

##### General topology rules

Topology entities are referenced using one-based indices in the JSON input file.

Examples:

- Chamber 1 is referenced as `1`
- Orifice 1 is referenced as `O1` in event strings
- Wall 1 is referenced as `1`

This means that if an object is removed from the middle of an array, all references to objects after that removed index may need to shift down by one.

Example:

If Chamber 2 is removed:

- Chamber 3 becomes Chamber 2
- Chamber 4 becomes Chamber 3
- Orifice `from` / `to` references greater than 2 must shift down by one
- Wall chamber references greater than 2 must shift down by one
- Event strings such as `C3P1_ignited` may need to become `C2P1_ignited`

The GUI must never silently delete or corrupt index-based dependencies.

##### Add behavior currently implemented

The current add behavior is append-only.

This means new items are added to the end of the corresponding array:

- New chambers are appended to `assembly.chambers`
- New orifices are appended to `assembly.orifices`
- New walls are appended to `assembly.walls`

Since the add operation is append-only, no existing indices need to be shifted when adding a new item.

After a new topology item is added:

- the JSON model is updated in memory
- the tree view is refreshed
- the code editor is refreshed
- the graph is refreshed
- the newly created entity pop up is opened automatically

This is the correct behavior and should be preserved.

##### Add Chamber

The `Add Chamber` command creates a new chamber and appends it to the `chambers` array.

Current default chamber:

{
 "label": "New Chamber",
 "init_type": "mPT",
 "mass": "0.0 g",
 "pressure": "0.101325 MPa",
 "temperature": "300.0 K",
 "volume": "1.0 L",
 "mol_fractions": {
  "N2": 1.0
 }
}

The add chamber modal currently includes basic editable fields for the new chamber.

At a minimum, the add chamber modal should include:

- label
- volume

After the chamber is created, the chamber pop up should open automatically so the user can finish editing the chamber using the full chamber smart editor.

Future improvement:
- The add chamber modal can eventually use the full chamber initialization editor directly.
- The add chamber modal can eventually include `init_type`, active initialization fields, and mole fraction controls.
- The current append-only behavior should remain the default unless an explicit insert-before / insert-after feature is added later.

##### Add Orifice

The `Add Orifice` command creates a new orifice and appends it to the `orifices` array.

The add orifice workflow must validate the following before creating the orifice:

- At least two chambers must exist.
- The `from` and `to` chambers must be different.

The current add orifice modal includes:

- label
- from chamber
- to chamber
- diameter

The default orifice should follow the current orifice GUI rules.

Recommended default orifice:

{
 "label": "New Orifice",
 "from": 1,
 "to": 2,
 "diameter": "1.0 mm",
 "num_orif": 1,
 "discharge_coefficient": {
  "basis": "constant",
  "Cd_value": 1.0
 },
 "opens_at": "1.0 MPa",
 "open": false,
 "one_way": false,
 "viscous_flow_factor": 0.0
}

After the orifice is created, the orifice pop up should open automatically so the user can finish editing the orifice using the full orifice smart editor.

Future improvement:
- The add orifice modal can eventually use the full orifice smart editor directly.
- The add orifice modal should eventually expose `num_orif`, `open`, `one_way`, `viscous_flow_factor`, `opens_at`, and `discharge_coefficient`.
- The append-only behavior means that existing orifice event references do not need to be shifted when adding a new orifice.

##### Add Wall

The `Add Wall` command creates a new wall and appends it to the `walls` array.

Current default wall:

{
 "label": "New Wall",
 "temperature": "294.15 K",
 "area": "1.0 cm^2",
 "thickness": "1.0 mm",
 "material": "steel",
 "left_connection": {
  "type": "CONSTANT_TEMPERATURE",
  "temperature": "294.15 K"
 },
 "right_connection": {
  "type": "CONSTANT_TEMPERATURE",
  "temperature": "294.15 K"
 }
}

The add wall modal currently includes:

- label
- left_connection
- right_connection

After the wall is created, the wall pop up should open automatically so the user can finish editing the wall using the full wall smart editor.

Future improvement:
- The add wall modal can eventually include temperature, area, thickness, and material.
- The add wall modal can eventually use the full wall smart editor directly.
- The append-only behavior means that existing wall references do not need to be shifted when adding a new wall.

##### Remove behavior currently implemented

Topology entities can be removed from their pop up using the `Remove...` button.

The remove operation should not immediately delete the item.

Instead, it must open a remove preview that shows:

- planned actions
- blocking issues
- warnings
- event remap preview
- whether the removal is allowed

The remove preview must be scanner-driven.

The user should not be able to apply removal if blocking dependencies exist.

##### Dependency scan button

Each topology entity pop up should include a `Scan Dependencies` button.

This scan is read-only.

The dependency scan should show:

- direct references
- index shift references
- event references
- blocking references
- remappable references

This scan should not change the JSON.

The scan is intended to help the user understand what will be affected before removing or modifying topology entities.

##### Chamber dependency rules

When scanning or removing a chamber, the GUI must check for direct references to that chamber.

Direct chamber references include:

- `orifices[*].from`
- `orifices[*].to`
- `walls[*].left_connection.chamber_index`
- `walls[*].right_connection.chamber_index`

If an orifice `from` or `to` points directly to the chamber being removed, chamber removal should be blocked.

Example blocker:

{
 "orifices": [
  {
   "from": 2,
   "to": 3
  }
 ]
}

If Chamber 2 is being removed, this orifice directly references Chamber 2 and must be repaired before removal.

If a wall connection points directly to the chamber being removed, chamber removal should be blocked.

Example blocker:

{
 "walls": [
  {
   "left_connection": {
    "type": "CONSTANT_COEFFICIENT",
    "chamber_index": 2
   }
  }
 ]
}

If Chamber 2 is being removed, this wall directly references Chamber 2 and must be repaired before removal.

If a chamber index is greater than the removed chamber index, it can be automatically shifted down by one.

Example remap:

Before removing Chamber 2:

{
 "orifices": [
  {
   "from": 3,
   "to": 4
  }
 ]
}

After removing Chamber 2:

{
 "orifices": [
  {
   "from": 2,
   "to": 3
  }
 ]
}

The remove preview should show this remap before it is applied.

##### Chamber event references

Pyro events can reference chamber and pyro indices using strings such as:

- `C1P1_ignited`
- `C1P1_extinguished`
- `C2P3_ignited`

When scanning or removing a chamber, the GUI must search the entire JSON for event strings that reference chamber/pyro indices.

If an event string directly references the chamber being removed, removal should be blocked unless the user manually repairs the event first.

Example blocker:

{
 "opens_at": {
  "triggering_event": "C2P1_ignited",
  "time_delay": "0.0 ms"
 }
}

If Chamber 2 is being removed, this event directly references Chamber 2 and should block removal.

If an event string references a chamber index greater than the removed chamber index, the GUI can remap the event string.

Example remap:

Before removing Chamber 2:

{
 "triggering_event": "C3P1_ignited"
}

After removing Chamber 2:

{
 "triggering_event": "C2P1_ignited"
}

The remove preview should show event remaps before they are applied.

The remove preview should include a checkbox that controls whether automatic event remapping is applied during removal.

##### Orifice dependency rules

When scanning or removing an orifice, the GUI must check for event references to that orifice.

Orifice event strings can include:

- `O1_opened`
- `O1_closed`
- `O2_opened`
- `O2_closed`

If an event string directly references the orifice being removed, removal should be blocked unless the user manually repairs the event first.

Example blocker:

{
 "ignition_time": {
  "triggering_event": "O2_opened",
  "time_delay": "0.0 ms"
 }
}

If Orifice 2 is being removed, this event directly references Orifice 2 and should block removal.

If an event string references an orifice index greater than the removed orifice index, the GUI can remap the event string.

Example remap:

Before removing Orifice 2:

{
 "triggering_event": "O3_opened"
}

After removing Orifice 2:

{
 "triggering_event": "O2_opened"
}

The remove preview should show this remap before it is applied.

Future improvement:
- The GUI should also check chamber filter `orifices` arrays when removing an orifice.
- If a filter references the orifice being removed, the GUI should either block removal or provide a repair option.
- If a filter references an orifice index greater than the removed index, that index should shift down by one.

##### Wall dependency rules

When scanning or removing a wall, the GUI must check for other walls that reference it.

Direct wall references include:

- `walls[*].left_connection.wall_index`
- `walls[*].right_connection.wall_index`

These only apply when the corresponding connection has:

{
 "type": "WALL"
}

If another wall directly references the wall being removed, removal should be blocked unless the user manually repairs the connection first.

Example blocker:

{
 "walls": [
  {
   "left_connection": {
    "type": "WALL",
    "wall_index": 2
   }
  }
 ]
}

If Wall 2 is being removed, this reference should block removal.

If a wall index is greater than the removed wall index, it can be automatically shifted down by one.

Example remap:

Before removing Wall 2:

{
 "right_connection": {
  "type": "WALL",
  "wall_index": 3
 }
}

After removing Wall 2:

{
 "right_connection": {
  "type": "WALL",
  "wall_index": 2
 }
}

The remove preview should show this remap before it is applied.

##### Remove preview behavior

The remove preview should show the user exactly what will happen before removal is applied.

The remove preview should include:

- entity type
- entity index
- planned actions
- blocking issues
- warnings
- event remap preview
- index remap preview
- apply/cancel buttons

The `Apply Removal` button should be disabled if blockers exist.

The remove preview should clearly distinguish:

- blockers: references that must be manually repaired before removal
- remaps: references that can be automatically updated
- warnings: non-blocking conditions the user should review

##### Removal snapshots and undo

Before applying removal, the GUI should store a snapshot of the full JSON.

This allows a future undo command to restore the previous state.

Current behavior should preserve a last-removal snapshot.

Future improvement:
- Add a visible `Undo Last Removal` button.
- Add a status message that clearly tells the user when an undo snapshot exists.
- Consider saving a short removal history instead of only one snapshot.

##### Add/remove graph behavior

After adding or removing a topology entity, the graph must be rebuilt.

The graph should update:

- chamber nodes
- orifice nodes
- wall nodes
- chamber/orifice flow edges
- wall dashed edges
- one_way orifice arrow styling
- chamber overlay labels and volumes

After add/remove operations, the tree view and code editor must also refresh.

##### Event naming rules

The GUI currently uses and detects event strings based on topology indices.

Standard event suggestions should include:

- `SimStart`
- `O1_opened`
- `O1_closed`
- `O2_opened`
- `O2_closed`
- `C1P1_ignited`
- `C1P1_extinguished`
- `C2P1_ignited`
- `C2P1_extinguished`

The exact list should be generated from the current model.

The GUI must also allow custom event strings because future AIPP development may add new event names.

#### Topology Dependency Management and Insert Operations

Topology objects in the assembly are stored as arrays:

{
 "assembly": {
  "chambers": [...],
  "orifices": [...],
  "walls": [...]
 }
}

The GUI currently supports append-only creation of chambers, orifices, and walls from the `Add` menu. Append-only creation is safe because existing topology indices do not change when a new object is appended to the end of an array.

The long-term goal is to support additional topology operations:

- Add chamber at end
- Insert chamber before selected chamber
- Insert chamber after selected chamber
- Remove chamber
- Add orifice at end
- Remove orifice
- Add wall at end
- Remove wall

Insert-before and insert-after operations are more complicated than append-only operations because index-based references must be shifted upward by one.

Removal operations are also complicated because references to the removed object may need to be blocked, deleted, remapped, or manually repaired.

The GUI must never silently corrupt index-based references.

##### Index reference convention

The JSON input file uses one-based indices for topology references.

Examples:

- Chamber 1 is referenced as `1`
- Orifice 1 is referenced as `1` in filter `orifices` arrays
- Wall 1 is referenced as `1`
- Chamber/pyro event strings use forms such as `C1P1_ignited`
- Orifice event strings use forms such as `O1_opened`

This means that if an item is inserted into or removed from an array, all later references to that array may need to change.

##### Dependency scanner purpose

The dependency scanner is responsible for finding every JSON path that depends on a topology index.

The scanner should be used before:

- removing a chamber
- removing an orifice
- removing a wall
- inserting a chamber before another chamber
- inserting a chamber after another chamber
- future insertion of orifices or walls if those features are added

The scanner should produce a report that separates references into categories:

- direct blockers
- safe automatic remaps
- event-string remaps
- warnings
- informational references

The scanner should include the exact JSON path for every dependency it finds.

Example path formats:

- `assembly.orifices[2].from`
- `assembly.orifices[2].to`
- `assembly.walls[0].left_connection.chamber_index`
- `assembly.chambers[1].filter.orifices[0]`
- `assembly.chambers[0].pyro[0].ignition_time.triggering_event`

##### Dependency paths that must be scanned

The scanner must check the following index-based dependency fields.

###### Chamber index dependencies

Chamber indices are referenced by:

- `assembly.orifices[*].from`
- `assembly.orifices[*].to`
- `assembly.walls[*].left_connection.chamber_index`
- `assembly.walls[*].right_connection.chamber_index`

These references must be scanned when removing or inserting chambers.

For chamber removal:

- If a reference points directly to the chamber being removed, removal should be blocked.
- If a reference points to a chamber index greater than the removed chamber index, the reference can be remapped down by one.

For chamber insertion:

- If a reference points to a chamber index greater than or equal to the inserted chamber index, the reference must be remapped up by one.
- Chamber insertion should not create blockers by itself, but the remap preview must be shown.

###### Orifice index dependencies

Orifice indices are referenced by:

- event strings such as `O1_opened`
- event strings such as `O1_closed`
- chamber filter `orifices` arrays

Filter references include:

- `assembly.chambers[*].filter.orifices[*]`
- `assembly.chambers[*].filters[*].orifices[*]`
- `assembly.chambers[*].filter[*].orifices[*]` if a model uses an array under `filter`

These references must be scanned when removing or inserting orifices.

For orifice removal:

- If a filter `orifices` array directly contains the removed orifice index, the GUI should block removal or require the user to choose a repair action.
- If a filter `orifices` array contains an orifice index greater than the removed orifice index, that value can be remapped down by one.
- If an event string directly references the removed orifice, removal should be blocked unless the user manually repairs the event.
- If an event string references an orifice index greater than the removed orifice index, the event string can be remapped down by one.

For orifice insertion:

- If a filter `orifices` array contains an orifice index greater than or equal to the inserted orifice index, that value must be remapped up by one.
- If an event string references an orifice index greater than or equal to the inserted orifice index, the event string must be remapped up by one.
- Orifice insertion should show all remaps before applying them.

###### Wall index dependencies

Wall indices are referenced by wall connection objects when the connection type is `"WALL"`.

Wall references include:

- `assembly.walls[*].left_connection.wall_index`
- `assembly.walls[*].right_connection.wall_index`

These references must be scanned when removing or inserting walls.

For wall removal:

- If another wall directly references the wall being removed, removal should be blocked.
- If a wall reference points to a wall index greater than the removed wall index, it can be remapped down by one.

For wall insertion:

- If a wall reference points to a wall index greater than or equal to the inserted wall index, it must be remapped up by one.

##### Event string dependencies

The scanner must walk the entire JSON object and search for strings that contain event references.

Standard topology event string patterns include:

- `O#_opened`
- `O#_closed`
- `C#P#_ignited`
- `C#P#_extinguished`

Examples:

{
 "triggering_event": "O2_opened"
}

{
 "triggering_event": "C3P1_ignited"
}

The scanner should not assume that event strings only appear in known fields such as `triggering_event`.

The scanner should walk the entire JSON tree and inspect all string values.

This allows custom or future event-containing keys to be detected.

##### Event remap rules

For chamber insertion:

- `C1P1_ignited` remains unchanged if inserting after Chamber 1.
- `C2P1_ignited` becomes `C3P1_ignited` if inserting before Chamber 2.
- All chamber event references with chamber index greater than or equal to the inserted chamber index must shift up by one.

For chamber removal:

- `C2P1_ignited` blocks removal if Chamber 2 is being removed.
- `C3P1_ignited` becomes `C2P1_ignited` if Chamber 2 is removed.

For orifice insertion:

- `O1_opened` remains unchanged if inserting after Orifice 1.
- `O2_opened` becomes `O3_opened` if inserting before Orifice 2.
- All orifice event references with orifice index greater than or equal to the inserted orifice index must shift up by one.

For orifice removal:

- `O2_opened` blocks removal if Orifice 2 is being removed.
- `O3_opened` becomes `O2_opened` if Orifice 2 is removed.

##### Filter/orifice dependency rules

Filters reference orifices using integer arrays.

Example:

{
 "filter": {
  "material": "steel",
  "mass": "25.1 g",
  "method": "PERCENTAGE",
  "coefficient": 0.4,
  "orifices": [4, 6, 7]
 }
}

When removing Orifice 4:

- the reference to `4` is a direct dependency
- the GUI should block removal or require a repair action
- the GUI should not silently remove the value from the filter array unless the user explicitly chooses that repair

When removing Orifice 5:

- references to `6` and `7` should shift down to `5` and `6`

Before:

{
 "orifices": [4, 6, 7]
}

After removing Orifice 5:

{
 "orifices": [4, 5, 6]
}

When inserting an orifice before Orifice 6:

- references to `6` and `7` should shift up to `7` and `8`

Before:

{
 "orifices": [4, 6, 7]
}

After inserting before Orifice 6:

{
 "orifices": [4, 7, 8]
}

##### Insert chamber before / after

The end goal is to support inserting a chamber before or after a currently selected chamber.

The chamber popup should eventually include options such as:

- Insert Chamber Before
- Insert Chamber After

The add menu can also eventually include:

- Insert Chamber Before Selected
- Insert Chamber After Selected

The insertion behavior should be:

- create a default chamber
- insert it into `assembly.chambers` at the requested position
- shift affected chamber references upward by one
- shift affected chamber event strings upward by one
- refresh the tree, code editor, graph, and popup
- open the newly inserted chamber popup

Example:

If inserting a chamber before Chamber 2:

Before:

{
 "chambers": [
  { "label": "C1" },
  { "label": "C2" },
  { "label": "C3" }
 ]
}

After:

{
 "chambers": [
  { "label": "C1" },
  { "label": "New Chamber" },
  { "label": "C2" },
  { "label": "C3" }
 ]
}

All chamber references greater than or equal to `2` must shift up by one.

Examples:

- `orifices[*].from = 2` becomes `3`
- `orifices[*].to = 3` becomes `4`
- `walls[*].left_connection.chamber_index = 2` becomes `3`
- `C2P1_ignited` becomes `C3P1_ignited`

##### Insert chamber dependency preview

Before inserting a chamber, the GUI should show an insertion preview.

The insertion preview should show:

- insert location
- new chamber index
- chamber references that will shift
- event strings that will shift
- affected orifices
- affected walls
- affected event paths

The preview should not need blockers in normal cases because insertion does not delete any existing entity.

However, the preview should still warn about unusual or invalid existing references, such as:

- chamber index less than 1
- chamber index greater than number of chambers
- malformed event strings
- unknown event-like strings that could not be safely remapped

The user should confirm before the insert is applied.

##### Remove chamber game plan

Remove chamber should remain conservative.

If direct references exist, removal should be blocked.

Direct blockers include:

- orifice `from` pointing to removed chamber
- orifice `to` pointing to removed chamber
- wall connection `chamber_index` pointing to removed chamber
- event string directly referencing removed chamber

Automatic remaps are allowed for references greater than the removed chamber index.

The GUI should show the remap preview before applying removal.

##### Remove orifice game plan

Remove orifice should be conservative.

Direct blockers include:

- event strings directly referencing removed orifice
- filter `orifices` arrays containing the removed orifice index

Automatic remaps are allowed for:

- event strings referencing orifice indices greater than the removed index
- filter `orifices` values greater than the removed index

The GUI should show the remap preview before applying removal.

##### Remove wall game plan

Remove wall should be conservative.

Direct blockers include:

- another wall connection of type `"WALL"` referencing the removed wall index

Automatic remaps are allowed for:

- wall references greater than the removed wall index

The GUI should show the remap preview before applying removal.

##### Dependency scanner implementation requirements

The scanner should be centralized.

Do not duplicate dependency logic separately in each add/remove function.

The scanner should support at least these operations:

- `delete`
- `insert_before`
- `insert_after`

The scanner should accept:

- entity type: `chamber`, `orifice`, or `wall`
- entity index
- operation type

The scanner should return:

- direct references
- shifted references
- event references
- warnings
- summary counts
- whether the operation is safe
- proposed remap values where applicable

The remap application should be separate from the scan.

This allows the GUI to show a read-only preview before changing the JSON.

##### Required regression tests

The dependency scanner must be tested with these cases:

- Remove chamber directly referenced by an orifice `from`
- Remove chamber directly referenced by an orifice `to`
- Remove chamber directly referenced by a wall `chamber_index`
- Remove chamber directly referenced by a `C#P#` event
- Remove chamber remaps orifice chamber indices greater than removed index
- Remove chamber remaps wall chamber indices greater than removed index
- Remove chamber remaps `C#P#` event strings greater than removed index
- Remove orifice directly referenced by an `O#` event
- Remove orifice directly referenced by a filter `orifices` array
- Remove orifice remaps filter `orifices` values greater than removed index
- Remove orifice remaps `O#` event strings greater than removed index
- Remove wall directly referenced by another wall connection
- Remove wall remaps wall references greater than removed index
- Insert chamber before Chamber 1 remaps all chamber references up by one
- Insert chamber before Chamber N remaps chamber references greater than or equal to N
- Insert chamber after Chamber N remaps chamber references greater than N
- Insert chamber remaps `C#P#` event strings correctly
- Insert chamber does not change orifice indices
- Insert chamber does not change wall indices
- Insert orifice, if added later, remaps filter `orifices` arrays and `O#` event strings
- Insert wall, if added later, remaps wall connection `wall_index` values

## Flow Chart Visualization

This section is intended to dictate how the entities should appear in the flow chart and what items should be displayed in the entity box for ease of use.


### Chambers

Each chamber entity should be a rectangle with rounded edges include the following text in order:

- "Chamber " + the chamber index
- If a label exists, add the label. If the label is blank just put "-"
- Add the initializiation type
  - show the required inputs for that initialization type in a table like format with values and units
- show all the pyros in the chamber. If there are no pyros, do not add any verbiage
  - each pyro should show the following:
    - formulation - shape - quantity
      - if the quantity is a mass show the value and the units
      - if the quantity is a shape just put and x and then the quantity
- show all filters in the chamber. If there are no filters, do not add any verbiage.
  - Each filter should show the following:
    - material - weight - method:coefficient