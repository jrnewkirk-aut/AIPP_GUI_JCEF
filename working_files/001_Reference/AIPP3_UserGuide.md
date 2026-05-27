---
title: AIPP3 User Guide
author: Ben Gilbert - <ben.gilbert@autoliv.com> - OTC
date: March 6th, 2026
---

# **Building AIPP**

The code for AIPP is developed and stored on a [Github repository](https://github.com/Archaeologic-Inc/aipp).

# **Running AIPP**

## Command Line Interface (CLI)

```bash
    aipp [-h] -i {input_file} -i {output_file} [-r X]
```
### Options

|Option|Required|Arguments|Description|
|:---|:---:|:---|:---|
|```-h / --help```|No||display the help message|
|```-i / --input```|Yes|path to *input_file*|main input file for the model|
|```-o / --output```|Yes|path to *output_file*|output file containing the results|
|```-r / --reporting_level```|No|0(default)=no report, 1=full report, 2=customer report|level of detail in report|

### Example Command

The below command assumes all of the input files are in the same directory as the **aipp** executable and the output file is being written to the same directory. The most reliable approach is to specify the full path for each of the files.

```bash
    aipp -i ./inputs_example.json -o ./outputs_example.json -r 1
```

## Running with *Fortran Package Manager (fpm)*

## Bash Script for Running

Run this from inside of the AIPP repository cloned from Github.

```bash
# full path to the main simulation input JSON file
aipp_input_file="main_input_file.json"
# full path the simulation outputs JSON file
aipp_output_file="simulation_output_file.json"

# compilation flags for gfortran/ifx
gfortran_compilation_flags="-g -O3 -fopenmp -DOPENMP "
gfortran_compilation_flags+="-Wall -Wextra -pedantic -std=f2023 -static -Wimplicit-interface "
gfortran_compilation_flags+="-fcheck=all -fbacktrace -finit-real=snan -ffpe-trap=invalid,zero,overflow,underflow,denormal"
ifx_compilation_flags="-check:all -debug:full -stand:f23 -standard-semantics"

# choose the compiler gfortran/ifx
compiler_choice="gfortran"
case "${compiler_choice}" in
    "gfortran")
        compilation_flags=${gfortran_compilation_flags};;
    "ifx")
        compilation_flags=${ifx_compilation_flags};;
    *)
        echo "Unknown compiler choice"
esac

# export environment variables if using OpenMP
export OMP_NUM_THREADS=1
export OMP_PROC_BIND=close
export OMP_PLACES=threads
export OMP_DISPLAY_ENV=true
export OMP_DISPLAY_AFFINITY=tru

# the executable and CLI arguments
run_target="aipp -- -i ${aipp_input_file} -o ${aipp_output_file} -r 1"

# the fpm command executing the run_target
fpm_cmd="fpm run --compiler ${compiler_choice} --flag \"${compilation_flags}\" --target ${run_target}"

# print the fpm command and execute it
echo ${fpm_cmd}
eval ${fpm_cmd}
```

# **Unit Explanation for JSON Input/Output Files**

All of the input files are [JSON files](https://en.wikipedia.org/wiki/JSON) and use a [library](https://gitlab.com/everythingfunctional/quaff) that parses strings of dimensional quantities (e.g. times, pressures, currents, etc.) that include units and converts them to a representation that handles all subsequent unit conversions (1.0E+3 Pa = 1 kPa) and dimensional relationships (2 Pa * 10 m^3 / 4 s = 5 W). The permitted units for the included dimensional quantities in the JSON input files are fairly extensive and the program will display an error if you attempt to use a nonpermitted unit (e.g. *hogsheads* for volume).

The output files are also JSON files, but they are organized as a structure of arrays, where each array represents a class of output quantity that then spans across the recorded output times. Each array of outputs is paired with a JSON entry providing the units (e.g. *"pressure_units": "kPa"* are paired with the number of chambers by number of times array, *"pressures": [[...],[...],...]*). All included outputs are exhaustively listed in the **Output Fields** section.

# **Main Input File** (*Edit This When Creating A New Model*)

The main input file is a JSON file that contains an **aipp_calculation** object that is then comprised of three subobjects:

1) **header** - information about the simulation being performed.
2) **auxiliary_files** - additional files containing the properties for system components.
3) **time_specs** - the time specifications (time-stepper parameters, output frequency, simulation duration, etc.).
4) **reaction_specs** - the specifications for chemical reactions within the system.
5) **assembly** - the system being modeled.

## Abbreviated JSON for a main input file

*The ```{...}``` are placeholders for complete JSON objects that are described in greater detail in the subsequent sections.*

```json
{
    "aipp_calculation":
    {
        "header": {...},
        "auxiliary_files": {...},
        "time_specs": {...},
        "reaction_specs": {...},
        "assembly": {...}
    }
}
```

## The *header* within an *aipp_calculation*.

The header (*header*) serves as a record of the simulation details.

* **request_number** - the request number within the simulation tracking system.
* **title** - a title for the simulation.
* **system** - the system being simulation (e.g. inflator family).
* **part_number** - the part number for the system.
* **description** - a written description of the simulation, which should include notes on any unique details or characteristics and described the modeling approach.

The header has an equivalent counterpart in the output file that records additional information like the date and time of the simulation.

## The *auxiliary_files* within an *aipp_calculation*.

The auxiliary files (*auxiliary_files*) specify the locations of additional files that contain properties that typically remain static across simulations (e.g. CO2 remains CO2 and uses the same molar mass and heat capacity for all simulations).

* **species_library** - the JSON file describing the set of species to be modeled within the simulation and their thermodynamic models.
* **pyro_formulations** - the JSON file listing the set of pyrotechnic formulations available within the simulation and their properties.
* **materials** - the JSON file listing the set of materials and their properties available within the simulation for walls and filters.

## The *time_specs* within an *aipp_calculation*.

The time specifications (*time_specs*) describe the protocols for the time-integration of the simulation and the recording of outputs.

* **run_simulation** - a switch to enable/disable the time-integration of the simulation after initialization.
    * This switch is extremely helpful for debugging. It is **strongly recommended** to use this when building a new model to test the initialization and ensure the validity of the input file.
* **output_time_step** - the time period between writing the outputs of the simulation.
* **end_time** - the total duration of the simulation.
* **simulation_time_step** - the fixed timestep for RK4 integration and the initial timestep for RKF integration.
* **stepper** - the choice of the stepper (time-integrator).
    * "ForwardEuler" - an explicit forward-Euler stepper.
    * "RK4" - an explicit 4th-order Runge-Kutta stepper.
    * "RKF" - an explicit 4th-order Runge-Kutta-Fehlberg stepper that uses adaptive timesteps governed by truncation errors between a 4th-order and 5th-order integration.
* **RKF_config_file** - the accessory file to store the configuration of the RKF integrator.
    * *Use the default file (which has been tuned across a broad range of inflator models) unless a problem-specific file is required, e.g. initiator bombs with faster dynamics requiring tighter tolerances. If an alternate configuration for the RKF integrator is required, store it as a new file to preserve the default.*

### Example JSON for a complete **time_specs**

The below example will *run* the simulation following initialization until a final time of *5.0E-1 s*, use timesteps of *1.0E-6 s* if using the RK4 integrator or the parameters in *RKF_config.json* if using the RKF integrator, and will generate an output file that contains records separated by *1.0E-2 s* increments.

```json
{
    "run_simulation": true,
    "output_time_step": "1.0E-2 s",
    "end_time": "5.0E-1 s",
    "simulation_time_step": "1.0E-6 s",
    "stepper": "RKF",
    "RKF_config_file": "RKF_config.json"
}
```

## The *reaction_specs* within an *aipp_calculation*.

The reaction specifications (*reaction_specs*) describe the action of chemical reactions during the simulation.

* **reactions_list** - a list of the named reactions to be active during the simulation.
    * NOTE: *this must be a subset of the reactions listed in the **reaction_network** JSON file.*
* **reactions_method** - a selector to choose the type of kinetics to be used for the reaction rates.
* **onoff_switch** - a switch to enable/disable the action of reactions.
* **enforce_LDB** - a switch to enforce consistency between the kinetic steady-state and thermodynamic equilibrium.
    
    * NOTE: *it is **STRONGLY** suggested that users leave this enabled at all times to ensure agreement with RPA and other thermochemical equilibrium codes.*

    If the thermodynamic state of the system is given by the vector \ $\mathbf{Z}$ \, which encompasses the temperature, density, and composition, then local detailed balance (LDB) is the condition

    \ $\log[j_{\text{fwd}}(\mathbf{Z})/j_{\text{rev}}(\mathbf{Z})]=-\Delta G(\mathbf{Z})/R_{U}T$ \,

    where \ $j_{\text{fwd}}$ \ and \ $j_{\text{fwd}}$ \ denote the forward and reverse fluxes, respectively, and \ $\Delta G=\Delta G+R_{U}T\log Q$ \ is the instantaneous Gibbs free energy change of the reaction (essentially a driving force that depends on the extent of the deviation from chemical equilibrium).

    There are three scenarios to consider:

    1. If \ $\Delta G<0$ \, then the logarithm of the flux ratios is a positive number and \ $j_{\text{fwd}}>j_{\text{rev}}$ \. The net effect of the reaction is to run in the **forward** direction.
    2. If \ $\Delta G>0$ \, then the logarithm of the flux ratios is a negative number and \ $j_{\text{fwd}}<j_{\text{rev}}$ \. The net effect of the reaction is to run in the **reverse** direction.        
    3. If \ $\Delta G=0$ \, then the logarithm of the flux ratios is zero and \ $j_{\text{fwd}}=j_{\text{rev}}$ \. The net effect of the reaction is no change in the state of the system, i.e. the system is at **steady-state**.

    When this switch is enabled, the information specifying the kinetics of the reverse reaction flux (\ $j_{\text{rev}}$ \) are ignored and it is instead calculated from the forward reaction flux and the instantaneous Gibbs free energy change of the reaction. This is the approach used in other chemical kinetic codes (CHEMKIN, CANTERA, etc.). This has the added effect of reducing the number of parameters that need to specified by the user.

* **speed_scaling** - a global scale factor that influences the overall rates of all reactions.
    * NOTE: *setting this to 0.0 should be equivalent to turning the reactions off with the **onoff_switch**, which is a useful sanity check.*
* **reactions_file** - the auxiliary file storing the set of reactions.
    * Best practice is to create a collection of **reaction_network** JSON files with different reaction mechanisms and kinetics depending on the application.

### Example JSON for a complete **reaction_specs**

The below example will read *basic_reactions.json* for the reaction network, the *CO_combustion* and *H2_combustion* reactions will be active for every chamber in the system with their reaction fluxes governed by *mass action kinetics*, their reverse reaction fluxes will be calculated from the *local detailed balance (LDB)* to ensure thermodynamic consistency, and the net reaction fluxes will be scaled by *2.0E-5*.

```json
{
        "reactions_list":
        [
            "CO_combustion",
            "H2_combustion"
        ],
        "reactions_method":
        {
            "choice": "mass_action",
            "options":
                [
                    "constant",
                    "mass_action",
                    "mass_action_arrhenius"
                ]
        },
        "onoff_switch": true,
        "enforce_LDB": true,
        "speed_scaling": 2.0E-5,
        "reactions_file": "basic_reactions.json"
}
```

## The *assembly* within an *aipp_calculation*.

The assembly is comprised of...

* **chambers** - *contain a mixture of possibly reacting chemical species, pyrotechnic materials, and filters*
    * **mixture** - *ideal mixture of species assumed to be uniformly distributed*
    * **pyros** - *pyrotechnic materials in specified quantities with defined properties*
    * **filters** - *modify flow entering connected orifices*
* **orifices** - *connect chambers to allow mass and energy transport*
* **walls** - *connect to chambers and conduct heat between chambers and the outside environment*

One of the chambers is identified as the **Tank** by specifying its index in the array of chambers. The chamber identified as the tank will have additional outputs (*tank_outputs*) recorded for it that represent the cumulative influence of all connected orifices.

### Abbreviated JSON for an assembly

The *chambers*, *orifices*, and *walls* are each arrays of their respective JSON objects (denoted ```[{object 1},{object 2},{object 3},...]```).

* **tank_id** - the index of the chamber that is identified as the tank.
* **operating_temperature** (optional) - a temperature that will be uniformly applied to all components of the assembly other than the tank and the walls connected to the tank from their left connection.
    * *NOTE* - When using the **operating_temperature**, the user should imagine that the state specifications for the ideal specie mixtures in each chamber represent the thermodynamic states at the time of manufacturing, at which point the system is hermetically sealed. The **operating_temperature** represents the components of the system coming to a new thermal equilibrium with masses and volumes that were fixed at the time of manufacturing.

```json
"assembly":
{
    "tank_id": X,
    "operating_temprature": "294.15 K",
    "chambers":
    [
        {chamber 1 specification},
        {chamber 2 specification},
        {chamber 3 specification},
        ...
    ],
    "orifices":
    [
        {orifice 1 specification},
        {orifice 2 specification},
        {orifice 3 specification},
        ...
    ],
    "walls":
    [
        {wall 1 specification},
        {wall 2 specification},
        {wall 3 specification},
        ...
    ]
}
```

### A *chamber* within the *assembly*.

#### The *mixture* within a *chamber*.

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

All initialization types will test to confirm that the total volume of the chamber is sufficient to contain the pyros and filters.

#### A *pyro* within a *chamber*.

The pyro field within a chamber is **optional** and when present contains an array of pyro objects (*e.g. auto-ignition and gas generant materials in a single chamber*).

* **formulation** - the formulation.
    * NOTE: *the formulation must be a valid option from the set of formulations in the auxiliary file.*
* ***quantity*** (two options) - the total quantity of pyro is specified using either the total mass of pyrotechnic material (e.g. spherical granules) or the number of grains (e.g. wafers). There are two options:
    * **mass** - the total mass.
    * **number** - the number of grains.
* **piles** - the number of independent burn distances tracked for effective groups that each represent a fraction of the total amount of pyrotechnic.
* **flame_spread_time** - the length of the time-interval over which the piles begin burning.
    * NOTE: *the ignition times of the individual piles are linearly distributed within the time interval.*
        * Ex. In a pyro with 3 piles, a flame spread of 3 seconds and an ignition time of 1 second: the code will track a burn distance for each pile (each representing 1/3 of the total amount of pyro), the first pile will start burning at 1 second, the second pile will start burning at 2.5 seconds, and the third pile will start burning at 4 seconds.
* **ignition_time** - the time in the simulation that the pyro begins burning.
    * NOTE: *this is an **event_dependence** object, where the pyro will ignite at a time-delay following the triggering event*.
* **shape** - *the geometry of the grains of the pyrotechnic material.*
* **density_scaling** (optional) - a positive number describing how the actual density differs from the density in the baseline pyro formulation. If this key is absent from the JSON, the pyro's density will be the baseline value.
* **burn_rate_modifications** (optional) - a JSON object describing modifications to the burn rate. If this key is absent from the JSON, the pyro's burn law will be a simple pressure-dependent power-law using the parameterization in the baseline pyro formulation.

##### A set of *burn_rate_modifications* in a *pyro*.

The burn_rate_modifications field defines changes to the pyro formulation's baseline burn law.

* **reference_burn_rate** (optional) - an alternative reference burn rate that overrides the baseline value.
* **burn_rate_exponent** (optional) - an alternative burn rate exponent that overrides the baseline value.
* **temperature_sensitivity** (optional) - an alternative temperature sensitivity that overrides the baseline value.
* **reference_burn_rate_scaling** (optional) - a scaling applied to the baseline value of the reference burn rate.
* **burn_rate_exponent_scaling** (optional) - a scaling applied to the baseline value of the burn rate rate exponent.
* **temperature_sensitivity_scaling** (optional) - a scaling applied to the baseline value of the temperature sensitivity.
* **pressure_units** (optional) - units for the pressure array when using a lookup table.
* **burn_rate_units** (optional) - units for the burn rate array when using a lookup table.
* **pressure_array** (optional) - an array of pressure values.
* **burn_rate_array** (optional) - an array of burn rate values.

```json
{
    "reference_burn_rate": "50.3 mm/s",
    "burn_rate_exponent_scaling": 0.98,
    "temperature_sensitivity_scaling": 1.2
}
```

```json
{
    "temperature_sensitivity": "5.0E-2 1/K",
    "pressure_units": "MPa",
    "pressure_array": [1.0, 2.0],
    "burn_rate_units": "mm/s",
    "burn_rate_array": [50.0, 60.0],
}
```

##### A *shape* describing a *pyro*.

The shape field defines the geometry of the grains of pyrotechnic material.

The possible shapes are:

* **sphere** - a sphere.
    * **radius** - the radius of the sphere.
```json
{
    "geometry": "sphere",
    "radius": "0.3 mm"
}
```
* **tablet** - a cylinder with domes at the caps.
    * **diameter** - the diameter of the tablet
    * **total_height** - the total height of the tablet
    * **dome_height** - the height of the dome.
```json
{
    "geometry": "tablet",
    "total_height": "1.9 mm",
    "diameter": "3.9 mm",
    "dome_height": "0.076 mm"
}
```
* **grain** - a prismatic star-shaped grain comprised of a cylinder surrounded by adjoined rectangular fins.
    * **inner_diameter** - the diameter of the cylindrical void along the central axis.
    * **outer_diameter** - the diameter of the cylindrical grain.
    * **fin_diameter** - the diameter to which the fins extend radially.
    * **num_fins** - the number of fins.
    * **fin_thickness** - the thickness of the fins (they are assumed to be a constant thickness).
    * **cylinder_height** - the length of the prism.
```json
{
    "geometry": "grain",
    "inner_diameter": "7.0 mm",
    "outer_diameter": "13.0 mm",
    "fin_diameter": "10.0 mm",
    "num_fins": 8,
    "fin_thickness": "3.0 mm",
    "cylinder_height": "4.0 mm"
}
```
* **wafer** - a thin annulus.
    * **inner_radius** - the inner-radius of the annulus.
    * **outer_radius** - the outer-radius of the sphere.
    * **height** - the thickness of the the wafer.
```json
{
    "geometry": "wafer",
    "inner_radius": "4.0 mm",
    "outer_radius": "6.0 mm",
    "height": "2.0 mm"
}
```
* **tabular** - the user-supplied shape function (surface area as a function of burn distance) defines the surface area and volume.
    * **burn_distance_units** - units of length for the burn distance.
    * **surface_area_units** - units of area for the surface area.
    * **burn_distance_array** - an array of burn distances.
        * NOTE: *the first value must be 0 to represent when the grain is unburnt and the final value is the maximum burn depth where the material will be fully consumed.*
    * **surface_area_array** - an array of surface areas representing the surface area at each of the supplied burn distances.
        * NOTE: *the final value must be 0 to represent when the grain has been fully consumed at the maximum burn distance.*
```json
{
    "geometry": "tabular",
    "burn_distance_units" : "mm",
    "surface_area_units" : "m^2",
    "burn_distance_array" : [0.0,3.0],
    "surface_area_array" : [0.000003,0.0]
}
```

##### Example JSONs for a complete **pyro**

Below is a specification for a total mass of *0.130 g* of *PIP1292_20250528* as grains that are *spherical* with a radius of *0.3 mm*. The total quantity is divided in *5 piles*, which begin igniting sequentially at *0.0001 s* and take *0.0005 s* for the flame to spread and ignite all piles.

```json
{
    "formulation": "PIP1292_20250528",
    "mass": "0.130 g",
    "piles": 5,
    "flame_spread_time": "0.0005 s",
    "ignition_time":
    {
        "triggering_event": "SimStart",
        "time_delay": "0.001 s"
    },
    "shape": {
        "geometry": "sphere",
        "radius": "0.3 mm"
    }
}
```

Below is a specification for a *4 grains* of *PNA24B10_20250528* as wafers. The total quantity is divided into *2 piles*. The density of the pyro is scaled to make the pyro denser and the burn rate modified by scaling the exponent and overriding the reference burn rate.

```json
{
    "formulation": "PNA24B10_20250528",
    "number": 4,
    "piles": 2,
    "flame_spread_time": "0.0005 s",
    "ignition_time":
    {
        "triggering_event": "O1_opened",
        "time_delay": "0.003 s"
    },
    "shape": {
        "geometry": "wafer",
        "inner_radius": "4.0 mm",
        "outer_radius": "6.0 mm",
        "height": "2.0 mm"
    },
    "density_scaling": 1.1,
    "burn_rate_modifications":
    {
        "reference_burn_rate": "25.0 mm/s",
        "burn_rate_exponent_scaling": 0.95
    }
}
```

#### A *filter* within a *chamber*.

The filter field within a chamber is **optional** and when present is a single filter object.

The filter contains the following fields:

* **material** - the material used for the filter.
* **mass** - the total mass of the filter.
* **orifices** - an array of the orifices whose flow from the chamber is subject to the filtering.
* **method** - the method used for the heat transfer between the filter and the flow passing through it, there are two options.
    * **"PERCENTAGE"** - the flow's total enthalpy is changed by a percentage of the difference between the incoming flow's molar enthalpy and the molar enthalpy of the flow if it were instead at the initial temperature of the filter. *The energy addition/removal from the flow will be independent of the filter's current temperature.*
    * **"KNTU"** - the flow gains/loses heat at a rate that is given by a Fourier-like law that depends on the temperature difference between the flow and the filter's current temperature. *The energy addition/removal from the flow will depended on the filter's current temperature and cause the filter and flow to reach thermal equilibrium (identical temperatures)*.

##### Example JSON for a complete filter

Below is the specification for a filter with a mass of *25.1 g* and the listed *specific heat* and *density*, which transfers heat the gas flow passing to/from the chamber via *orifice 4* using the *PERCENTAGE* method.

```json
{
    "material": "steel",
    "mass": "25.100000 g",
    "method": "PERCENTAGE",
    "coefficient": 0.400000,
    "orifices": [4]
}
```

#### Example JSON for a complete **chamber**

```json
{
    "label": "mPT initialization (mass, pressure, temperature -> get volume) with 1g pyro and 100g filter",
    "init_type": "mPT",
    "mass": "10.0 g",
    "pressure": "1.01325E+5 Pa",
    "temperature": "294.15 K",
    "mol_fractions": {
        "O2": 0.1,
        "Ar": 0.65,
        "He": 0.25
    },
    "filter": {
        "material": "steel",
        "mass": "100.0 g",
        "method": "PERCENTAGE",
        "coefficient": 0.000000,
        "orifices":[1]
    },
    "pyro": [{
        "formulation": "PIP1226K_20250528",
        "density": "1.0E+3 kg/m^3",
        "amount": "1.0 g",
        "piles": 1,
        "flame_spread_time": "0.000200 s",
        "ignition_time": "0.0006 s",
        "reference_burn_rate": "100.000000 mm/s",
        "burn_rate_exponent": 0.000000,
        "burn_rate_temperature_sensitivity": "0.000000 1/K",
        "shape": {
            "geometry": "sphere",
            "radius": "1.0 mm"
        }
    }]
}
```

### An *orifice* within the *assembly*.

Each orifice connects two chambers with the sign convention of the flow dictated by the values of *from* and *to*. The orifice contains the following fields...

* **diameter** - the diameter of the orifices.
* **num_orif** - the number of orifices within the group, each with the prescribed diameter.
* **open** - the open/close state of the orifice at the start of the simulation (t=0s).
* **one_way** - restrictions on the flow through the orifice to be solely in the forward direction of FROM$\rightarrow$TO.
* **discharge_coefficient** - the discharge coefficient ($C_D$) of the orifice, the options for this are detailed in the subsequent section.
* **from** - the chamber connected to the orifice inlet.
* **to** - the chamber connected to the orifice outlet.
* **viscous_flow_factor** - the viscous flow factor used to damp oscillations.
* **opens_at** - the criteria for the orifice opening. The criteria will depend on the dimensions of the quantity, which can either be dimensions of **time** or **pressure**.
    * Event-based: *if an **event_dependence** is listed, then the orifice will open when the simulation reaches that time.*
    * Pressure-based: *if a **pressure** is listed, then the orifice will open when the pressure differential ($\Delta P=P_{\text{from}}-P_{\text{to}}$) exceeds that value.*

#### A *discharge_coefficient* describing the modification of an *orifice*'s flow.

The discharge coefficient captures the aggregated influence of nonideal effects reducing the effective flow rate from its ideal value at $C_D=1$. The discharge coefficients all have a **basis** argument, which can take values of "constant", "time", or "pressure", and describes the functional dependence of the discharge coefficient.

The discharge coefficients options are:

* **constant** - a constant discharge coefficient.
    * **Cd_value** - the fixed value of the discharge coefficient.
```json
{
    "basis": "constant",
    "Cd_value": 0.7
}
```
* **time** - a discharge coefficient that is a function of time provided by a lookup table.
    * **time_units** - the time units used for the time array.
    * **time_array** - the times relative to when the orifice opened.
    * **Cd_array** - the discharge coefficient at the listed times.
    * **continuity** - the scheme used to calculate values between the listed points.
```json
{
    "basis": "time",
    "time_units": "s",
    "time_array": [
        0.001,
        0.01
    ],
    "Cd_array": [
        0.75,
        0.5
    ],
    "continuity": "interpolate"
}
```
* **pressure** - a discharge coefficient that is a function of the pressure differential ($\Delta P=P_{\text{from}}-P_{\text{to}}$) provided by a lookup table.
    * **pressure_units** - the pressure units used for the pressure array.
    * **pressure_array** - the pressure differentials.
    * **Cd_array** - the discharge coefficient at the listed pressure differentials.
    * **continuity** - the scheme used to calculate values between the listed points.
```json
{
    "basis": "pressure",
    "pressure_units": "MPa",
    "pressure_array": [
        25,
        50
    ],
    "Cd_array": [
        0.75,
        0.5
    ],
    "continuity": "discrete"
}
```
#### Discharge Coefficient Continuity

The `continuity` of the variable discharge coefficient must be prescribed in the JSON definition as shown in the examples above. In practice, this controls how abruptly the $C_d$ value is updated throughout the prescribed time period.

**Note**: Time/Pressure values in excess of the maximum or minimum values in their respective arrays will default to the closest $C_d$ value.

* Discrete

    Selecting `discrete` continuity will create a step-wise update in the discharge coefficient. This option can enable more exaggerated changes in flow when used with a $C_d$ array with a small number of data points. Conversely, this functionality can be used with a highly refined $C_d$ array to approximate the behavior of an interpolated $C_d$ array at potentially lower computational cost.

* Interpolate

    Selecting `interpolate` as the $C_d$ continuity will create a linear interpolation between each point in the $C_d$ array. 

Continuity Visualization

To illustrate the effect of the continuity options, the resultant $C_d$ profiles for the JSON snippet below were plotted for both `discrete` and `interpolate` continuities.


```json
"discharge_coefficient": {
                "basis": "time",
                "time_units": "s",
                "time_array": [
                    0.0,
                    1.0,
                    2.0,
                    3.0
                ],
                "Cd_array": [
                    1.0,
                    0.9,
                    0.6,
                    0.3
                ],
                "continuity": "interpolate"
            },
```

<figure>
    <img src="./figures/Cd_continuity.png" alt="Cd continuity" style="width:65%"/>
    <figcaption>Discharge coefficient continuity comparison</figcaption>
</figure>

#### Example JSON for a complete **orifice**

Below is the specification for an orifice connecting *from chamber 1 to chamber 2* with a diameter of *3.0 mm*, a viscous flow flow factor of *0.0*, and a discharge coefficient of *1.0*, which is initially *not open* until it *opens at 2.0E+0 s*.

```json
{
    "diameter": "3.000000 mm",
    "num_orif": 5,
    "open": false,
    "one_way": false,
    "discharge_coefficient":
    {
        "basis": "constant",
        "Cd_value": 0.7
    },
    "from": 1,
    "to": 2,
    "viscous_flow_factor": 0.0,
    "opens_at":
    {
        "triggering_event": "SimStart",
        "time_delay": "1.0E-3 s"
    }
}
```

or

```json
{
    "diameter": "3.000000 mm",
    "num_orif": 5,
    "open": false,
    "one_way": false,
    "discharge_coefficient":
    {
        "basis": "time",
        "time_units": "s",
        "time_array": [
            0.001,
            0.01
        ],
        "Cd_array": [
            0.75,
            0.5
        ],
        "continuity": "interpolate"
    },
    "from": 1,
    "to": 2,
    "viscous_flow_factor": 0.0,
    "opens_at": "1.0E+5 Pa"
}
```

### A *wall* within the *assembly*.

Each wall represents a 1D heat transfer problem that is solved using a finite difference scheme ([FTCS: forward-time, centered space](https://en.wikipedia.org/wiki/FTCS_scheme)) and has the following fields...

* **temperature** - the initial uniform temperature of the wall.
* **area** - the cross-sectional area of the wall and its interfaces at the left and right boundaries.
* **thickness** - the total thickness of the wall.
* **material** - the material of the wall.
* **left_connection** - the boundary condition (BC) at the one end of the 1D system (L). *The assumed convention is that chambers are on the far-left and the environment is on the far-right.*
    * The types of connections are described in the next section.
* **right_connection** - the boundary condition (BC) at the opposite end of the 1D system (R).
    * The types of connections are described in the next section.

#### The *connections* within a *wall*.

The options for the connections specifying the BCs at either end of the 1D walls are...

* **CONSTANT_TEMPERATURE** - constant temperature BC (Dirichlet).
    * **temperature** - the temperature at the boundary.
```json
{
    "type": "CONSTANT_TEMPERATURE",
    "temperature": "294.15 K"
}
```
* **CONSTANT_HEAT** - constant heat flux BC (Neumann).
    * **heat** - the heat rate at the boundary.
```json
{
    "type": "CONSTANT_HEAT",
    "heat": "10.0 W"
}
```
* **WALL** - left end of wall is in contact with the right end of another wall. 
    * **wall_index** - the index of the wall whose right boundary is connected to this wall's left boundary.
```json
{
    "type": "WALL",
    "wall_index": 1
}
```
* **CONSTANT_COEFFICIENT** - heat flux between the connected chamber and the end of the wall is described by a Fourier-like law with a constant coefficient.
    * **chamber_index** - the index of the connected chamber.
    * **heat_transfer_coefficient** - the constant heat transfer coefficient.
```json
{
    "type": "CONSTANT_COEFFICIENT",
    "chamber_index": 1,
    "heat_transfer_coefficient": "1.0E+2 W/(m^2 K)"
}
```
* **VARIABLE_COEFFICIENT** - heat flux between the connected chamber and the end of the wall is described by a Fourier-like law with a variable coefficient described by the Dittus-Boelter correlation (*dependence on the fluid flow through the chamber*).
    * **chamber_index** - the index of the connected chamber
    * **scale_factor** - the scale factor used for the Dittus-Boelter correlation.
```json
{
    "type": "VARIABLE_COEFFICIENT",
    "chamber_index": 1,
    "scale_factor":  1.0
}
```

#### Example JSON for a complete **wall**

Below is the specification for a *10.0 cm* thick wall at an initial temperature of *294.15 K*, whose *left BC* is in contact with *chamber 1* and transfers heat using a *constant coefficient* and *right BC* is at a *constant temperature of 294.15 K*.

```json
{
    "temperature": "294.15 K",
    "area": "1.0E+6 cm^2",
    "thickness": "10.0 cm",
    "material": "steel",
    "right_connection": {
        "type": "CONSTANT_TEMPERATURE",
        "temperature": "294.15 K"
    },
    "left_connection": {
        "type": "CONSTANT_COEFFICIENT",
        "chamber_index": 1,
        "heat_transfer_coefficient": "0.0E+4 W/(m^2 K)"
    }
}
```

### Example JSON for a complete **assembly**

<figure>
    <img src="./figures/igniter_can.png" alt="igniter can example system" style="width:75%"/>
    <figcaption>Schematic of igniter can system.</figcaption>
</figure>

Below is the specification for an assembly consisting of *four chambers* representing an igniter can that is fired into a holding chamber that later exhausts into a tank when the pyros have finished burning.

The following sequence of events will happen in the simulation:

1) The PIP1226H in the initiator is ignited at 0.1 ms after the start of the simulation.
2) The orifice connecting the initiator to the igniter can bursts at 25 MPa.
3) The PNA24B in the igniter can ignites 1 ms after the initiator bursts.
4) The PNP524B10 in the igniter can ignites 2 ms after the initiator bursts.
5) The orifice connecting the igniter can to the holding chamber bursts at 100 MPa.
6) The orifice connecting the holding chamber to the tank opens 0 ms after the PNA24B is fully extinguished.

```json
"tank_id": 4,
"chambers": [
    {
        "label": "Chamber 1 - Initiator",
        "init_type": "mVT",
        "volume": "600.0 mm^3",
        "temperature": "294.15 K",
        "mass": "0.0004255 g",
        "mol_fractions": {
        "O2": 0.21,
        "N2": 0.78,
        "Ar": 0.01
        },
        "pyro": [
        {
            "formulation": "PIP1226H_20250528",
            "density": "2.910 g/cm^3",
            "amount": "0.535000 g",
            "piles": 5,
            "flame_spread_time": "0.0001 s",
            "ignition_time": {
            "triggering_event": "SimStart",
            "time_delay": "0.0001 s"
            },
            "reference_burn_rate": "100.000000 mm/s",
            "burn_rate_exponent": 0.0,
            "burn_rate_temperature_sensitivity": "0.000000 1/K",
            "shape": {
            "geometry": "sphere",
            "radius": "0.4 mm"
            }
        }
        ]
    },
    {
        "label": "Chamber 2 - Igniter Can",
        "init_type": "PVT",
        "volume": "9235.0 mm^3",
        "temperature": "294.15 K",
        "pressure": "0.087 MPa",
        "mol_fractions": {
        "He": 0.25,
        "O2": 0.1,
        "Ar": 0.65
        },
        "pyro": [
        {
            "formulation": "PNP524B10Production_20250528",
            "density": "1.651 g/cm^3",
            "amount": 6,
            "piles": 5,
            "flame_spread_time": "0.006 s",
            "ignition_time": {
            "triggering_event": "O1_opened",
            "time_delay": "0.002 s"
            },
            "reference_burn_rate": "49.000000 mm/s",
            "burn_rate_exponent": 0.31,
            "burn_rate_temperature_sensitivity": "0.0000 1/K",
            "shape": {
            "geometry": "wafer",
            "outer_radius": "7.885 mm",
            "inner_radius": "3.65 mm",
            "height": "2.5 mm"
            }
        },
        {
            "formulation": "PNA24B_20250528",
            "density": "1.52 g/cm^3",
            "amount": 1,
            "piles": 5,
            "flame_spread_time": "0.004 s",
            "ignition_time": {
            "triggering_event": "O1_opened",
            "time_delay": "0.001 s"
            },
            "reference_burn_rate": "39.000000 mm/s",
            "burn_rate_exponent": 0.55,
            "burn_rate_temperature_sensitivity": "0.0000 1/K",
            "shape": {
            "geometry": "wafer",
            "outer_radius": "7.885 mm",
            "inner_radius": "3.65 mm",
            "height": "3 mm"
            }
        }
        ]
    },
    {
        "label": "Chamber 3 - Restricted Until Extinguishment",
        "init_type": "PVT",
        "volume": "1 L",
        "temperature": "294.15 K",
        "pressure": "0.087 MPa",
        "mol_fractions": {
        "He": 0.25,
        "O2": 0.1,
        "Ar": 0.65
        }
    },
    {
        "label": "Chamber 4 - 60L Tank",
        "init_type": "PVT",
        "volume": "60 L",
        "temperature": "294.15 K",
        "pressure": "0.087 MPa",
        "mol_fractions": {
        "O2": 0.08,
        "N2": 0.91,
        "Ar": 0.01
        }
    }
],
"walls": [
    {
        "label": "Wall 1",
        "temperature": "294.15 K",
        "area": "3.440208 cm^2",
        "thickness": "2.0 mm",
        "material": "steel",
        "right_connection": {
        "type": "CONSTANT_TEMPERATURE",
        "temperature": "294.15 K"
        },
        "left_connection": {
        "type": "VARIABLE_COEFFICIENT",
        "chamber_index": 1,
        "scale_factor": 9.6
        }
    }
],
"orifices": [
    {
        "from": 1,
        "to": 2,
        "diameter": "2.000000 mm",
        "num_orif": 1,
        "open": false,
        "one_way": true,
        "opens_at": "25 MPa",
        "discharge_coefficient": {
        "basis": "pressure",
        "pressure_units": "MPa",
        "pressure_array": [
            25,
            50
        ],
        "Cd_array": [
            0.75,
            0.5
        ],
        "continuity": "discrete"
        },
        "viscous_flow_factor": 0.4
    },
    {
        "from": 2,
        "to": 3,
        "diameter": "7.3 mm",
        "num_orif": 1,
        "open": false,
        "one_way": false,
        "opens_at": "100.0 MPa",
        "discharge_coefficient": {
        "basis": "time",
        "time_units": "s",
        "time_array": [
            0.001,
            0.01
        ],
        "Cd_array": [
            0.75,
            0.5
        ],
        "continuity": "interpolate"
        },
        "viscous_flow_factor": 0.4
    },
    {
        "from": 3,
        "to": 4,
        "diameter": "9.0 mm",
        "num_orif": 1,
        "open": false,
        "one_way": true,
        "opens_at": {
        "triggering_event": "C2P2_extinguished",
        "time_delay": "0.0 s"
        },
        "discharge_coefficient": {
        "basis": "constant",
        "Cd_value": 1.0
        },
        "viscous_flow_factor": 0.4
    }
]
```

## **Events During the Simulation**

During the course of the simulation, the time at which specific events occur are recorded in an **event register**. While a user can access the contents of the event register, it is impossible for them to directly manipulate it.

There is a standard format for these events that is prescribed programmatically within AIPP. These events can then be referenced using *event_dependence* objects in the JSON,

```json
{
    "triggering_event": "C2P1_extinguished",
    "time_delay": "0.1 s"
}

```

which describes that a time-based action will occur following a time-delay after the trigger event is observed. The utility of this approach is that it enables users to fine-tune inflator systems using relative times rather than a single absolute timescale or specify time-delays that are connected to physical phenomena recorded as events.

The events implemented currently are listed in the below table.

|Event Name|Description|
|:---|:---|
|```SimStart```|the start of the simulation (always occurs at t = 0s)|
|```OX_opened```|orifice ```X``` opened|
|```OX_closed```|orifice ```X``` closed|
|```CYPZ_ignited```|pyro ```Z``` in chamber ```Y``` ignited (*first pile ignites*)|
|```CYPZ_extinguished```|pyro ```Z``` in chamber ```Y``` extinguished (*final pile extinguishes*)|

### Important Notes About Events

This is essentially a physics-based version of a software methodology known as [event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html).

* Events will always be listed in chronological order.
* There are no duplicate events.
* Events are generated during the procedure that updates the state of the system (*chamber gas compositions, burn distances, etc.*) and the event register is a component of the state. For a system state $x(t)$ containing event register $y(t)$ being advanced in time to $t+\Delta t$, the following process happens:
    1) Using the current system state $x(t)$, a new system state $x(t+\Delta t)$ is determined and a set of new events $\tilde{y}(t\rightarrow t+\Delta t)$ is prepared to be added to the register.
    2) The event register of the new system state is updated to $y(t+\Delta t)$ by incorporating $\tilde{y}(t\rightarrow t+\Delta t)$ storing the set of new events. These events are added simultaneously and there is NO temporal ordering to them, i.e., we identically consider them to have occurred at $t+\Delta t$. This was chosen to ensure consistency with how the system state is tracked and recorded for simulation outputs.
    
        *What does this mean for practical purposes?* - Suppose the triggering event for a pyro's ignition is an orifice opening with time delay of 0 seconds. If the orifice opens due to reaching a pressure differential at time $t$, then the event register at will record this opening event at $t$, the pyro will ignite during the update procedure of the next timestep at $t+\Delta t$, and the event register will record this ignition event at $t+\Delta t$.

        *What happens with multi-stage integrators (RK4 and RKF) internally in the code?* - The same update procedure is used during each of the stages (fractions of $\Delta t$), but only the new events resulting from the final state update (using an increment calculated as a linear combination of stages) are what is recorded in the event register.

* If a user-specified triggering event does not match this formatting, it will not be found because the system itself will never generate the erroneous event.
    * NOTE: This is an intended side-effect of not requiring events to be present - *ex. if an orifice is not opened, then absent a secondary ignition mechanism, pyrotechnic materials in the downstream chamber should not ignite.*

# **Auxiliary Input Files** (*These Should Rarely Be Edited*)

## Parameter Files

### Specie Repository File(s)

Only one JSON file, known as the **species_library** is supplied as input to AIPP. This file acts as an index specifying the set of chemical species to be used in the simulation and their thermophysical properties.

While we would discourage it, this file can be edited to change...

* The set of species being modeled.
* The types of thermodynamic models (*heat capacity, compressibility, etc.*) being used for the modeled species.
* Update the property files being used for individual species.

Best practice is to create a new species_library file and edit the values within that copy.

The required fields in a species_library are:

* **modeled_species** - An array of the names of the species that will be modeled in the simulation, this must be a subset of the *available_species*.
    * NOTE: *The default set of available and modeled species are identically:* **Ar, CO, CO2, H2, H2O, He, N2, N2O, O2**.
    * NOTE: *As part of the initialization, additional wildcard species are automatically generated for each unique pyro formulation found within the system. These represent the components of the combusted gas mixture that are do not belong to set of modeled species and are typically present in trace amounts (mole fractions < 1%).*
* **global_thermo_models** - A set of selectors that specify the global thermodynamic models for the species. If "per_specie" is selected, the overrides will be used for each individual specie (e.g. ideal gas pressure EoS for a subset of the species).
* **available_species** - A set of named species that contain:
    * **property_file** - The property file storing all information about the specie. *These are generated using a Scilab script that collates information from [NIST](https://webbook.nist.gov/chemistry/form-ser/) and other sources.*
        * NOTE: *For reproducibility reasons, the individual property files should never be directly edited. Generate new versions (which will automatically include the date of creation) using the Scilab script and edit the species_library file to point at the new versions.*
    * **THERMODYNAMIC_MODEL_OVERRIDES** - Choices for thermodynamic models when using "per_specie" for the global models.

#### Example JSON for a complete **species_library**

The below will consider only the species *Ar*, *CO*, and *CO2*, globally enforce the use of *poly_4* models for heat capacitiees (pulling their individual *poly_4* models from each property file), and globally enforce the use of *lookup2D_240by240* models for compressibilities (pulling their individual *lookup2D_240by240* models from each property file).

```json
{
 "modeled_species":
    [
        "Ar",
        "CO",
        "CO2"
    ],
 "global_thermo_models":
    {
        "Cp_model":
        {
            "choice":"poly_4",
            "options":
                [
                    "Shomate",
                    "AIPP_Shomate",
                    "poly_4",
                    "poly_2",
                    "per_specie",
                    "poly_2_cpmw"
                ]
        },
        "compressibility_factor_Z_model":
        {
            "choice":"lookup2D_240by240",
            "options":
                [
                    "lookup2D_240by240",
                    "ideal",
                    "LIVBAG_VdW",
                    "per_specie"
                ]
        }
    },
 "available_species":
     {
        "Ar":
        {
            "property_file":"species_repository/gas_properties_Ar_2025-04-09.json",
            "Cp_model":"poly_4",
            "compressibility_factor_Z_model":"lookup2D_240by240"
        },
        "CO":
        {
            "property_file":"species_repository/gas_properties_CO_2025-04-09.json",
            "Cp_model":"Shomate",
            "compressibility_factor_Z_model":"ideal"
        },
        "CO2":
        {
            "property_file":"species_repository/gas_properties_CO2_2025-04-09.json",
            "Cp_model":"poly_2",
            "compressibility_factor_Z_model":"lookup2D_240by240"
        },
     }
}
```

#### Example JSON for a complete **SPECIE_properties**

The example property file is for Argon (Ar).

*The example property file has had the entries in the "lookup2D_240by240" in the "compressibility_factor_Z_models" reduced for ease of presentation.*

```json
{
  "physical_properties": {
    "name": "Ar",
    "chemical_formula": "Ar",
    "atom_balance": {
      "Ar": 1
    },
    "molar_mass": 39.948,
    "molar_mass_units": "g\/mol",
    "phase": "gas"
  },
  "Cp_models": {
    "Shomate": {
      "N_intervals": 1,
      "global_params": {
        "T_characteristic": 1000,
        "T_units": "K",
        "Cp_units": "J\/(mol * K)",
        "h_units": "kJ\/mol",
        "s_units": "J\/(mol * K)",
        "T_ref": 298.15,
        "h_ref": 0,
        "s_ref": 154.84
      },
      "param_intervals": {
        "interval": {
          "bounded_below": false,
          "lb": 298,
          "bounded_above": false,
          "ub": 6000
        },
        "A": 20.786,
        "B": 2.825911e-07,
        "C": -1.464191e-07,
        "D": 1.092131e-08,
        "E": -3.661371e-08,
        "F": -6.19735,
        "G": 179.999,
        "H": 0
      }
    },
    "AIPP_Shomate": {
      "N_intervals": 1,
      "global_params": {
        "T_characteristic": 1000,
        "T_units": "K",
        "Cp_units": "nondimensional, output=Cp(T)\/Ru",
        "h_units": "nondimensional, output=h(T)\/RuT",
        "s_units": "nondimensional, output=s(T)\/Ru",
        "T_ref": 298.15,
        "h_ref": 0,
        "s_ref": 18.6229714548157
      },
      "param_intervals": {
        "interval": {
          "bounded_below": false,
          "lb": 298,
          "bounded_above": false,
          "ub": 6000
        },
        "A_nd": 2.499981171918104,
        "B_nd": 3.39878971111145e-08,
        "C_nd": -1.761016998023641e-08,
        "D_nd": 1.313531673851674e-09,
        "E_nd": -4.403617128551409e-09,
        "h_ref_nd": -0.001259980398748952,
        "s_ref_nd": 18.62227198273527
      }
    },
    "poly_4": {
      "N_intervals": 2,
      "global_params": {
        "T_characteristic": 1000,
        "Q": 4,
        "continuity_order": 1,
        "T_units": "K",
        "Cp_units": "nondimensional, output=Cp(T)\/Ru",
        "h_units": "nondimensional, output=h(T)\/RuT",
        "s_units": "nondimensional, output=s(T)\/Ru",
        "T_ref": 298.15,
        "h_ref": 0,
        "s_ref": 18.6229714548157
      },
      "param_intervals": [
        {
          "interval": {
            "bounded_below": false,
            "lb": 100,
            "bounded_above": true,
            "ub": 1500
          },
          "a_0": 2.499981029396997,
          "a_1": 5.223442332463115e-07,
          "a_2": -6.690809733245671e-07,
          "a_3": 3.856570433731336e-07,
          "a_4": -8.352226097984834e-08,
          "h_ref_nd": -4.95371733593378,
          "s_ref_nd": 15.89248436571358
        },{
          "interval": {
            "bounded_below": true,
            "lb": 1500,
            "bounded_above": false,
            "ub": 6000
          },
          "a_0": 2.499981169925593,
          "a_1": 3.362680873414043e-08,
          "a_2": -1.690812555960885e-08,
          "a_3": 1.133124028435007e-09,
          "a_4": 1.374723533809306e-11,
          "h_ref_nd": 2.003067934222119,
          "s_ref_nd": 22.66255880506491
        }
      ]
    },
    "poly_2": {
      "N_intervals": 2,
      "global_params": {
        "T_characteristic": 1000,
        "Q": 2,
        "continuity_order": 1,
        "T_units": "K",
        "Cp_units": "nondimensional, output=Cp(T)\/Ru",
        "h_units": "nondimensional, output=h(T)\/RuT",
        "s_units": "nondimensional, output=s(T)\/Ru",
        "T_ref": 298.15,
        "h_ref": 0,
        "s_ref": 18.6229714548157
      },
      "param_intervals": [
        {
          "interval": {
            "bounded_below": false,
            "lb": 100,
            "bounded_above": true,
            "ub": 1500
          },
          "a_0": 2.499981113982052,
          "a_1": 1.217157658403496e-07,
          "a_2": -4.790693104193554e-08,
          "h_ref_nd": -4.953717391164905,
          "s_ref_nd": 15.89248433131295
        },{
          "interval": {
            "bounded_below": true,
            "lb": 1500,
            "bounded_above": false,
            "ub": 6000
          },
          "a_0": 2.499981213816783,
          "a_1": -1.139722201747895e-08,
          "a_2": -3.535928839403317e-09,
          "h_ref_nd": 2.003067935267141,
          "s_ref_nd": 22.66255880653008
        }
      ]
    },
    "poly_2_cpmw": {
      "N_intervals": 2,
      "global_params": {
        "T_characteristic": 1000,
        "Q": 2,
        "continuity_order": 1,
        "T_units": "K",
        "Cp_units": "nondimensional, output=Cp(T)\/Ru",
        "h_units": "nondimensional, output=h(T)\/RuT",
        "s_units": "nondimensional, output=s(T)\/Ru",
        "T_ref": 298.15,
        "h_ref": 2499.962252671243,
        "s_ref": 0
      },
      "param_intervals": [
        {
          "interval": {
            "bounded_below": false,
            "lb": 100,
            "bounded_above": true,
            "ub": 1500
          },
          "a_0": 2.49998112035614,
          "a_1": 0,
          "a_2": 0,
          "h_ref_nd": 2.49992486635362,
          "s_ref_nd": -2.731045699328736
        },{
          "interval": {
            "bounded_below": true,
            "lb": 1500,
            "bounded_above": false,
            "ub": 6000
          },
          "a_0": 2.49998112035614,
          "a_1": 0,
          "a_2": 0,
          "h_ref_nd": 2.499977370089306,
          "s_ref_nd": 4.039028676403436
        }
      ]
    }
  },
  "compressibility_factor_Z_models": {
    "ideal": {
      "model_params": {},
      "model_coeffs": {}
    },
    "lookup2D_240by240": {
      "model_params": {
        "Zmin": 0.5,
        "N_densities": 2,
        "N_temperatures": 3,
        "ordering": "temperatures (Kelvin) by densities (moles\/meter^3)",
        "densities": [1, 5],
        "temperatures": [300, 400, 500]
      },
      "model_coeffs": {
        "Z_lookup": [
          [1,1],
          [1,1],
          [1,1]
        ]
      }
    },
    "LIVBAG_VdW": {
      "model_params": {
        "Zmin": 0.5,
        "Q_a": 2,
        "Q_b": 2,
        "T_characteristic": 1,
        "rho_characteristic": 1,
        "T_units": "K",
        "rho_units": "mol\/m^3"
      },
      "model_coeffs": {
        "a_0": 0.1527,
        "a_1": -2.209e-06,
        "a_2": 5.694e-11,
        "b_0": 4.4e-05,
        "b_1": -1.284e-09,
        "b_2": 2.674e-14
      }
    }
  }
}
```

### Pyro Formulations File

Each pyrotechnic formulation entry will contain the following fields...

* **gas_yields** - the molar yields of the gas mixture per mass of pyro combusted.
    * The species listed must be a subset of the *modeled_species* in the *species_library* JSON.
* **Temperature** - the adiabatic flame temperature.
* **Density** - the mass density.
* **reference_burn_rate** - the burn rate of the pyro at the reference pressure.
* **burn_rate_exponent** - the pressure exponent.
* **burn_rate_temperature_sensitivity** - the temperature sensitivity.
* **HEX** - the adiabatic heat of explosion as calculated by RPA.
* **wild_card** - the lumped thermophysical properties of the wildcard species produced by combustion.
    * **Cp/R** - the dimensionless constant-pressure heat capacity of the wildcard.
    * **molar_mass** - the molar mass of the mixture.
    * **wc_gas_yield** - the molar yield of wildcard gas per mass of pyro combusted.

#### Example JSON for a complete **pyro_formulations**

The below file contains two pyrotechnic material formulations (*PNP487A3Production_20250528* and *PNP524B10Production_20250528*).

```json
{
    "PNP487A3Production_20250528": {
        "gas_yields": {
            "H2O": "15.7344 mol/kg",
            "CO2": "4.2856 mol/kg",
            "N2": "10.3004 mol/kg",
            "H2": "0.5591 mol/kg",
            "CO": "0.7426 mol/kg"
        },
        "Temperature": "2082.475 K",
        "Density": "1.780 g/cm^3",
        "reference_burn_rate": "44.21 mm/s",
        "burn_rate_exponent": 0.520000,
        "burn_rate_temperature_sensitivity": "0.00191 1/K",
        "HEX": "3454.956 kJ/kg",
        "wild_card": {
            "Cp/R": 5.333000,
            "molar_mass": "74.239000 g/mol",
            "wc_gas_yield": "1.024700 mol/kg"
        }
    },
    "PNP524B10Production_20250528": {
        "gas_yields": {
            "H2O": "8.9796 mol/kg",
            "CO2": "3.1552 mol/kg",
            "N2": "10.3416 mol/kg",
            "H2": "8.1534 mol/kg",
            "CO": "8.4008 mol/kg"
        },
        "Temperature": "1582.503 K",
        "Density": "1.670 g/cm^3",
        "reference_burn_rate": "44.56 mm/s",
        "burn_rate_exponent": 0.310000,
        "burn_rate_temperature_sensitivity": "0.00000 1/K",
        "HEX": "2384.599 kJ/kg",
        "wild_card": {
            "Cp/R": 4.272000,
            "molar_mass": "36.486000 g/mol",
            "wc_gas_yield": "2.001700 mol/kg"
        }
    }
}
```

### Materials File

Each material entry will contain the following fields...

* **density** - the mass density.
* **specific_heat** - the specific heat in the mass-basis.
* **thermal_conductivity** - the thermal conductivity.

#### Example JSON for a complete **materials**

The below file contains two materials (*steel* and *copper*).

```json
    "steel":
    {
        "density": "7833.0 kg/m^3",
        "specific_heat": "510.0 J/(kg K)",
        "thermal_conductivity": "45.0 W/(m K)"
    },
    "copper":
    {
        "density": "8935 kg/m^3",
        "specific_heat": "384.603 J/(kg K)",
        "thermal_conductivity": "401.0 W/(m K)"
    }
```

## Configuration Files

### Reaction Network

This file specified a set of named reactions, each reaction has...

* **reactant_stoichiometries** - the integer number of molecules for each specie consumed by the reaction.
    * NOTE: *the species must belong to the set of modeled species in the species_library file.*
* **product_stoichiometries** - the integer number of molecules for each specie produced by the reaction.
    * NOTE: *the species must belong to the set of modeled species in the species_library file.*
* **reference_thermodynamics** - the standard-state definition and associated enthalpy and entropy changes when the reaction occurs. *These are not used and purely for bookkeeping purposes.*
* **rate_laws** - the specifications of the kinetic models used to specify the rate, options are...
    * **constant** - a constant rate. *(least-complex)*
    * **mass_action** - rates given by temperature-independent kinetic parameters and the law of mass-action.
    * **mass_action_arrhenius** - mass-action kinetics with temperature-dependent kinetic parameters and possibly non-integer reaction orders. *(most-complex)*

#### A brief aside about units for rate laws of varying order.

If using molar concentrations to describe the abundances of reacting chemical species in a mixture, then mass-action kinetics follow the form presented in the below table for varying reiaction orders.

<figure>
    <img src="./figures/rate_laws_and_orders.png" alt="Units of kinetic rate laws when using molar concentrations." style="width:75%"/>
    <figcaption>Units of kinetic rate laws when using molar concentrations.</figcaption>
</figure>

The below table demonstrates how to convert mass-action reactions using molar concentrations (or equivalently partial pressures) to the unit system used by AIPP, where all kinetic rate coefficients use units of **mols/s**.

The following quantities are assumed for the intensive description of [standard state](https://en.wikipedia.org/wiki/Standard_state):

* Temperature - \ $T_{0}=298.15~\text{K}$ \ *However, this may vary depending on NIST's definition for the specie.*
* Pressure - \ $P_{0}=1~\text{atm}$ \
* Molar Concentration - \ $[\mathrm{X}_{0}]=1~\text{mol/L}$ \

AIPP additionally defines a standard volume of \ $V_{\text{std}}=1~\text{m}^3$ \, which it calculates all volumes relative to. In other words, given a common intensive state, a system whose extent~(i.e. *volume*) is scaled by a factor of $\alpha$ will experience a number of reactive events that identically scales as $\alpha$.

<figure>
    <img src="./figures/rate_laws_and_orders_transformation.png" alt="Units of kinetic rate laws when using chemical activities, the kinetic rate coefficient provided to AIPP are at the far-right column." style="width:75%"/>
    <figcaption>Units of kinetic rate laws when using chemical activities, the kinetic rate coefficient provided to AIPP are at the far-right column.</figcaption>
</figure>

AIPP then uses the ideal chemical activities of the species for reactions

<figure>
    <img src="./figures/ideal_activities.png" alt="Ideal chemical activities." style="width:20%"/>
    <figcaption>Ideal chemical activities.</figcaption>
</figure>

while the nonideal chemical activities would be

<figure>
    <img src="./figures/general_activities.png" alt="Nonideal chemical activities." style="width:35%"/>
    <figcaption>Nonideal chemical activities.</figcaption>
</figure>

#### The *rate_laws* within a *reaction*.

The **rate_law** specifies the kinetics of the reaction, i.e. how the reaction flux depends on the state of the system.

* **constant** - reaction flux is a constant value.

    \ $j_{\text{fwd}}=k_{\text{fwd}}\times(V/V_{\text{std}})\quad\text{and}\quad j_{\text{rev}}=k_{\text{rev}}\times(V/V_{\text{std}})\quad$ \

    The parameters are...
    * **k_fwd** - the forward kinetic rate coefficient.
    * **k_rev** - the reverse kinetic rate coefficient.
```json
{
    "k_fwd": "1.0 mol/s",
    "k_rev": "0.1 mol/s"
}
```
* **mass_action** - the reaction flux is given by the law of mass action.

    \ $j_{\text{fwd}}=k_{\text{fwd}}\times(V/V_{\text{std}})\times\prod_{j\in\text{reactants}}a_j^{\nu_j^{-}}\quad\text{and}\quad j_{\text{rev}}=k_{\text{rev}}\times(V/V_{\text{std}})\times\prod_{j\in\text{products}}a_j^{\nu_j^{+}}\quad$ \

    The parameters are...
    * **k_fwd** - the forward kinetic parameter.
    * **k_rev** - the reverse kinetic parameter.
```json
{
    "k_fwd": "1.0 mol/s",
    "k_rev": "0.1 mol/s"
}
```
* **mass_action_arrhenius** - the reaction flux is given by the law of mass action by the forward kinetic parameter is temperature dependent, \ $K_{\text{fwd}}(T)$ \, and the orders of the participating species are not restricted to integers. This is the most complex form and captures the most diverse phenomenon - *ex. the activation energy can be used to suppress reactions at low temperatures*.

    \ $j_{\text{fwd}}=K_{\text{fwd}}(T)\times(V/V_{\text{std}})\times\prod_{j\in\text{reactants}}a_j^{n_j^{-}}\quad\text{and}\quad j_{\text{rev}}=k_{\text{rev}}\times(V/V_{\text{std}})\times\prod_{j\in\text{products}}a_j^{n_j^{+}}\quad$ \

    where

    \ $K_{\text{fwd}}(T)=k_{\text{fwd}}\times\exp[-E_{\text{activation}}/R_{U}T]\times(T/T_0)^{\beta}$ \.

    The parameters are...
    * **k_fwd** - the forward kinetic parameter (this is solely the leading term)
    * **k_rev** - the reverse kinetic parameter.
    * **E_activation** - the activation energy of the reaction.
    * **beta** - the power-law dependence for the temperature.
    * **reactant_orders** - the possibly non-integer orders of the reactants.
    * **product_orders** - the possibly non-integer orders of the products.
```json
{
    "k_fwd":"1.0E+4 mol/s",
    "k_rev":"1.0E-1 mol/s",
    "E_activation":"0.0E+0 J/mol",
    "beta": 0.0,
    "reactant_orders":
    {
        "H2": 1.3,
        "O2": 0.85
    },
    "product_orders":
    {
        "H2O": 1.1
    }
}
```

#### Example JSON for a complete **reaction_network**

The below file provides a reaction network consisting of two reactions *H2_combustion* and *CO_combustion*, each of which has three available rate laws - *constant*, *mass_action*, and *mass_action_arrhenius*.

```json
{
    "H2_combustion":
    {
        "reactant_stoichiometries":
        {
            "H2":2,
            "O2":1
        },
        "product_stoichiometries":
        {
            "H2O":2
        },
        "reference_thermodynamics":
        {
            "T_ref":"298.15 K",
            "P_ref":"101325 Pa",
            "delta_h_ref":"0.0E+0 J/mol",
            "delta_s_ref":"0.0E+0 J/(K mol)"
        },
        "rate_laws":
        {
            "constant":
            {
                "k_fwd":"1.0E+0 mol/s",
                "k_rev":"1.0E+0 mol/s"
            },
            "mass_action":
            {
                "k_fwd":"1.0E+4 mol/s",
                "k_rev":"1.0E-1 mol/s"
            },
            "mass_action_arrhenius":
            {
                "k_fwd":"1.0E+4 mol/s",
                "k_rev":"1.0E-1 mol/s",
                "E_activation":"0.0E+0 J/mol",
                "beta": 0.0,
                "reactant_orders":
                {
                    "H2": 1.0,
                    "O2": 0.5
                },
                "product_orders":
                {
                    "H2O": 1.0
                }
            }
        }

    },
    "CO_combustion":
    {
        "reactant_stoichiometries":
        {
            "CO":2,
            "O2":1
        },
        "product_stoichiometries":
        {
            "CO2":2
        },
        "reference_thermodynamics":
        {
            "T_ref":"298.15 K",
            "P_ref":"101325 Pa",
            "delta_h_ref":"0.0E+0 J/mol",
            "delta_s_ref":"0.0E+0 J/(K mol)"
        },
        "rate_laws":
        {
            "constant":
            {
                "k_fwd":"1.0E+0 mol/s",
                "k_rev":"1.0E-1 mol/s"
            },
            "mass_action":
            {
                "k_fwd":"1.0E+4 mol/s",
                "k_rev":"1.0E-1 mol/s"
            },
            "mass_action_arrhenius":
            {
                "k_fwd":"1.0E+4 mol/s",
                "k_rev":"1.0E-1 mol/s",
                "E_activation":"0.0E+0 J/mol",
                "beta": 0.0,
                "reactant_orders":
                {
                    "CO": 1.0,
                    "O2": 0.5
                },
                "product_orders":
                {
                    "CO2": 1.0
                }
            }
        }
    }
}
```

### Runge-Kutta-Fehlberg Configuration

The **RKF_config** JSON file specifies the parameters used for the adaptive time-stepping scheme ([Runge-Kutta-Fehlberg method](https://en.wikipedia.org/wiki/Runge%E2%80%93Kutta%E2%80%93Fehlberg_method)).

* **minimum_timestep** - The minimum allowed timestep.
* **maximum_timestep** - The maximum allowed timestep. 
    * NOTE: *If this is larger than the period between logging outputs, it will be replaced by that time.*
* **amount_tolerance** - The tolerance for changes in the moles of each individual specie within each chamber used by the RKF scheme.
* **energy_tolerance** - The tolerance for changes in the energy of the mixture within each chamber used by the RKF scheme.
* **maximum_factor** - The maximum scaling-factor the adaptive timestep can be increased by within the RKF scheme.

#### Example JSON for a complete **RKF_config**

```json
{
    "minimum_timestep": "1.0E-12 s",
    "maximum_timestep": "5.0E-3 s",
    "amount_tolerance": "1.0E-8 mol",
    "energy_tolerance": "1.0E+0 J",
    "maximum_factor": 1.025E+0
}
```

# **Output Files**

## Simulation Output

The simulation output is written to a JSON file.

The JSON file is organized as a collection of nested objects and can be parsed by any JSON reading utility to create a hierarchical data structure than can be directly queried.

Scilab Example - reading simulation outputs JSON file into a *struct* named "outputs".
```Scilab
outputs = fromJSON("simulation_outputs_file.json", "file")
```

If this does not work in Scilab, it is most likely caused by a bug in Scilab's JSON parser (*it is unable to parse empty arrays*). Try using the below function instead.
```Scilab
function outputs = readaipp3(filename)
    a = mgetl(filename);
    a = strsubst(a, '[]', '[""""]')
    outputs = fromJSON(a)
endfunction
```

### Output Fields

Assuming a system with...

* $N_{\text{species}}$ species (*including wildcards*)
* $N_{\text{chambers}}$ chambers, in the $j$th chamber there are
    * $N_{\text{pyros}}^j$ pyros, where the $k$th pyro is separated into $N_{\text{piles}}^{jk}$
    * $N_{\text{rxn}}^j$ active reactions
* $N_{\text{orifices}}$ orifices
* $N_{\text{walls}}$ walls
* $N_{\text{filters}}$ filters

was simulated and recorded $N_{\text{times}}$ outputs with $N_{\text{events}}$ occurring, the fields in the outputs are:

* **header** - a header storing information about the simulation.
    * **uuid** (*generated at runtime*) - a [universally unique identifier (uuid)](https://en.wikipedia.org/wiki/Universally_unique_identifier) for this simulation run. The UUID is unique to this run and distinct from all other simulation runs completed locally or on any other computer.
    * **request_number** (*copied from input file*) - the simulation request number.
    * **title** (*copied from input file*) - the title for the simulation.
    * **system** (*copied from input file*) - the system being simulated (e.g. inflator family).
    * **part_number** (*copied from input file*) - the part number of the system being simulated.
    * **description** (*copied from input file*) - the description of the system.
    * **operating_temperature** (*copied from input file when specified, otherwise "heterogeneous"*) - the operating temperatures of the system components.
    * **OS** (*determined at runtime*) - the operating system.
    * **version** (*determined at runtime*) - the version of AIPP.
    * **user** (*determined at runtime*) - the simulator's username.
    * **date** (*determined at runtime*) - the date of the simulation.
    * **time** (*determined at runtime*) - the time of the simulation.
* **outputs** - the outputs produced by the simulation.
    * **performance_outputs** - quantities summarizing the tank performance.
        * **pressure_absolute_max** - the maximum absolute pressure.
        * **pressure_gauge_max** - the maximum gauge pressure.
        * **t_pressure_max** - the time of the maximum pressure.
        * **molar_flow_max** - the maximum molar flow.
        * **t_molar_flow_max** - the time of the maximum molar flow.
        * **mass_flow_max** - the maximum mass flow.
        * **t_mass_flow_max** - the time of the maximum mass flow.
        * **inflating_flow_max** - the maximum inflating flow.
        * **t_inflating_flow_max** - the time of the maximum inflating flow.
        * **cp_inflating_flow_max** - the maximum cp inflating flow.
        * **t_cp_inflating_flow_max** - the time of the maximum cp inflating flow.
        * **mean_exit_gas_temp_max** - the maximum mean exit gas temperature.
        * **t_mean_exit_gas_temp_max** - the time of the maximum mean exit gas temperature.
        * **mean_cp_exit_gas_temp_max** - the maximum mean cp exit gas temperature.
        * **t_mean_cp_exit_gas_temp_max** - the time of the maximum mean cp exit gas temperature.
        * **mean_enthalpy_exit_gas_temp_max** - the maximum mean enthalpy exit gas temperature.
        * **t_mean_enthalpy_exit_gas_temp_max** - the time of the maximum mean enthalpy exit gas temperature.
        * **mean_exit_gas_temp** - the final mean exit gas temp.
        * **mean_cp_exit_gas_temp** - the final mean cp exit gas temp.
        * **mean_enthalpy_exit_gas_temp** - the final mean enthalpy exit gas temp.
        * **cumulative_mols** - the final cumulative mols.
        * **cumulative_inflating_flow** - the final cumulative inflating flow.
        * **cumulative_cp_inflating_flow** - the final cumulative inflating flow.
        * **Gt_10_50** - the Gt-slope from 10% to 50%.
        * **Gt_10_70** - the Gt-slope from 10% to 70%.
        * **Gt_10_90** - the Gt-slope from 10% to 90%.
        * **Gt_20_40** - the Gt-slope from 20% to 40%.
        * **Gt_25_50** - the Gt-slope from 25% to 50%.
        * **USCAR_10_50** - the USCAR-slope from 10% to 50%.
    * **event_outputs** - a record of the simulation events. This is an array of elements [$N_{\text{events}}$], where each element contains the following fields.
        * **name** - the name of the event.
        * **time** - the simulation time at which the event occurred.
        * **description** - a description of the event.
    * **total_time_steps** - total number of timesteps.
    * **time_units** - units for the time entries.
    * **times** - times of output entries [$N_{\text{times}}$].
    * **pressure_units** - units for the pressure entries.
    * **pressures** - chamber pressures [$N_{\text{chambers}}$ by $N_{\text{times}}$].
    * **gas_mass_units** - units for the gas mass entries.
    * **gas_masses** - chamber gas masses [$N_{\text{chambers}}$ by $N_{\text{times}}$].
    * **temperature_units** - units for the temperature entries.
    * **temperatures** - chamber temperatures [$N_{\text{chambers}}$ by $N_{\text{times}}$].
    * **energy_units** - units for the chamber energy entries.
    * **chamber_gas_energies** - chamber energies [$N_{\text{chambers}}$ by $N_{\text{times}}$].
    * **volume_units** - units for the volume energies.
    * **free_volumes** - chamber free volumes occupied by the gas [$N_{\text{chambers}}$ by $N_{\text{times}}$].
    * **reaction_names** - names of the reactions [$N_{\text{chambers}}$ by [$N_{\text{rxn}}^j$]].
    * **reaction_molar_production_units** - units for the reaction molar production rate entries.
    * **reaction_molar_production_rates** - reaction molar production rates [$N_{\text{chambers}}$ by [$N_{\text{rxn}}^j$ by $N_{\text{times}}$]].
    * **reaction_mass_production_units** - units for the reaction mass production rate entries.
    * **reaction_mass_production_rates** - reaction mass production rates [$N_{\text{chambers}}$ by [$N_{\text{rxn}}^j$ by $N_{\text{times}}$]].
    * **reaction_energy_production_units** - units for the reaction energy production rate entries.
    * **reaction_energy_production_rates** - reaction energy production rates [$N_{\text{chambers}}$ by [$N_{\text{rxn}}^j$ by $N_{\text{times}}$]].
    * **pyro_names** - names of the pyrotechnic materials [$N_{\text{chambers}}$ by [$N_{\text{pyros}}^j$]].
    * **burn_rate_units** - units for the burn rate entries.
    * **burn_rates** - burn rates [$N_{\text{chambers}}$ by [$N_{\text{pyros}}^j$ by $N_{\text{times}}$]].
    * **pyro_mass_units** - units for the pyro mass entries.
    * **pyro_masses** - pyro masses [$N_{\text{chambers}}$ by [$N_{\text{pyros}}^j$ by $N_{\text{times}}$]].
    * **pyro_mass_production_units** - units for the pyro mass production rate entries.
    * **pyro_mass_production_rates** - pyro mass production rates [$N_{\text{chambers}}$ by [$N_{\text{pyros}}^j$ by $N_{\text{times}}$]].
    * **pyro_energy_production_units** - units for the pyro energy production rate entries.
    * **pyro_energy_production_rates** - pyro energy production rates [$N_{\text{chambers}}$ by [$N_{\text{pyros}}^j$ by $N_{\text{times}}$]].
    * **burn_distance_units** - units for the pyro burn distance entries.
    * **burn_distances** - pyro burn distances [$N_{\text{chambers}}$ by [$N_{\text{pyros}}^j$ by [$N_{\text{pyros}}^{jk}$ by $N_{\text{times}}$]]].
    * **surface_area_units** - units for the pyro surface area entries.
    * **surface_areas** - pyro surface areas [$N_{\text{chambers}}$ by [$N_{\text{pyros}}^j$ by [$N_{\text{pyros}}^{jk}$ by $N_{\text{times}}$]]].
    * **mass_flow_units** - units for the orifice mass flow rate entries.
    * **mass_flows** - orifice mass flow rates [$N_{\text{orifices}}$ by $N_{\text{times}}$].
    * **exit_gas_temperature_units** - units for the orifice exit gas temperature entries.
    * **exit_gas_temperatures** - orifice exit gas temperatures [$N_{\text{orifices}}$ by $N_{\text{times}}$].
    * **energy_flow_units** - units for the orifice energy flow entries.
    * **energy_flows** - orifice energy flows [$N_{\text{orifices}}$ by $N_{\text{times}}$].
    * **flow_area_units** - units for the orifice flow area entries.
    * **flow_areas** - orifice flow areas [$N_{\text{orifices}}$ by $N_{\text{times}}$].
    * **filter_absorption_rate_units** - units for the filter absorption rate entries.
    * **filter_absorption_rates** - filter absorption rates [$N_{\text{orifices}}$ by $N_{\text{times}}$].
    * **filter_energy_units** - units for the filter energy entries.
    * **filter_energies** - filter energies [$N_{\text{orifices}}$ by $N_{\text{times}}$].
    * **filter_temperature_units** - units for the filter temperature entries.
    * **filter_temperatures** - filter temperatures [$N_{\text{orifices}}$ by $N_{\text{times}}$].
    * **chamber_mass_fractions** - mixture mass fractions in the chambers {$N_{\text{species}}$ by [$N_{\text{chambers}}$ by $N_{\text{times}}$]}.
    * **chamber_mole_fractions** - mixture mole fractions in the chambers {$N_{\text{species}}$ by [$N_{\text{chambers}}$ by $N_{\text{times}}$]}.
    * **orifice_mass_fractions** - flowing mixture mass fractions in the orifices {$N_{\text{species}}$ by [$N_{\text{orifices}}$ by $N_{\text{times}}$]}.
    * **orifice_mole_fractions** - flowing mixture mole fractions in the orifices {$N_{\text{species}}$ by [$N_{\text{orifices}}$ by $N_{\text{times}}$]}.
    * **wall_heat_units** - units for the wall heat entries.
    * **wall_left_heats** - heat added to the left BCs of the walls [$N_{\text{walls}}$ by $N_{\text{times}}$].
    * **wall_right_heats** - heat added to the right BCs of the walls [$N_{\text{walls}}$ by $N_{\text{times}}$].
    * **wall_energy_units** - units for the wall energy entries.
    * **wall_energies** - wall energies [$N_{\text{walls}}$ by $N_{\text{times}}$].
    * **wall_temperature_units** - units for the wall temperature entries.
    * **wall_temperatures** - wall temperatures [$N_{\text{walls}}$ by $N_{\text{times}}$].
    * **tank_outputs** - *the collection of outputs tracked for the chamber identified as the Tank.*
        * **pressure_absolute_unit** - units for the absolute tank pressure entries.
        * **pressure_absolute** - absolute tank pressures [$N_{\text{times}}$].
        * **pressure_gauge_unit** - units for the gauge tank pressure entries.
        * **pressure_gauge** - gauge tank pressures [$N_{\text{times}}$].
        * **mass_flow_unit** - units for the tank mass flow entries.
        * **mass_flow** - mass flows into the tank [$N_{\text{times}}$].
        * **molar_flow_unit** - units for the tank molar flow entries.
        * **molar_flow** - molar flows into the tank [$N_{\text{times}}$].
        * **mols_unit** - units for the tank moles entries.
        * **mols** - tank moles [$N_{\text{times}}$].
        * **cumulative_mols_unit** - units for the cumulative moles flowed into tank entries.
        * **cumulative_mols** - cumulative moles flowed into tank [$N_{\text{times}}$].
        * **cumulative_mole_fractions** - the cumulative composition of the mixture flowed into the tank {$N_{\text{species}}$ by [$1$ by $N_{\text{times}}$]}.
        * **energy_added_unit** - units for the tank energy added entries.
        * **energy_added** - energy added to the tank [$N_{\text{times}}$].
        * **exergy_added_unit** - units for the tank exergy added entries.
        * **exergy_added** - exergy added to the tank [$N_{\text{times}}$].
        * **cumulative_energy_added_unit** - units for the cumulative tank energy added entries.
        * **cumulative_energy_added** - cumulative energy added to the tank [$N_{\text{times}}$].
        * **cumulative_exergy_added_unit** - units for the cumulative tank exergy added entries.
        * **cumulative_exergy_added** - cumulative exergy added to the tank [$N_{\text{times}}$].
        * **inflating_flow_unit** - units for the inflating flow entries.
        * **inflating_flow** - inflating flow into tank [$N_{\text{times}}$].
        * **cp_inflating_flow_unit** - units for cp inflating flow entries.
        * **cp_inflating_flow** - cp inflating flow into tank [$N_{\text{times}}$].
        * **cumulative_inflating_flow_unit** - units for cumulative inflating flow entries.
        * **cumulative_inflating_flow** - cumulative inflating flow into tank [$N_{\text{times}}$]
        * **cumulative_cp_inflating_flow_unit** - units for cumulative cp inflating flow entries.
        * **cumulative_cp_inflating_flow** - cumulative cp inflating flow into tank [$N_{\text{times}}$].
        * **mean_exit_gas_temp_unit** - units for exit gas temperature entries.
        * **mean_exit_gas_temp** - exit gas temperatures entering tank [$N_{\text{times}}$].
        * **mean_cp_exit_gas_temp_unit** - units for cp exit gas temperature entries.
        * **mean_cp_exit_gas_temp** - cp exit gas temperatures entering tank [$N_{\text{times}}$].
        * **mean_enthalpy_exit_gas_temp_unit** - units for enthalpy exit gas temperature entries.
        * **mean_enthalpy_exit_gas_temp** - enthalpy exit gas temperatures entering tank [$N_{\text{times}}$].

## Log File

Below is an example log file for a system consisting of 6 chambers divided into two 3 chamber subsystems (A and B), where for each subsystem the chambers are connected serially (1>2>3 and 4>5>6). The subsystems are identical except for the gas compositions of the second chamber in each subsystem (2 and 5), reactive O2 for subsystem A and inert N2 for subsystem B, respectively. Due to burning a fuel-rich pyro in the first chamber of each subsystem (1 and 4), the final orifices leading to the subsystems' tanks (3 and 6) are subject to different pressure differentials and have different opening behaviors.

The sections of the log file are the following...

1) **Summary of time specifications (*lines 1-5*):** displays the time specifications.
2) **Summary of the system thermophysics (*lines 6-80*):** displays the system thermophysics specifications (species organized by phase, their basic properties, and the thermodynamic models being used).
3) **Summary of the reaction network (*lines 81-93*):** the reaction specifications, as well as the active reactions, their stoichiometries, standard-state Gibbs free energies, and the choice of kinetic model.
4) **Summary of the assembly and its initial state (*lines 94-336*):** the summary of the assembly in its initial state, including details for each of the different elements.
5) **Logging outputs during time-integration (*lines 337-523*):** the intermediate outputs displayed to provide status updates during the course of the simulation.
6) **Summary of the assembly and its final state (*lines 524-765*):** the summary of the assembly in its initial state, including details for each of the different elements and some quantities that track behavior of dynamic components during the simulation.
7) **Summary of tank outputs and performance metrics (*lines 766-779*):** the quantities used for quantifying inflator performance.
8) **Summary of program timing (*lines 780-790*):** a breakdown of the walltime used for the simulation.


```{.txt .numberLines}
time specs: 
    run simulation: TRUE
    output time step: 10.0 ms
    initial simulation time step: 1.0 us
    simulation end time: 100.0 ms
system_thermophysics: 
    N_total_species: 12
        gas phase species (12):
            ===[ Ar ]===
              Physical Properties:
                Molar Mass = 3.9948e-2 kg/mol
              Thermodynamic Models:
                Heat Capacity: Polynomial (order = 4)
                Compressibility: Real 2D-Lookup (240 temperatures by 240 densities)
            ===[ CO ]===
              Physical Properties:
                Molar Mass = 2.8009e-2 kg/mol
              Thermodynamic Models:
                Heat Capacity: Polynomial (order = 4)
                Compressibility: Real 2D-Lookup (240 temperatures by 240 densities)
            ===[ CO2 ]===
              Physical Properties:
                Molar Mass = 4.4008e-2 kg/mol
              Thermodynamic Models:
                Heat Capacity: Polynomial (order = 4)
                Compressibility: Real 2D-Lookup (240 temperatures by 240 densities)
            ===[ H2 ]===
              Physical Properties:
                Molar Mass = 2.014e-3 kg/mol
              Thermodynamic Models:
                Heat Capacity: Polynomial (order = 4)
                Compressibility: Real 2D-Lookup (240 temperatures by 240 densities)
            ===[ H2O ]===
              Physical Properties:
                Molar Mass = 1.8013e-2 kg/mol
              Thermodynamic Models:
                Heat Capacity: Polynomial (order = 4)
                Compressibility: Real 2D-Lookup (240 temperatures by 240 densities)
            ===[ He ]===
              Physical Properties:
                Molar Mass = 4.002e-3 kg/mol
              Thermodynamic Models:
                Heat Capacity: Polynomial (order = 4)
                Compressibility: Real 2D-Lookup (240 temperatures by 240 densities)
            ===[ N2 ]===
              Physical Properties:
                Molar Mass = 2.8012e-2 kg/mol
              Thermodynamic Models:
                Heat Capacity: Polynomial (order = 4)
                Compressibility: Real 2D-Lookup (240 temperatures by 240 densities)
            ===[ N2O ]===
              Physical Properties:
                Molar Mass = 4.4011e-2 kg/mol
              Thermodynamic Models:
                Heat Capacity: Polynomial (order = 4)
                Compressibility: Real 2D-Lookup (240 temperatures by 240 densities)
            ===[ O2 ]===
              Physical Properties:
                Molar Mass = 3.1998e-2 kg/mol
              Thermodynamic Models:
                Heat Capacity: Polynomial (order = 4)
                Compressibility: Real 2D-Lookup (240 temperatures by 240 densities)
            ===[ wc_PIP1226H_20250528 ]===
              Physical Properties:
                Molar Mass = 5.0729e-2 kg/mol
              Thermodynamic Models:
                Heat Capacity: Constant
                Compressibility: Ideal
            ===[ wc_PNP524B10Production_20250528 ]===
              Physical Properties:
                Molar Mass = 3.6486e-2 kg/mol
              Thermodynamic Models:
                Heat Capacity: Constant
                Compressibility: Ideal
            ===[ wc_PNA24B_20250528 ]===
              Physical Properties:
                Molar Mass = 6.119e-2 kg/mol
              Thermodynamic Models:
                Heat Capacity: Constant
                Compressibility: Ideal
reaction_network: 
    switch (on/off): on
    enforce LDB: on
    speed_scaling: 1.0e-5
    N_reactions: 2
        H2_combustion
          2 H2  +  1 O2   <--->   2 H2O
            dG_std = -4.5716e5 J/mol at T = 298.15 K
            Mass-Action
        CO_combustion
          2 CO  +  1 O2   <--->   2 CO2
            dG_std = -5.1446e5 J/mol at T = 298.15 K
            Mass-Action
assembly: 
    chambers: 
        chamber 1: 
            [ Chamber 1 - Initiator ]
            Initial Pressure       86299.0 Pa
            Initial Temperature      294.15 K
            Initial Energy       -3.7698e-2 J
            Initial Enthalpy     -1.7743e-3 J
            Specified Volume       6.0e-7 m^3
            Initial Free Volume 4.1615e-7 m^3
            Initial Gas Composition: 
                Gas Component                     Mass (g)      Moles    PPM
                Ar                              5.86773e-6 1.46884e-7  10000
                CO                                     0.0        0.0      0
                CO2                                    0.0        0.0      0
                H2                                     0.0        0.0      0
                H2O                                    0.0        0.0      0
                He                                     0.0        0.0      0
                N2                              3.20932e-4  1.1457e-5 780000
                N2O                                    0.0        0.0      0
                O2                              9.86999e-5 3.08457e-6 210000
                wc_PIP1226H_20250528                   0.0        0.0      0
                wc_PNP524B10Production_20250528        0.0        0.0      0
                wc_PNA24B_20250528                     0.0        0.0      0
            Pyros: 
                pyro 1: 
                    Generant PIP1226H_20250528
                    HEX      1.4002e6 J/kg
                    Density  2910.0 kg/m^3
                    Mass     5.35e-4 kg   
                    Shape: 
                        Shape  Sphere  
                        Radius 4.0e-4 m
            Reactions: 
                Reaction 1, H2_combustion: 
                  2 H2  +  1 O2   <--->   2 H2O
                  dG_std = -4.575e5 J/mol at T = 294.1 K
                  K_eq = 1.0e30
                  Q (reaction quotient) = 1.0
                  dG (= dG_std + RT * logQ) = -4.575e5 J/mol
                  j_fwd = 0.0 mol/s
                  j_rev = 0.0 mol/s
                  j_net = 0.0 mol/s
                  molar_production_rate = -0.0 mol/s
                Reaction 2, CO_combustion: 
                  2 CO  +  1 O2   <--->   2 CO2
                  dG_std = -5.152e5 J/mol at T = 294.1 K
                  K_eq = 1.0e30
                  Q (reaction quotient) = 1.0
                  dG (= dG_std + RT * logQ) = -5.152e5 J/mol
                  j_fwd = 0.0 mol/s
                  j_rev = 0.0 mol/s
                  j_net = 0.0 mol/s
                  molar_production_rate = -0.0 mol/s

        chamber 2: 
            [ Chamber 2 - Igniter Can ]
            Initial Pressure         8.7e4 Pa
            Initial Temperature      294.15 K
            Initial Energy         -0.58333 J
            Initial Enthalpy     -2.0031e-2 J
            Specified Volume     9.235e-6 m^3
            Initial Free Volume 6.4726e-6 m^3
            Initial Gas Composition: 
                Gas Component                     Mass (g)      Moles    PPM
                Ar                              5.98059e-3 1.49709e-4 650000
                CO                                     0.0        0.0      0
                CO2                                    0.0        0.0      0
                H2                                     0.0        0.0      0
                H2O                                    0.0        0.0      0
                He                              2.30437e-4 5.75805e-5 250000
                N2                                     0.0        0.0      0
                N2O                                    0.0        0.0      0
                O2                              7.36984e-4 2.30322e-5 100000
                wc_PIP1226H_20250528                   0.0        0.0      0
                wc_PNP524B10Production_20250528        0.0        0.0      0
                wc_PNA24B_20250528                     0.0        0.0      0
            Pyros: 
                pyro 1: 
                    Generant PNP524B10Production_20250528
                    HEX      -2.477e6 J/kg   
                    Density  1651.0 kg/m^3   
                    Mass     3.8007e-3 kg
                    Shape: 
                        Wafer_summary
                pyro 2: 
                    Generant PNA24B_20250528
                    HEX      -2.9972e6 J/kg 
                    Density  1520.0 kg/m^3  
                    Mass     6.9982e-4 kg   
                    Shape: 
                        Wafer_summary
            Reactions: 
                Reaction 1, H2_combustion: 
                  2 H2  +  1 O2   <--->   2 H2O
                  dG_std = -4.575e5 J/mol at T = 294.1 K
                  K_eq = 1.0e30
                  Q (reaction quotient) = 1.0
                  dG (= dG_std + RT * logQ) = -4.575e5 J/mol
                  j_fwd = 0.0 mol/s
                  j_rev = 0.0 mol/s
                  j_net = 0.0 mol/s
                  molar_production_rate = -0.0 mol/s
                Reaction 2, CO_combustion: 
                  2 CO  +  1 O2   <--->   2 CO2
                  dG_std = -5.152e5 J/mol at T = 294.1 K
                  K_eq = 1.0e30
                  Q (reaction quotient) = 1.0
                  dG (= dG_std + RT * logQ) = -5.152e5 J/mol
                  j_fwd = 0.0 mol/s
                  j_rev = 0.0 mol/s
                  j_net = 0.0 mol/s
                  molar_production_rate = -0.0 mol/s

        chamber 3: 
            [ Chamber 3 - Restricted Until Extinguishment ]
            Initial Pressure      8.7e4 Pa
            Initial Temperature   294.15 K
            Initial Energy       -90.123 J
            Initial Enthalpy     -3.0947 J
            Specified Volume    1.0e-3 m^3
            Initial Free Volume 1.0e-3 m^3
            Initial Gas Composition: 
                Gas Component                     Mass (g)      Moles    PPM
                Ar                                0.923991 2.31299e-2 650000
                CO                                     0.0        0.0      0
                CO2                                    0.0        0.0      0
                H2                                     0.0        0.0      0
                H2O                                    0.0        0.0      0
                He                              3.56022e-2  8.8961e-3 250000
                N2                                     0.0        0.0      0
                N2O                                    0.0        0.0      0
                O2                                0.113863 3.55844e-3 100000
                wc_PIP1226H_20250528                   0.0        0.0      0
                wc_PNP524B10Production_20250528        0.0        0.0      0
                wc_PNA24B_20250528                     0.0        0.0      0
            Pyros: 
                NONE
            Reactions: 
                Reaction 1, H2_combustion: 
                  2 H2  +  1 O2   <--->   2 H2O
                  dG_std = -4.575e5 J/mol at T = 294.1 K
                  K_eq = 1.0e30
                  Q (reaction quotient) = 1.0
                  dG (= dG_std + RT * logQ) = -4.575e5 J/mol
                  j_fwd = 0.0 mol/s
                  j_rev = 0.0 mol/s
                  j_net = 0.0 mol/s
                  molar_production_rate = -0.0 mol/s
                Reaction 2, CO_combustion: 
                  2 CO  +  1 O2   <--->   2 CO2
                  dG_std = -5.152e5 J/mol at T = 294.1 K
                  K_eq = 1.0e30
                  Q (reaction quotient) = 1.0
                  dG (= dG_std + RT * logQ) = -5.152e5 J/mol
                  j_fwd = 0.0 mol/s
                  j_rev = 0.0 mol/s
                  j_net = 0.0 mol/s
                  molar_production_rate = -0.0 mol/s

        chamber 4: 
            [ Chamber 4 - 60L Tank ]
            Initial Pressure      8.7e4 Pa
            Initial Temperature   294.15 K
            Initial Energy       -5479.0 J
            Initial Enthalpy     -257.81 J
            Specified Volume    6.0e-2 m^3
            Initial Free Volume 6.0e-2 m^3
            Initial Gas Composition: 
                Gas Component                   Mass (g)      Moles    PPM
                Ar                              0.852832 2.13485e-2  10000
                CO                                   0.0        0.0      0
                CO2                                  0.0        0.0      0
                H2                                   0.0        0.0      0
                H2O                                  0.0        0.0      0
                He                                   0.0        0.0      0
                N2                               54.4194    1.94272 910000
                N2O                                  0.0        0.0      0
                O2                               5.46489   0.170788  80000
                wc_PIP1226H_20250528                 0.0        0.0      0
                wc_PNP524B10Production_20250528      0.0        0.0      0
                wc_PNA24B_20250528                   0.0        0.0      0
            Pyros: 
                NONE
            Reactions: 
                Reaction 1, H2_combustion: 
                  2 H2  +  1 O2   <--->   2 H2O
                  dG_std = -4.575e5 J/mol at T = 294.1 K
                  K_eq = 1.0e30
                  Q (reaction quotient) = 1.0
                  dG (= dG_std + RT * logQ) = -4.575e5 J/mol
                  j_fwd = 0.0 mol/s
                  j_rev = 0.0 mol/s
                  j_net = 0.0 mol/s
                  molar_production_rate = -0.0 mol/s
                Reaction 2, CO_combustion: 
                  2 CO  +  1 O2   <--->   2 CO2
                  dG_std = -5.152e5 J/mol at T = 294.1 K
                  K_eq = 1.0e30
                  Q (reaction quotient) = 1.0
                  dG (= dG_std + RT * logQ) = -5.152e5 J/mol
                  j_fwd = 0.0 mol/s
                  j_rev = 0.0 mol/s
                  j_net = 0.0 mol/s
                  molar_production_rate = -0.0 mol/s

    orifices: 
        orifice 1: 
            Orifice area              3.14159e-6 m^2
            Number of Orifi                        1
            Discharge coefficient PRESSURE-DEPENDENT
            viscous flow factor               4.0e-1
            Opens on                        pressure
            Opens at                        2.5e7 Pa
        orifice 2: 
            Orifice area          4.18539e-5 m^2
            Number of Orifi                    1
            Discharge coefficient TIME-DEPENDENT
            viscous flow factor           4.0e-1
            Opens on                    pressure
            Opens at                    1.0e8 Pa
        orifice 3: 
            Orifice area                         6.36173e-5 m^2
            Number of Orifi                                   1
            Discharge coefficient                      CONSTANT
            viscous flow factor                          4.0e-1
            Opens on                                       time
            Opens at              0.0 s after C2P2_extinguished
    orifice_connections: 
        orifice 1 is connected from chamber 1 to chamber 2
        orifice 2 is connected from chamber 2 to chamber 3
        orifice 3 is connected from chamber 3 to chamber 4
    area_to_volume_ratios:
        Chamber Free Volume Vol. Surf. Area Tot. Flow Area (From) A/V (From) Tot. Flow Area (To) A/V (To)
        1       4.16e-7 m^3      2.7e-4 m^2           3.14e-6 m^2    1.17e-2             0.0 m^2      0.0
        2       6.47e-6 m^3     1.68e-3 m^2           4.19e-5 m^2    2.49e-2         3.14e-6 m^2  1.87e-3
        3        1.0e-3 m^3     4.84e-2 m^2           6.36e-5 m^2    1.32e-3         4.19e-5 m^2  8.65e-4
        4        6.0e-2 m^3       0.741 m^2               0.0 m^2        0.0         6.36e-5 m^2  8.58e-5
    wall_connections: 
        wall 1 is connected to chamber 1 on the left and has a constant temperature boundary condition on the right 
Full event register, N_events = 1
  Name     Simulation Time            Description
  SimStart          0.0 ms the simulation started
At time: 0.0 ms, pressures are: 8.62985e-2 MPa, 8.7e-2 MPa, 8.7e-2 MPa, 8.7e-2 MPa
Chamber                                    1         2         3      4
mf_Ar                                 1.0e-2      0.65      0.65 1.0e-2
mf_CO                                    0.0       0.0       0.0    0.0
mf_CO2                                   0.0       0.0       0.0    0.0
mf_H2                                    0.0       0.0       0.0    0.0
mf_H2O                                   0.0       0.0       0.0    0.0
mf_He                                    0.0      0.25      0.25    0.0
mf_N2                                   0.78       0.0       0.0   0.91
mf_N2O                                   0.0       0.0       0.0    0.0
mf_O2                                   0.21       0.1       0.1 8.0e-2
mf_wc_PIP1226H_20250528                  0.0       0.0       0.0    0.0
mf_wc_PNP524B10Production_20250528       0.0       0.0       0.0    0.0
mf_wc_PNA24B_20250528                    0.0       0.0       0.0    0.0
Amount (mols)                      1.4688e-5 2.3032e-4 3.5584e-2 2.1349
After t = 0.0 ms, there are N_events = 6
  Name              Simulation Time                                                                Description
  C1P1_ignited          0.102227 ms              pyro 1 in chamber 1 (5.35e-4 kg of PIP1226H_20250528) ignited
  O1_opened             0.209706 ms                         orifice 1 connecting chamber 1 to chamber 2 opened
  C2P2_ignited           1.21101 ms              pyro 2 in chamber 2 (6.9982e-4 kg of PNA24B_20250528) ignited
  C2P1_ignited           2.21243 ms pyro 1 in chamber 2 (3.8007e-3 kg of PNP524B10Production_20250528) ignited
  C1P1_extinguished      4.20905 ms         pyro 1 in chamber 1 (5.35e-4 kg of PIP1226H_20250528) extinguished
  O2_opened              6.17989 ms                         orifice 2 connecting chamber 2 to chamber 3 opened
At time: 10.0036 ms, pressures are: 4.80914 MPa, 5.50619 MPa, 1.44357 MPa, 8.7e-2 MPa
Chamber                                     1          2         3      4
mf_Ar                               7.7214e-7  1.2579e-5   0.26525 1.0e-2
mf_CO                               2.2021e-2    0.19536 9.3615e-2    0.0
mf_CO2                              1.5959e-3  8.0904e-2 4.7287e-2    0.0
mf_H2                                 0.29813    0.18856   0.10649    0.0
mf_H2O                                0.19388    0.23144   0.15179    0.0
mf_He                                     0.0  4.8332e-6   0.10202    0.0
mf_N2                               6.0227e-5    0.25697   0.13622   0.91
mf_N2O                                    0.0        0.0       0.0    0.0
mf_O2                              1.2061e-15 9.6636e-13 3.5522e-2 8.0e-2
mf_wc_PIP1226H_20250528               0.48432  5.8455e-4 3.9773e-2    0.0
mf_wc_PNP524B10Production_20250528        0.0  4.5506e-2 2.1257e-2    0.0
mf_wc_PNA24B_20250528                     0.0  6.4697e-4 7.7685e-4    0.0
Amount (mols)                        2.549e-4  2.9354e-3 8.7764e-2 2.1349
After t = 10.0036 ms, there are N_events = 0
At time: 20.1572 ms, pressures are: 3.41966 MPa, 6.12292 MPa, 2.73711 MPa, 8.7e-2 MPa
Chamber                                     1          2         3      4
mf_Ar                               7.7214e-7 1.2678e-12   0.16606 1.0e-2
mf_CO                               2.2021e-2    0.19431   0.11688    0.0
mf_CO2                              1.5959e-3  8.1573e-2 8.0053e-2    0.0
mf_H2                                 0.29813    0.18706   0.11975    0.0
mf_H2O                                0.19388     0.2332   0.20729    0.0
mf_He                                     0.0 4.8714e-13 6.3867e-2    0.0
mf_N2                               6.0227e-5      0.258   0.18668   0.91
mf_N2O                                    0.0        0.0       0.0    0.0
mf_O2                              1.9983e-21 1.0075e-12 2.6008e-3 8.0e-2
mf_wc_PIP1226H_20250528               0.48432 5.8917e-11 2.4911e-2    0.0
mf_wc_PNP524B10Production_20250528        0.0  4.5124e-2 3.1154e-2    0.0
mf_wc_PNA24B_20250528                     0.0  7.3582e-4 7.5856e-4    0.0
Amount (mols)                        2.549e-4  3.6513e-3   0.14019 2.1349
After t = 20.1572 ms, there are N_events = 0
At time: 30.0891 ms, pressures are: 2.64571 MPa, 4.49379 MPa, 3.43754 MPa, 8.7e-2 MPa
Chamber                                     1          2         3      4
mf_Ar                               7.7214e-7 6.7815e-18   0.12995 1.0e-2
mf_CO                               2.2021e-2    0.19334   0.13204    0.0
mf_CO2                              1.5959e-3  8.2009e-2 8.2572e-2    0.0
mf_H2                                 0.29813    0.18597   0.13262    0.0
mf_H2O                                0.19388    0.23453   0.21556    0.0
mf_He                                     0.0 2.6056e-18 4.9981e-2    0.0
mf_N2                               6.0227e-5    0.25856   0.20275   0.91
mf_N2O                                    0.0        0.0       0.0    0.0
mf_O2                              1.0063e-23 1.4259e-12 7.1258e-6 8.0e-2
mf_wc_PIP1226H_20250528               0.48432 3.1514e-16 1.9495e-2    0.0
mf_wc_PNP524B10Production_20250528        0.0  4.4782e-2 3.4258e-2    0.0
mf_wc_PNA24B_20250528                     0.0   8.044e-4 7.6018e-4    0.0
Amount (mols)                        2.549e-4  2.8663e-3   0.17914 2.1349
After t = 30.0891 ms, there are N_events = 0
At time: 40.007 ms, pressures are: 2.23778 MPa, 4.0394 MPa, 3.8434 MPa, 8.7e-2 MPa
Chamber                                    1          2         3      4
mf_Ar                              7.7214e-7 1.3405e-21   0.11461 1.0e-2
mf_CO                              2.2021e-2     0.1873    0.1391    0.0
mf_CO2                             1.5959e-3  8.4718e-2  8.259e-2    0.0
mf_H2                                0.29813    0.17923   0.13871    0.0
mf_H2O                               0.19388    0.24285   0.21806    0.0
mf_He                                    0.0 5.1504e-22 4.4079e-2    0.0
mf_N2                              6.0227e-5    0.26201   0.20945   0.91
mf_N2O                                   0.0        0.0       0.0    0.0
mf_O2                                    0.0 2.9167e-12 5.1338e-7 8.0e-2
mf_wc_PIP1226H_20250528              0.48432 6.2292e-20 1.7193e-2    0.0
mf_wc_PNP524B10Production_20250528       0.0  4.2663e-2 3.5437e-2    0.0
mf_wc_PNA24B_20250528                    0.0  1.2306e-3 7.7824e-4    0.0
Amount (mols)                       2.549e-4  2.6574e-3   0.20313 2.1349
After t = 40.007 ms, there are N_events = 1
  Name              Simulation Time                                                                     Description
  C2P1_extinguished       48.016 ms pyro 1 in chamber 2 (3.8007e-3 kg of PNP524B10Production_20250528) extinguished
At time: 50.0372 ms, pressures are: 2.01204 MPa, 3.99016 MPa, 3.98353 MPa, 8.7e-2 MPa
Chamber                                    1          2         3      4
mf_Ar                              7.7214e-7 6.4515e-23    0.1102 1.0e-2
mf_CO                              2.2021e-2    0.15639   0.14072    0.0
mf_CO2                             1.5959e-3  9.8593e-2 8.2776e-2    0.0
mf_H2                                0.29813    0.14467      0.14    0.0
mf_H2O                               0.19388    0.28542   0.21935    0.0
mf_He                                    0.0 2.4788e-23 4.2385e-2    0.0
mf_N2                              6.0227e-5    0.27971    0.2116   0.91
mf_N2O                                   0.0        0.0       0.0    0.0
mf_O2                                    0.0 4.9488e-11 4.2752e-7 8.0e-2
mf_wc_PIP1226H_20250528              0.48432  2.998e-21 1.6532e-2    0.0
mf_wc_PNP524B10Production_20250528       0.0  3.1807e-2 3.5631e-2    0.0
mf_wc_PNA24B_20250528                    0.0  3.4131e-3 8.1247e-4    0.0
Amount (mols)                       2.549e-4  2.5162e-3   0.21125 2.1349
After t = 50.0372 ms, there are N_events = 0
At time: 60.0285 ms, pressures are: 1.87575 MPa, 4.02005 MPa, 4.01524 MPa, 8.7e-2 MPa
Chamber                                    1          2         3      4
mf_Ar                              7.7214e-7 3.3908e-23   0.10932 1.0e-2
mf_CO                              2.2021e-2    0.11341   0.14066    0.0
mf_CO2                             1.5959e-3    0.11788 8.2984e-2    0.0
mf_H2                                0.29813  9.6645e-2   0.13982    0.0
mf_H2O                               0.19388    0.34459   0.22014    0.0
mf_He                                    0.0 1.3028e-23 4.2045e-2    0.0
mf_N2                              6.0227e-5    0.30431   0.21226   0.91
mf_N2O                                   0.0        0.0       0.0    0.0
mf_O2                                    0.0  1.7718e-9  4.242e-7 8.0e-2
mf_wc_PIP1226H_20250528              0.48432 1.5757e-21   1.64e-2    0.0
mf_wc_PNP524B10Production_20250528       0.0  1.6717e-2 3.5535e-2    0.0
mf_wc_PNA24B_20250528                    0.0  6.4468e-3 8.4648e-4    0.0
Amount (mols)                       2.549e-4  2.3771e-3   0.21295 2.1349
After t = 60.0285 ms, there are N_events = 0
At time: 70.036 ms, pressures are: 1.78325 MPa, 4.04319 MPa, 4.03991 MPa, 8.7e-2 MPa
Chamber                                    1          2         3      4
mf_Ar                              7.7214e-7 2.0144e-23   0.10867 1.0e-2
mf_CO                              2.2021e-2  9.4089e-2   0.14044    0.0
mf_CO2                             1.5959e-3    0.12655 8.3215e-2    0.0
mf_H2                                0.29813  7.5048e-2   0.13949    0.0
mf_H2O                               0.19388     0.3712   0.22096    0.0
mf_He                                    0.0 7.7399e-24 4.1796e-2    0.0
mf_N2                              6.0227e-5    0.31537   0.21284   0.91
mf_N2O                                   0.0        0.0       0.0    0.0
mf_O2                                    0.0  8.7175e-9 4.2753e-7 8.0e-2
mf_wc_PIP1226H_20250528              0.48432 9.3611e-22 1.6303e-2    0.0
mf_wc_PNP524B10Production_20250528       0.0  9.9313e-3 3.5401e-2    0.0
mf_wc_PNA24B_20250528                    0.0   7.811e-3 8.8402e-4    0.0
Amount (mols)                       2.549e-4  2.3323e-3   0.21422 2.1349
After t = 70.036 ms, there are N_events = 0
At time: 80.0095 ms, pressures are: 1.66517 MPa, 4.05612 MPa, 4.05517 MPa, 8.7e-2 MPa
Chamber                                    1          2         3      4
mf_Ar                              7.7214e-7        0.0   0.10828 1.0e-2
mf_CO                              2.2021e-2  8.6265e-2   0.14026    0.0
mf_CO2                             1.5959e-3    0.13006 8.3374e-2    0.0
mf_H2                                0.29813  6.6303e-2   0.13924    0.0
mf_H2O                               0.19388    0.38198   0.22152    0.0
mf_He                                    0.0        0.0 4.1647e-2    0.0
mf_N2                              6.0227e-5    0.31985   0.21321   0.91
mf_N2O                                   0.0        0.0       0.0    0.0
mf_O2                                    0.0  1.8776e-8 4.3122e-7 8.0e-2
mf_wc_PIP1226H_20250528              0.48432 6.7496e-22 1.6244e-2    0.0
mf_wc_PNP524B10Production_20250528       0.0  7.1839e-3 3.5305e-2    0.0
mf_wc_PNA24B_20250528                    0.0  8.3634e-3 9.0989e-4    0.0
Amount (mols)                       2.549e-4  2.3189e-3   0.21499 2.1349
After t = 80.0095 ms, there are N_events = 2
  Name              Simulation Time                                                        Description
  C2P2_extinguished      88.2366 ms pyro 2 in chamber 2 (6.9982e-4 kg of PNA24B_20250528) extinguished
  O3_opened              88.2519 ms                 orifice 3 connecting chamber 3 to chamber 4 opened
At time: 90.0033 ms, pressures are: 1.55372 MPa, 3.75344 MPa, 3.75104 MPa, 9.37522e-2 MPa
Chamber                                    1          2         3         4
mf_Ar                              7.7214e-7        0.0   0.10811 1.0597e-2
mf_CO                              2.2021e-2  8.4664e-2   0.14018 8.5334e-4
mf_CO2                             1.5959e-3    0.13078 8.3446e-2 5.0782e-4
mf_H2                                0.29813  6.4513e-2   0.13912 8.4698e-4
mf_H2O                               0.19388    0.38418   0.22178 1.3496e-3
mf_He                                    0.0        0.0 4.1581e-2 2.5318e-4
mf_N2                              6.0227e-5    0.32076   0.21338   0.90576
mf_N2O                                   0.0        0.0       0.0       0.0
mf_O2                                    0.0  2.3062e-8 3.5236e-7 7.9513e-2
mf_wc_PIP1226H_20250528              0.48432 6.2212e-22 1.6218e-2 9.8753e-5
mf_wc_PNP524B10Production_20250528       0.0  6.6215e-3  3.526e-2 2.1468e-4
mf_wc_PNA24B_20250528                    0.0  8.4764e-3 9.2182e-4  5.595e-6
Amount (mols)                       2.549e-4  2.1743e-3   0.20226    2.1479
After t = 90.0033 ms, there are N_events = 0
At time: 100.023 ms, pressures are: 1.49194 MPa, 2.38799 MPa, 2.38646 MPa, 0.12356 MPa
Chamber                                    1          2         3         4
mf_Ar                              7.7214e-7        0.0   0.10769 1.3288e-2
mf_CO                              2.2021e-2  8.4664e-2   0.13996 4.7022e-3
mf_CO2                             1.5959e-3    0.13078 8.3631e-2 2.8032e-3
mf_H2                                0.29813  6.4513e-2   0.13883 4.6659e-3
mf_H2O                               0.19388    0.38418   0.22242 7.4521e-3
mf_He                                    0.0        0.0 4.1418e-2 1.3936e-3
mf_N2                              6.0227e-5    0.32076    0.2138   0.88662
mf_N2O                                   0.0        0.0       0.0       0.0
mf_O2                                    0.0  9.3287e-9  4.836e-8 7.7315e-2
mf_wc_PIP1226H_20250528              0.48432 6.2212e-22 1.6155e-2 5.4357e-4
mf_wc_PNP524B10Production_20250528       0.0  6.6215e-3 3.5148e-2 1.1821e-3
mf_wc_PNA24B_20250528                    0.0  8.4764e-3  9.513e-4  3.131e-5
Amount (mols)                       2.549e-4  1.5083e-3   0.14185     2.209
final state: 
    assembly: 
        chambers: 
            chamber 1: 
                [ Chamber 1 - Initiator ]
                Final Pressure      1.4919e6 Pa
                Final Temperature      439.13 K
                Final Energy          -12.397 J
                Final Enthalpy        -11.466 J
                Specified Volume     6.0e-7 m^3
                Final Free Volume 5.6474e-7 m^3
                Final Gas Composition: 
                    Gas Component                     Mass (g)       Moles    PPM
                    Ar                              7.86241e-9 1.96816e-10      0
                    CO                              1.57214e-4  5.61307e-6  22020
                    CO2                             1.79023e-5    4.068e-7   1595
                    H2                              1.53046e-4  7.59913e-5 298126
                    H2O                              8.9019e-4  4.94193e-5 193880
                    He                                     0.0         0.0      0
                    N2                              4.30031e-7  1.53517e-8     60
                    N2O                                    0.0         0.0      0
                    O2                                     0.0         0.0      0
                    wc_PIP1226H_20250528            6.26251e-3   1.2345e-4 484315
                    wc_PNP524B10Production_20250528        0.0         0.0      0
                    wc_PNA24B_20250528                     0.0         0.0      0
                Pyros: 
                    pyro 1: 
                        Generant             PIP1226H_20250528                         
                        Initial Mass         5.35e-4 kg                                
                        Unburned Mass        0.0 kg                                    
                        Number of Piles      5                                         
                        Final Burn Distances 4.00185e-4 m, 4.00057e-4 m, 4.00062e-4 m, 4.00183e-4 m, 4.004e-4 m
                Reactions: 
                    Reaction 1, H2_combustion: 
                      2 H2  +  1 O2   <--->   2 H2O
                      dG_std = -4.441e5 J/mol at T = 439.1 K
                      K_eq = 1.0e30
                      Q (reaction quotient) = 1.0e30
                      dG (= dG_std + RT * logQ) = -1.919e5 J/mol
                      j_fwd = 0.0 mol/s
                      j_rev = 1.404e-34 mol/s
                      j_net = -1.404e-34 mol/s
                      molar_production_rate = 1.404e-34 mol/s
                    Reaction 2, CO_combustion: 
                      2 CO  +  1 O2   <--->   2 CO2
                      dG_std = -4.898e5 J/mol at T = 439.1 K
                      K_eq = 1.0e30
                      Q (reaction quotient) = 6.465e26
                      dG (= dG_std + RT * logQ) = -2.644e5 J/mol
                      j_fwd = 0.0 mol/s
                      j_rev = 3.651e-38 mol/s
                      j_net = -3.651e-38 mol/s
                      molar_production_rate = 3.651e-38 mol/s

            chamber 2: 
                [ Chamber 2 - Igniter Can ]
                Final Pressure       2.388e6 Pa
                Final Temperature      1743.1 K
                Final Energy          -169.68 J
                Final Enthalpy        -147.82 J
                Specified Volume   9.235e-6 m^3
                Final Free Volume 9.1834e-6 m^3
                Final Gas Composition: 
                    Gas Component                      Mass (g)       Moles    PPM
                    Ar                                      0.0         0.0      0
                    CO                               3.57656e-3  1.27695e-4  84663
                    CO2                              8.68059e-3  1.97252e-4 130780
                    H2                               1.95969e-4  9.73034e-5  64513
                    H2O                              1.04376e-2   5.7945e-4 384182
                    He                                      0.0         0.0      0
                    N2                               1.35521e-2  4.83795e-4 320761
                    N2O                                     0.0         0.0      0
                    O2                              4.50216e-10 1.40701e-11      0
                    wc_PIP1226H_20250528            4.76001e-23  9.3832e-25      0
                    wc_PNP524B10Production_20250528  3.64386e-4  9.98701e-6   6621
                    wc_PNA24B_20250528               7.82297e-4  1.27847e-5   8476
                Pyros: 
                    pyro 1: 
                        Generant             PNP524B10Production_20250528                
                        Initial Mass         3.8007e-3 kg                                
                        Unburned Mass        0.0 kg                                      
                        Number of Piles      5                                           
                        Final Burn Distances 1.25006e-3 m, 1.25009e-3 m, 1.25001e-3 m, 1.25013e-3 m, 1.25005e-3 m
                    pyro 2: 
                        Generant             PNA24B_20250528                             
                        Initial Mass         6.9982e-4 kg                                
                        Unburned Mass        0.0 kg                                      
                        Number of Piles      5                                           
                        Final Burn Distances 1.50001e-3 m, 1.50032e-3 m, 1.50001e-3 m, 1.50003e-3 m, 1.50001e-3 m
                Reactions: 
                    Reaction 1, H2_combustion: 
                      2 H2  +  1 O2   <--->   2 H2O
                      dG_std = -3.008e5 J/mol at T = 1743.0 K
                      K_eq = 1.034e9
                      Q (reaction quotient) = 1.605e8
                      dG (= dG_std + RT * logQ) = -2.7e4 J/mol
                      j_fwd = 4.665e-10 mol/s
                      j_rev = 7.24e-11 mol/s
                      j_net = 3.941e-10 mol/s
                      molar_production_rate = -3.941e-10 mol/s
                    Reaction 2, CO_combustion: 
                      2 CO  +  1 O2   <--->   2 CO2
                      dG_std = -2.639e5 J/mol at T = 1743.0 K
                      K_eq = 8.074e7
                      Q (reaction quotient) = 1.084e7
                      dG (= dG_std + RT * logQ) = -2.91e4 J/mol
                      j_fwd = 8.081e-10 mol/s
                      j_rev = 1.085e-10 mol/s
                      j_net = 6.996e-10 mol/s
                      molar_production_rate = -6.996e-10 mol/s

            chamber 3: 
                [ Chamber 3 - Restricted Until Extinguishment ]
                Final Pressure    2.3865e6 Pa
                Final Temperature    2017.5 K
                Final Energy        -8308.9 J
                Final Enthalpy      -5929.4 J
                Specified Volume   1.0e-3 m^3
                Final Free Volume  1.0e-3 m^3
                Final Gas Composition: 
                    Gas Component                     Mass (g)      Moles    PPM
                    Ar                                0.610233 1.52757e-2 107688
                    CO                                0.556063 1.98533e-2 139959
                    CO2                               0.522064  1.1863e-2  83630
                    H2                              3.96622e-2 1.96933e-2 138830
                    H2O                               0.568309   3.155e-2 222416
                    He                              2.35126e-2 5.87522e-3  41418
                    N2                                0.849545 3.03279e-2 213801
                    N2O                                    0.0        0.0      0
                    O2                              2.19504e-7 6.85993e-9      0
                    wc_PIP1226H_20250528              0.116251 2.29161e-3  16155
                    wc_PNP524B10Production_20250528   0.181911 4.98577e-3  35148
                    wc_PNA24B_20250528              8.25714e-3 1.34943e-4    951
                Pyros: 
                    NONE
                Reactions: 
                    Reaction 1, H2_combustion: 
                      2 H2  +  1 O2   <--->   2 H2O
                      dG_std = -2.691e5 J/mol at T = 2017.0 K
                      K_eq = 9.262e6
                      Q (reaction quotient) = 2.247e6
                      dG (= dG_std + RT * logQ) = -2.376e4 J/mol
                      j_fwd = 1.217e-6 mol/s
                      j_rev = 2.951e-7 mol/s
                      j_net = 9.215e-7 mol/s
                      molar_production_rate = -9.215e-7 mol/s
                    Reaction 2, CO_combustion: 
                      2 CO  +  1 O2   <--->   2 CO2
                      dG_std = -2.177e5 J/mol at T = 2017.0 K
                      K_eq = 4.337e5
                      Q (reaction quotient) = 3.134e5
                      dG (= dG_std + RT * logQ) = -5450.0 J/mol
                      j_fwd = 1.243e-6 mol/s
                      j_rev = 8.98e-7 mol/s
                      j_net = 3.448e-7 mol/s
                      molar_production_rate = -3.448e-7 mol/s

            chamber 4: 
                [ Chamber 4 - 60L Tank ]
                Final Pressure    1.2356e5 Pa
                Final Temperature    403.56 K
                Final Energy        -8201.5 J
                Final Enthalpy      -789.55 J
                Specified Volume   6.0e-2 m^3
                Final Free Volume  6.0e-2 m^3
                Final Gas Composition: 
                    Gas Component                     Mass (g)      Moles    PPM
                    Ar                                 1.17258 2.93527e-2  13287
                    CO                                0.290929 1.03871e-2   4702
                    CO2                               0.272508 6.19229e-3   2803
                    H2                              2.07582e-2  1.0307e-2   4665
                    H2O                               0.296523 1.64616e-2   7452
                    He                              1.23201e-2 3.07849e-3   1393
                    N2                                 54.8629    1.95855 886623
                    N2O                                    0.0        0.0      0
                    O2                                 5.46488   0.170788  77314
                    wc_PIP1226H_20250528             6.0913e-2 1.20075e-3    543
                    wc_PNP524B10Production_20250528 9.52733e-2 2.61123e-3   1182
                    wc_PNA24B_20250528              4.23207e-3 6.91627e-5     31
                Pyros: 
                    NONE
                Reactions: 
                    Reaction 1, H2_combustion: 
                      2 H2  +  1 O2   <--->   2 H2O
                      dG_std = -4.475e5 J/mol at T = 403.6 K
                      K_eq = 1.0e30
                      Q (reaction quotient) = 26.35
                      dG (= dG_std + RT * logQ) = -4.365e5 J/mol
                      j_fwd = 1.832e-5 mol/s
                      j_rev = 4.827e-34 mol/s
                      j_net = 1.832e-5 mol/s
                      molar_production_rate = -1.832e-5 mol/s
                    Reaction 2, CO_combustion: 
                      2 CO  +  1 O2   <--->   2 CO2
                      dG_std = -4.961e5 J/mol at T = 403.6 K
                      K_eq = 1.0e30
                      Q (reaction quotient) = 3.752
                      dG (= dG_std + RT * logQ) = -4.916e5 J/mol
                      j_fwd = 1.86e-5 mol/s
                      j_rev = 6.978e-35 mol/s
                      j_net = 1.86e-5 mol/s
                      molar_production_rate = -1.86e-5 mol/s

        orifices: 
            orifice 1: 
                opened at time:  2.097e-4 s
            orifice 2: 
                opened at time:  6.18e-3 s
            orifice 3: 
                opened at time:  8.825e-2 s
        final_area_to_volume_ratios:
            Chamber Free Volume Vol. Surf. Area Tot. Flow Area (From) A/V (From) Tot. Flow Area (To) A/V (To)
            1       5.65e-7 m^3      3.3e-4 m^2           3.14e-6 m^2    9.51e-3             0.0 m^2      0.0
            2       9.18e-6 m^3     2.12e-3 m^2           4.19e-5 m^2    1.97e-2         3.14e-6 m^2  1.48e-3
            3        1.0e-3 m^3     4.84e-2 m^2           6.36e-5 m^2    1.32e-3         4.19e-5 m^2  8.65e-4
            4        6.0e-2 m^3       0.741 m^2               0.0 m^2        0.0         6.36e-5 m^2  8.58e-5
        Event Log: 
            Full event register, N_events = 10
              Name              Simulation Time                                                                     Description
              SimStart                   0.0 ms                                                          the simulation started
              C1P1_ignited          0.102227 ms                   pyro 1 in chamber 1 (5.35e-4 kg of PIP1226H_20250528) ignited
              O1_opened             0.209706 ms                              orifice 1 connecting chamber 1 to chamber 2 opened
              C2P2_ignited           1.21101 ms                   pyro 2 in chamber 2 (6.9982e-4 kg of PNA24B_20250528) ignited
              C2P1_ignited           2.21243 ms      pyro 1 in chamber 2 (3.8007e-3 kg of PNP524B10Production_20250528) ignited
              C1P1_extinguished      4.20905 ms              pyro 1 in chamber 1 (5.35e-4 kg of PIP1226H_20250528) extinguished
              O2_opened              6.17989 ms                              orifice 2 connecting chamber 2 to chamber 3 opened
              C2P1_extinguished       48.016 ms pyro 1 in chamber 2 (3.8007e-3 kg of PNP524B10Production_20250528) extinguished
              C2P2_extinguished      88.2366 ms              pyro 2 in chamber 2 (6.9982e-4 kg of PNA24B_20250528) extinguished
              O3_opened              88.2519 ms                              orifice 3 connecting chamber 3 to chamber 4 opened
    total system energy: 
        -15524.01 J
    P(max) in Chamber  1  is  4.809e6 Pa  and mdot(max) =  0.0 kg/s    , at time =  1.0e-2 s  
    P(max) in Chamber  2  is  6.123e6 Pa  and mdot(max) =  0.1074 kg/s , at time =  2.016e-2 s
    P(max) in Chamber  3  is  4.055e6 Pa  and mdot(max) =  0.0 kg/s    , at time =  8.001e-2 s
    P(max) in Chamber  4  is  1.236e5 Pa  and mdot(max) =  0.0 kg/s    , at time =  0.1 s 
    Max Mass Flow in Orifice  1  is  0.0 kg/s    , at time =  0.0 s   
    Max Mass Flow in Orifice  2  is  0.1325 kg/s , at time =  1.0e-2 s
    Max Mass Flow in Orifice  3  is  0.1817 kg/s , at time =  9.0e-2 s
    Max Energy Flow in Orifice  1  is  0.0 W , at time =  0.0 s
    Max Energy Flow in Orifice  2  is  0.0 W , at time =  0.0 s
    Max Energy Flow in Orifice  3  is  0.0 W , at time =  0.0 s

Tank Data:
    Max tank pressure(absolute) at 100.0 ms:          123.6 kPa   
    Max tank pressure(gauge) at 100.0 ms:             36.56 kPa   
    Final tank pressure(absolute):                    1.236e5 Pa  
    Final tank pressure(gauge):                       3.656e4 Pa  
    Cumulative inflating flow:                        165.1 mol K 
    Cumulative CP inflating flow:                     165.1 mol K 
    Mean exit gas temperature:                        2221.0 K
    Cp-weighted mean exit gas temperature:            2221.0 K
    Enthalpy-weighted mean exit gas temperature:      2802.0 K
    Cumulative Energy Added:                          -2.5e3 J
    Cumulative Exergy (Useful Work Potential) Added:  3485.0 J
    Cumulative moles:                                 7.432e-2 mol

Calculation:
    Took 3300 steps

Calculation Completed
        
        Time for input/setup  =  2.8614    [s]
        Time for calculation  =  3.3758    [s]
        Time for output       =  5.493e-2  [s]

  Calculation time per simulation step (3300 steps) = 1.023e-3 [s]
  Total time = 6.2922 [s]

```

# **Matching Program**

The matching program (**aipp_match**) can be used with any existing JSON input file for AIPP and serves to assist in matching a simulation model to user-specified targets.

The input for the match program is a JSON file with the following fields...

* **simulation_arguments** - *the command-line arguments for a standard AIPP simulation*.
    * **input_name** - the name of the input file used for the AIPP simulation.
    * **output_name** - the name of the output file generated by the AIPP simulation.
    * **reporting_level** - the reporting level for the simulation outputs.
* **objective function** - an array of terms creating the objective function.

Below is an example of a complete JSON file for the matching program.

```json
{
    "simulation_arguments":
    {
        "input_name": "input_file.json",
        "output_name": "output_file.json",
        "reporting_level": 0
    },
    "objective_function":
    [
        {
            "weight": 1.0,
            "error_type": "L1",
            "term_type": "tank_pressure_max",
            "term_details":
            {
                "pressure_max": "84.0 kPa",
                "pressure_scaling": "1.0 kPa"
            }
        },
        {
            "weight": 1.0,
            "error_type": "L2",
            "term_type": "tank_t_pressure_max",
            "term_details":
            {
                "time_of_max": "170 ms", 
                "time_scaling": "1 ms"
            }
        }
    ]
}
```

## Objective Function

The **objective function** is a function of the *simulation outputs* and returns a single number. It is used to quantify how well the simulation accomplishes an **objective** (*e.g., matching a targeted EGT and a supplied tank curve*). The objective function returns a single non-negative number that can range from zero (*BEST*) to infinity (*WORST*). 

The objective function is formulated as a linear combination of individual terms, $\mathsf{g}_i(\text{outputs})$, each of which is a function of the outputs and characterizes a component of the full objective (*e.g., the previous example would have an objective function with two terms, one for the EGT and one for the tank curve*). The individual terms each return a single non-negative number that can range from zero (*BEST*) to infinity (*WORST*).

$\mathsf{f}(\text{outputs})=\sum_{i}w_i \mathsf{g}_i(\text{outputs})$

The relative importance of each individual term is described through a weight, $w_i$. The weights must be non-negative numbers.

## Objective Function Terms

The objective function is given in the JSON by an array of JSON objects that each contain the following fields.

* **weight** - the weight of the term, $w_i$.
* **error_type** - the type of error.
    * **L1** - given an error, $\epsilon$, the term is evaluated as $\mathsf{g}=|\epsilon|$.
    * **L2** - given an error, $\epsilon$, the term is evaluated as $\mathsf{g}=\epsilon^2$ (or $|\epsilon|^2$).
* **term_type** - the type of error term.
* **term_details** - the details specific to the chosen type of error term.

```json
{
    "weight": 1.0,
    "error_type": "L1",
    "term_type": "tank_pressure_max",
    "term_details":
    {
        "pressure_max": "84.0 kPa",
        "pressure_scaling": "1.0 kPa"
    }
}
```

### Tank Pessure Curve (Gauge)

Given a tank pressure curve that is specified as a set of coordinates, determine the average error between the simulated tank pressure curve and a linear interpolation of the target pressure curve (*only the overlapping time points are used*).

$g^{\text{tank-pressure-curve}}=\frac{1}{N_{\text{overlap}}}\sum_{i=1}^{N_{\text{overlap}}}\bigg| \frac{P^{\text{sim}}(t_i)-P^{\text{tar}}(t_i)}{P_{\text{scaling}}}\bigg|^{l}$

```json
{
    "weight": 100.0,
    "error_type": "L1",
    "term_type": "tank_pressure_curve",
    "term_details":
    {
        "time_units": "ms",
        "time_array": [0, 90, 100, 115, 150, 170, 250],
        "pressure_units": "kPa",
        "pressure_array": [0, 0, 32, 50, 80, 84, 82],
        "pressure_scaling": "10 kPa"
    }
}
```

or

```json
{
    "weight": 100.0,
    "error_type": "L1",
    "term_type": "tank_pressure_curve",
    "term_details":
    {
        "csv_file": "tank_pressures.csv",
        "pressure_scaling": "10 kPa"
    }
}
```

with a csv file in the below format (any valid time and pressure units may be used in the header)

```text
ms,kPa
0,0
90,0
...
```

### Maximum Tank Pressure (Gauge)

Given a maximum tank pressure, calculate the error from that value.

$g^{\text{tank-pressure-max}}=\bigg| \frac{P_{\text{max}}^{\text{sim}}-P_{\text{max}}^{\text{tar}}}{P_{\text{scaling}}}\bigg|^{l}$

```json
{
    "weight": 1.0,
    "error_type": "L1",
    "term_type": "tank_pressure_max",
    "term_details":
    {
        "pressure_max": "84.0 kPa",
        "pressure_scaling": "1.0 kPa"
    }
}
```

### Time of Maximum Tank Pressure

Given a time at which maximum tank pressure occurs, calculate the error from that value.

$g^{\text{tank-time-pressure-max}}=\bigg|\frac{t_{\text{max}}^{\text{sim}}-t_{\text{max}}^{\text{tar}}}{t_{\text{scaling}}}\bigg|^{l}$

```json
{
    "weight": 1.0,
    "error_type": "L2",
    "term_type": "tank_t_pressure_max",
    "term_details":
    {
        "time_of_max": "170 ms", 
        "time_scaling": "1 ms"
    }
}
```

### Tank Cumulative Moles

Given a cumulative number of moles added to the tank at the end of the simulation, calculate the error from that value.

$g^{\text{tank-cumulative-mols}}=\bigg| \frac{n^{\text{sim}}(t_f)-n^{\text{tar}}(t_f)}{n_{\text{scaling}}}\bigg|^{l}$

```json
{
    "weight": 5.0,
    "error_type": "L2",
    "term_type": "tank_cumulative_mols",
    "term_details":
    {
        "cumulative_mols": "0.2 mol",
        "mols_scaling": "0.01 mol"
    }
}
```

### Tank Cumulative Cp Inflating Flow

Given a cumulative Cp inflating flow added to the tank at the end of the simulation, calculate the error from that value.

$g^{\text{tank-cumulative-cp-SIF}}=\bigg| \frac{\mathrm{SIF}^{\text{sim}}(t_f)-\mathrm{SIF}^{\text{tar}}(t_f)}{\mathrm{SIF}_{\text{scaling}}}\bigg|^{l}$

```json
{
    "weight": 1.0,
    "error_type": "L1",
    "term_type": "tank_cumulative_cp_inflating_flow",
    "term_details":
    {
        "cumulative_cp_inflating_flow": "378.0 mol K",
        "cumulativeIF_scaling": "10.0 mol K"
    }
}
```

### Tank Mean Cp EGT

Given a mean Cp-EGT at the end of the simulation, calculate the error from that value

$g^{\text{tank-cp-EGT}}=\bigg| \frac{\mathrm{EGT}^{\text{sim}}(t_f)-\mathrm{EGT}^{\text{tar}}(t_f)}{T_{\text{scaling}}}\bigg|^{l}$

```json
{
    "weight": 1.0,
    "error_type": "L2",
    "term_type": "tank_mean_cp_exit_gas_temp",
    "term_details":
    {
        "mean_cp_exit_gas_temp": "1890 K",
        "temperature_scaling": "10 K"
    }
}
```

### Maximum Pressure (Absolute) in Chamber $i$

Given a maximum pressure in chamber $i$, calculate the error from that value.

$g^{\text{chamber-pressure-max}}=\bigg| \frac{P_{i,\text{max}}^{\text{sim}}-P_{i,\text{max}}^{\text{tar}}}{P_{\text{scaling}}}\bigg|^{l}$

```json
{
    "weight": 1.0,
    "error_type": "L2",
    "term_type": "chamber_pressure_max",
    "term_details":
    {
        "chamber_idx": 2,
        "pressure_max": "100 MPa",
        "pressure_scaling": "3 MPa"
    }
}
```

### Chamber $j$ Pessure Curve (Gauge)

Given a chamber pressure curve that is specified as a set of coordinates, determine the average error between the simulated chamber pressure curve and a linear interpolation of the target pressure curve (*only the overlapping time points are used*).

$g^{\text{chamber-pressure-curve}}=\frac{1}{N_{\text{overlap}}}\sum_{i=1}^{N_{\text{overlap}}}\bigg| \frac{P^{j,\text{sim}}(t_i)-P^{j,\text{tar}}(t_i)}{P_{\text{scaling}}}\bigg|^{l}$

```json
{
    "weight": 1.0,
    "error_type": "L2",
    "term_type": "chamber_pressure_curve",
    "term_details":
    {
        "chamber_idx": 2,
        "time_units": "ms",
        "time_array": [2, 4, 5, 6, 8, 10, 15, 20, 25, 30, 40, 60, 80],
        "pressure_units": "MPa",
        "pressure_array": [60, 60, 61, 50, 30, 20, 10, 3, 1, 0, 0, 0, 0],
        "pressure_scaling": "5 MPa"
    }
}
```

or

```json
{
    "weight": 1.0,
    "error_type": "L2",
    "term_type": "chamber_pressure_curve",
    "term_details":
    {
        "chamber_idx": 2,
        "csv_file": "chamber_2_pressures.csv",
        "pressure_scaling": "5 MPa"
    }
}
```

with a csv file in the below format (any valid time and pressure units may be used in the header)

```text
ms,MPa
2,60
4,60
...
```

### Notes

* In general, any term in the objective function should return a dimensionless value. This is accomplished by using the different scaling variables for each of the possible types of terms. The scaling variables should be though of as a *sensitivity* that describes the order of magnitude for which the error is significant.

    *Example* - a difference of 10 kPa is significant for the pressure within a tank, but relatively insignificant for an internal combustion chamber.

* After selecting the scalings used to specify the sensitivity of each term, the weights are used to assign the relative importance of the terms.

    *Example* - matching the timing of the peak tank pressure is more important than matching the EGT.

## Outputs

The outputs are printed to the terminal and display a table of the terms in the objective function as well as the total value of the objective function.

The columns of the table are...

* **Weight** - the weight of the term - $w_i$.
* **Value** - the value of the term when evaluated with the simulation outputs - $g_i$.
* **Contribution** - the product of the weight and the value - $w_i\times g_i$.
* **Rel. Contribution** - the relative contribution - $w_i\times g_i/\sum (w_i\times g_i)$.
* **Description** - a description of the term that also displays the dimensional values of the simulation outputs and the target.

```text
Weight     Value Contribution Rel. Contribution                                                                                           Description
1.0       1.1933       1.1933         6.5658e-3           82.8 kPa matching peak tank pressure of 84.0 kPa subject to a scaling of 1.0 kPa (L1-error)
1.0        6.009        6.009         3.3064e-2       176.0 ms matching peak tank pressure time of 170.0 ms subject to a scaling of 1.0 ms (L2-error)
5.0    5.2432e-4    2.6216e-3         1.4425e-5            0.2 mol matching cumulative moles of 0.2 mol subject to a scaling of 1.0e-2 mol (L2-error)
1.0    2.2017e-2    2.2017e-2         1.2114e-4    378.0 mol K matching cumulative cp IF of 378.0 mol K subject to a scaling of 10.0 mol K (L1-error)
1.0    1.1326e-2    1.1326e-2         6.2321e-5                   1.89e3 K matching mean Cp-EGT of 1.89e3 K subject to a scaling of 10.0 K (L2-error)
1.0       34.809       34.809           0.19153 8.23e4 kPa matching chamber 2 peak pressure of 1.0e5 kPa subject to a scaling of 3.0e3 kPa (L2-error)
100.0    0.19296       19.296           0.10617           mean error of 0.193 matching 7-point tank curve subject to a scaling of 10.0 kPa (L1-error)
50.0     0.72074       36.037           0.19829            mean error of 0.721 matching 3-point tank curve subject to a scaling of 1.0 kPa (L1-error)
100.0    0.84359       84.359           0.46418            mean error of 0.844 matching 6-point tank curve subject to a scaling of 5.0 kPa (L2-error)

    Total Value (to be minimized) = 181.74
```

# **Usage / Tips and Tricks**

## Usage

## Tips and Tricks

* Set the *run_simulation* flag in the time specifications to "false" when building a new model to test the validity of the input file without performing the time-integration.
* Take advantage of the different chamber initialization types.
    * Use "PVT" or "rho_mVT" for the Tank and increase the volume to a large value for additional simulations that represent deployment into an atmosphere.
    * Use "mPT" for hybrid inflators and allow it to calculate the necessary total volume.
    * Use "nVT" when developing reaction rate laws to have precise control of the reactant and product stoichiometries at initialization.
    * Use "mVT" for chambers with well-defined volumes and gas loads in production settings.
* The "SimStart" event exists for every simulation, use this as a triggering event to create models that are equivalent to those in legacy tools (AIPP-2 and SITAP).
* Use the *reactions_enabled* and the *speed_scaling* options in the reaction specifications to test the influence of reactions.
* Adding new species can be done by creating a single new property JSON file, then listing it as an available specie in the species_library JSON file.
* Chambers can contain multiple pyros with different shapes.
* When editing the auxiliary files, create a copy of the default file with a name unique to that model and edit that instead.
* Use tracer species as a sanity check to probe how gas moves through the system:
    1) Create duplicate entries in the system_library JSON file for an inert specie (Ar/He/N2) present in the system equal to the number of chambers. These should use the same property file as the original entry.
    2) Add a suffix to each of the duplicate entries corresponding to the chamber indices to create *tracer* species for each chamber (ex. "Ar_chamber1").
    3) Replace the inert species in each chamber with their corresponding tracer.
    4) The molar amounts of the tracers in each chamber relative to their initial amount in the originating chamber represent how was distributed throughout the system during and after deployment.
* Wildcard species always use a constant coefficient heat capacity (calorically perfect gas) and an ideal gas equation of state (PV=NRT) for the compressibility model.
* The "lookup2D_240by240" real gas compressibility model is negligibly slower than the ideal gas compressibility model.
* The 4th-order polynomial heat capacity model is negligibly slower than the 2nd-order polynomial heat capacity model.
* The total energy (of individual chambers and the total assembly) depend on the choice of reference enthalpies, which may be negative. The energy differences are what is important when assessing simulations.
    * The reference enthalpies of wildcard species are arbitrarily 0 J/mol at the reference temperature of 298.15 K. This is another reason that the total energy should be carefully interpreted.
* The reaction free energies account for the temperature-dependence (e.g. reaction equilibrium shifts to favor dissociation at high temperatures).
* The effects of each reaction are assessed per-chamber and the initial/final summaries display the reaction fluxes, equilibrium constant, reaction quotient, and instantaneous reaction driving force to show when chemical equilibrium is reached.


# **Testing**

AIPP employs a testing framework that acts as a development aid and verification tool for the entire code base. The testing methodology is split into two regimes; unit tests and integration tests. 

- Unit tests: These tests are used to validate individual components, or "units", of a code. These are uniquely useful for validating features as they are being developed as well as ensuring that current functionality is not impacted by the addition of new features.

- Integration tests: These tests are used to validate overall output of the code. This typically involves running the code in its entirety and comparing the new output to known-good output from an earlier state of the code.

## Prerequisites

The testing framework used in AIPP assumes that Fortran Package Manager (FPM) wil be used to execute the test processes. The instructions in the section will be written with the assumption that the user is using a recent version of FPM.

In addition to FPM, there are several libraries that must be downloaded and compiled before AIPP's core code can be compiled. This requires that git is installed and has access to the internet. The full list of these dependencies is shown in the `[dependencies]` section of `fpm.toml`.

## Running the Test Suites

To run AIPP's test using FPM the following commands should be utilized:

- Unit Tests

```text
fpm test --flag "-g -Wall -Wextra -Werror -pedantic -std=f2023 -Wimplicit-interface -fcheck=all -fbacktrace -finit-real=snan -ffpe-trap=invalid,zero,overflow,underflow,denormal" --target unit_test
```

- Integration Tests

```text
fpm test --flag "-g -Wall -Wextra -Werror -pedantic -std=f2023 -Wimplicit-interface -fcheck=all -fbacktrace -finit-real=snan -ffpe-trap=invalid,zero,overflow,underflow,denormal" --target integration_test -- -d -v
```
The flags shown in the string following `--flag` are carefully selected to provide a strict interpretation of the correct Fortran standard. In certain situations it is prudent to add or remove flags from this list. To provide more context a description of each flag is given below.


<div align="center">

| Flag | Description |
|------|-------------|
| `-g` | Generates debugging information for use with debuggers like gdb, allowing you to step through code and inspect variables |
| `-Wall` | Enables a standard set of common warnings (though in Fortran this is less comprehensive than in C/C++) |
| `-Wextra` | Enables additional warnings beyond `-Wall` |
| `-Werror` | Treats all warnings as errors, causing compilation to fail if any warnings are generated. Gfortran can thrown erroneous errors at times. In these cases this flag can be removed (with caution)  |
| `-pedantic` | Issues warnings for code that doesn't strictly conform to the Fortran standard |
| `-std=f2023` | Enforces Fortran 2023 standard compliance and flags non-standard extensions |
| `-Wimplicit-interface` | Warns when procedures are called without an explicit interface (helps catch argument mismatches) |
| `-fcheck=all` | Enables all runtime checks including array bounds, pointer validity, etc. This catches many common errors but slows down execution |
| `-fbacktrace` | Produces a backtrace showing the call stack when a runtime error occurs, making debugging much easier |
| `-finit-real=snan` | Initializes all real variables to signaling NaN (Not a Number), helping detect use of uninitialized variables |
| `-ffpe-trap=invalid,zero,overflow,underflow,denormal` | Causes the program to stop immediately when floating-point exceptions occur (invalid operations, division by zero, overflow, underflow, or denormal numbers) |

</div>

This is a very strict development/debugging configuration designed to catch as many errors as possible during development. This list of flags should not be used for production builds as they add significant runtime overhead.

## Testing Framework: Veggies

The backbone of the current AIPP testing framerwork is the  [veggies library](https://gitlab.com/everythingfunctional/veggies "Veggies Gitlab Page") created by Brad Richardson (Formally with Archaeologic and authored the original Modern Fotran implementation of AIPP 3.0). This libray contains the main parsing utilities and types that are used for both the unit tests and integration tests. For the purposes of this document we will keep the scope fairly concise but an in depth overview of the features of veggies is available through the hyperlink above. The current form of the tests use a limited subset of veggies features. The most common features and their descriptions will be outlined in this section.

Key Features:

| Function/Type      | Description      |
| :--------: | :-------------: |
| run | Housed in the respective `main.f90` file for the unit and integration tests, `run` is used to execute the overall test loop. Each of the tests called out in `individual_tests` will run as part of the test execution|
| result_t | `result_t` is the derived type used by veggies to store and report results of each assertion made in a test function |
| assert_equals | `assert_equals` is the most basic form of the assertion function in veggies. It checks that a calculated quantity matches a known quantity exactly |
| assert_equals_within_absolute | This behaves in the same way as `assert_equals` but gives the option to provide an absolute tolerance between the actual and expected answers rather than dictating an exact match |
| assert_equals_within_relative | This behaves in the same way as `assert_equals` but givest the option to provide a relative tolerance (a percentage) between the actual and expected answers rather than dictating an exact match |
| assert_that | `assert_that` is used to evaluate a conditional rather than a direct comparison. Ex: `assert_that(2 < 3)`|

## Reference JSON

Snippets of individual JSON chunks are required for the execution of the unit tests. These can serve as building blocks for parsing JSON keywords from the input file or are used as inputs for constructing reference objects for the test suite. 

During the development of AIPP 3.0 these can serve as good references for simulators to identify optional arguments for the JSON input file. For example, CD_CONSTANT.json shows the arguments used to specify a constant discharge coefficient while CD_PRESSURE.json shows the arguments used to specify a discharge coefficient as a function of upstream pressure.

The reference JSON files can be found in `test/unit/reference_json`.

## Unit Testing Methodology

The overall unit testing methodology was reworked for AIPP 2.9.6 to better align with the practice of instantiating objects as they are parsed from JSON input at run time.

Previously, the tests were written using explicit constructurs for each type used in the assembly. This resulted in overly verbose tests with inputs that were not necessarily based in reality. Instantiating these types dynamically from the JSON input greatly simplifies the type constructors in the test. To illustrate this, changes to the function `example_assembly` are shown below.

<table>
<tr>
<th>Program</th>
<th>Subroutine</th>
</tr>
<tr>
<td>

```Fortran
function example_assembly(compressibility)
      class(compressibility_t), intent(in), target :: compressibility
      type(assembly_t) :: example_assembly

      example_assembly = assembly_t( &
      chambers = &
          [ chamber_t( &
              volume = 100000.d0.unit.CUBIC_MILLIMETERS, &
              pyro = &
                  [ pyro_t( &
                      name = var_str("example"), &
                      ignition_times = [1.5d0.unit.MILLISECONDS], &
                      shape = sphere_t(1.0d0.unit.MILLIMETERS), &
                      num_shapes_per_pile = 7078.81d0, &
                      density = 2.119d0.unit.GRAMS_PER_CUBIC_CENTIMETER, &
                      produced_species = [ co2(1.d0, 2), n2(0.d0, 3) ], &
                      molar_production_rates = [0.0047344d0, 0.d0].unit.MOLS_PER_GRAM, &
                      flame_temperature = 1645.762d0.unit.KELVIN, &
                      burn_rate = simple_burn_rate_t( &
                          reference_burn_rate = 19.36d0.unit.MILLIMETERS_PER_SECOND, &
                          burn_rate_exponent = 0.34d0, &
                          burn_rate_temperature_sensitivity = 0.00187d0.unit.PER_KELVIN, &
                          conditioning_temperature = 294.15d0.unit.KELVIN)) &
                  ], &
              compressibility = compressibility) &
          , chamber_t( &
              volume = 60.d0.unit.LITERS, &
              pyro = [pyro_t :: ], &
              compressibility = compressibility) &
          ], &
      orifices = &
          [ orifice_t( &
              area = 54.7389d-6.unit.SQUARE_METERS, &
              opens_at_time = 1.6d0.unit.MILLISECONDS, &
              discharge_coefficient = 0.65d0, &
              viscous_flow_factor = 0.1d0) &
          ], &
      orifice_connections = [orifice_connection_t(1, 2)], &
      walls = &
          [ wall_t( &
              thickness = 2.d0.unit.MILLIMETERS, &
              area = 1.d0.unit.SQUARE_CENTIMETERS, &
              density = 8.d0.unit.GRAMS_PER_CUBIC_CENTIMETER, &
              specific_heat = 500.d0.unit.JOULES_PER_KILOGRAM_KELVIN, &
              thermal_conductivity = 40.d0.unit.WATTS_PER_METER_KELVIN, &
              num_divisions = 10) &
          ], &
      wall_connections = &
          [ wall_connection_t( &
              left = chamber_flow_t( &
                  index = 1, heat_transfer_correction_factor = 1.d0), &
              right = constant_temperature_boundary_t( &
                  index = 1, temperature = 300.d0.unit.KELVIN)) &
          ], &
      filters = &
          [ filter_t( &
              mass = 50.d0.unit.grams, &
              specific_heat = 450.d0.unit.joules_per_kilogram_kelvin, &
              method = kntu, &
              heat_transfer_coefficient = 0.05d0) &
          ], &
      filter_connections = [filter_connection_t(1, [1])], &
      tank_id = 2)
  end function
```

</td>
<td>

```Fortran
function example_assembly()
      type(assembly_t) :: example_assembly

      call initialize_pyro_formulations()
      call example_assembly_input()
      
      call prepare_assembly_for_calculation(reference_assembly_input, &
                                            reference_system_thermophysics_wc, &
                                            reference_pyro_formulations, &
                                            0.1d0.unit.MILLISECONDS, &
                                            example_assembly)                        
end function
```
</td>
</tr>
</table>

It is visually obvious that the updated testing methodology simplifies test creation and improves readability of the code. However, this simplification brings with it extra dependence on the hierarchy of the unit test. Previously, the constructors for each type were hard coded and while this was cumbersome for the coder there were no upstream dependencies with the potential for change. To maintain the integrity of the current unit test approach it is imperative that the tests are completed in the correct order with the logic being that if a functionality has been verified in an earlier test it can now be used in subsequent tests without issue. With this in mind, the tests have been placed in the following order.

1. string_set()
2. molar_composition()
3. properties()
4. reaction()
5. shapes()
6. pyro()
7. filter()
8. chamber()
9. orifice()
10. wall()
11. assembly()
12. stepper()
13. json_output()
14. test_events()

### Unit Test Execution

Upon execution the unit tests are completed with the following steps:

- The `run` function in `/tests/unit/main.f90` executes each of the tests in `individual_tests` in the order prescribed.
  - With each test in `individual_tests`, a `test_stepper` executes all of the individual tests called out in the respective `test_item_t`.
    ```fortran
        type(test_item_t) :: rk4_tests
        rk4_tests = describe( &
            "Runge-Kutta 4th-order (RK4)", &
            [ &
                it("Taking a step increases the time", &
                    check_RK4_single_step), &
                it("Time-integration with no active dynamics leaves the state unchanged", &
                    check_RK4_no_dynamics), &
                it("Time-integration with active dynamics and dt=0 leaves the state unchanged", &
                    check_RK4_dt_zero), &
                it("Given a known analytic time-evolution, reducing dt geometrically converges to the known result (REQUIRES FURTHER VERIFICATION)", &
                    check_RK4_dt_convergence) &
            ])
      ```

      - For each individual function in the `test_item_t` one or more assertions is evaluated. 
    ```fortran
    function check_RK4_dt_convergence() result(result_)
        implicit none
                .
                .
                .
        result_ = assert_that( &
            current_state%time%SECONDS >    initial_state%time%SECONDS, &
            "The stepper has advanced in time")     
    end function
    ```
## Integration Testing Methodology

The integration tests utilize the same basic functionality outline in the [Unit Test Execution](#unit-test-execution) section but are much more succinct. Rather than a large number of individual test files housing a large number of individual unit tests there is one main test file, `verification_test.f90`, that houses a small number of stepper evaluation tests. 

Each stepper evaluation test is running a full AIPP simulation, stored in `test/integration/inputs/inputs.json`, with one or more steppers. The results of these steppers are then compared to the reference output files stored in `test/integration/reference_outputs`.

The integration test input file is intended to evaluate all of the feature variations available in AIPP. This leads to a larger model with a longer run time than a typical inflator simulation. With this intent in mind it should be noted that the integration test will change with the addition of new features in AIPP. Features that do not impact the results of the integration test (i.e. basing orifice opening time on `SimStart`) allow for direct comparison to the reference outputs. Features that require a discrete change to the behavior of the integration test will require creation of new `reference_outputs`. In this case, the simulator should verify the validity of the model output prior to publishing new `reference_outputs`.

