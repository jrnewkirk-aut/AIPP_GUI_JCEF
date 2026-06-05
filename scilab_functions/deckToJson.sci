function [ac]=GetTimes(text)   
    ac.time_specs.output_time_step=nab(text,'output_dt',1,'s')
    ac.time_specs.end_time=nab(text,'t1_end',1,'s')
    ac.time_specs.simulation_time_step=nab(text,'dt1',1,'s')
    ac("time_specs")("run_simulation") = %t
    ac("time_specs")("RKF_config_file") = "auxiliary_files/RKF_config.json"
endfunction

function out = AddDefaultReactions(struc)
    out = struc
    out("reaction_specs")("reactions_list") = ["H2_combustion", ...
                                               "CO_combustion"]
    out("reaction_specs")("reactions_method")("choice") = "mass_action"
    out("reaction_specs")("reactions_method")("options") = [...
                                                "constant", ...
                                                "mass_action", ...
                                                "mass_action_arrhenius"]
    out("reaction_specs")("onoff_switch") = %f
    out("reaction_specs")("enforce_LDB") = %f
    out("reaction_specs")("speed_scaling") = 5e-07
    out("reaction_specs")("reactions_file") = "auxiliary_files/basic_reactions.json"

endfunction

function [ac]=GetChamberDetails(ac, text, ncham)
    specnames=['h2o','co2','n2','o2','h2','co','he','ar','n2o']
    propername=["H2O","CO2",'N2','O2','H2','CO','He','Ar','N2O']
    [junk,nspecies]=size(specnames)
    // start assembly.chambers
    ac.assembly.tank_id = ncham
    for i=1:ncham
        ac("assembly")("chambers")(i)("label") = nab(text, 'chamber_name', i, '')
        ac("assembly")("chambers")(i)("init_type") = "mVT"
        if(i<ncham)
            ac.assembly.chambers(i).volume=nab(text,'gas_volume',i,'mm^3')
        else
            ac.assembly.chambers(i).volume=nab(text,'gas_volume',i,'L')
        end
        ac.assembly.chambers(i).temperature=nab(text,'conditioning_temperature',1,'K') // it's always the first token for all chambers
        ac.assembly.chambers(i).mass=nab(text,'gas_mass',i,'g')
        for j=1:nspecies
            strin=specnames(j)+"%"
            maybe_value=nab(text,strin,i,"")
            if(strtod(maybe_value) > 0) then
                strtoex='ac.assembly.chambers('+string(i)+').mol_fractions.'+propername(j)+'='+maybe_value
                execstr(strtoex)
            end
        end
        ac.assembly.walls(ncham).temperature='294.15 K' // override the conditioning temp for the tank wall
        ac.assembly.chambers(ncham).temperature='294.15 K'
    end
    
endfunction

function [ac]=GetOrificeDetails(ac, text, ncham)
    orificecount=0;
    for i=1: ncham
        norificegroups=strtod(nab(text,'num_orifice_sizes',i,""))
        
        //        disp('chamber and group number',[i,norificegroups])
        for j=1:norificegroups
            orificecount=orificecount+1 ; // increment which orifice to write to JSON
            row = grep(text, "num_orifice" + string(j))
            specs = text(row)
            //This function is used to fix parsing issues from 
            //input deck lines with empty tabs rather than "0"
            //using only tabs breaks the assumptions made by the
            //tokens tool
            function out = FixEmptyTabs(inp_string)

                //Take care of special case for i = 1
                snippet(1) =  part(specs, 1)

                if snippet(1) == "	" then
                    new(1) = "0	"
                else
                    new(1) = snippet(1)
                end

                for i =2:1:length(specs)
                    snippet(i) =  part(specs, i)
                    if snippet(i) == "	" & snippet(i-1) ~= "	"
                        new(i) = snippet(i)
                    elseif snippet(i) == "	" & snippet(i-1) == "	"
                        new(i) = "0	"
                    else
                        new(i) = snippet(i)
                    end
                end
                out = strcat([new'])
            endfunction
            norifices=strtod(nab(FixEmptyTabs(specs),strcat(["num_orifice",string(j)]),i,'mm'));
            ord=strtod(nab(text,strcat(["diameter",string(j)]),i,'mm'));
//            disp('ord is ', ord)
            if(isnan(ord)) then
//                disp('in the breakloop')
                break
            end

            deq=sqrt(norifices)*ord
            ac.assembly.orifices(1,orificecount).diameter=strcat([string(ord),' mm']) ; // equivalent diameter assuming 1 orifice for the group
            ac.assembly.orifices(1,orificecount).num_orif = norifices
            ac.assembly.orifices(1,orificecount).open=%f
            ac.assembly.orifices(1,orificecount).one_way=%f
            Cd=strtod(nab(text,strcat(["cd_value",string(j)]),i,''));
            ac.assembly.orifices(1,orificecount).discharge_coefficient.basis = "constant";
            ac.assembly.orifices(1,orificecount).discharge_coefficient.Cd_value = double(Cd);
            ac.assembly.orifices(1,orificecount).from=i
            ac.assembly.orifices(1,orificecount).to=strtod(nab(text,strcat(["chamber_connection"]),i,''));
            ac.assembly.orifices(1,orificecount).viscous_flow_factor=strtod(nab(text,"visc_flow",1,''));

            ocodestr='orifice_type_code'+string(j)
            ocode=strtod(nab(text,ocodestr,i,'thistringdoesnotmatter'))
            select ocode
            case 2 then
                ac.assembly.orifices(1,orificecount).opens_at=nab(text,strcat(["burst_pressure",string(j)]),i,'MPa')
            case 4 then
                ac.assembly.orifices(1,orificecount).opens_at.triggering_event = "SimStart"
                ac.assembly.orifices(1,orificecount).opens_at.time_delay=nab(text,strcat(["burst_time",string(j)]),i,'s')
            end
        end
    end
    // things that can be done outside of the loop through chambers
    //The JSON file from archaeologic reads in the chambers as a list object. Manually
    //creating the structure above creates a [nx1] structure object. This section 
    //forces the creation of a list to match the archaeologic syntax 
    for i=1:1:ncham
        if i==1
            str = "list(ac.assembly.chambers(1)" 
        else
            str = strcat([str,",","ac.assembly.chambers(",string(i),")"])
            //       disp(str)
        end
    end
    execstr(strcat(["ac.assembly.chambers = ",str,")"]))
    for i=1:1:orificecount
        if i==1
            str = "list(ac.assembly.orifices(1)" 
        else
            str = strcat([str,",","ac.assembly.orifices(",string(i),")"])
            //       disp(str)
        end
    end
    execstr(strcat(["ac.assembly.orifices = ",str,")"]))
endfunction

function [ac]=GetFilterDetails(ac, text, ncham)  
    //  from AIPP:  REAL(DP) :: rhosteel = 7833.d0, cpsteel=510.d0, ksteel=45.0d0
    default_density_string="7833.0 kg/m^3"
    default_specific_heat_string="510.0 J/(kg K)"

    for i=1:ncham-1 // no filters in tank
        FilterCode=nab(text,'heat_loss_method',1,'') // 1st string
        FC=stripblanks(FilterCode)
        ac.assembly.chambers(i).filter.density=default_density_string
        ac.assembly.chambers(i).filter.specific_heat=default_specific_heat_string
        ac.assembly.chambers(i).filter.mass=nab(text,'filter_weight',i,'g')
        if(FC =='percentage') then
            ac.assembly.chambers(i).filter.method='PERCENTAGE'
            ac.assembly.chambers(i).filter.coefficient=strtod(nab(text,'pack_heatloss_percent_removed',i,''))/100.
        else
            ac.assembly.chambers(i).filter.method='KNTU' // will become KNTU once Archaeologic fixes it.
            ac.assembly.chambers(i).filter.coefficient=strtod(nab(text,'kntu_value',1,''))
        end
        orifice_count = 0
        filter_orifices = []
        //create holder for orifice information created previously
        orifices = ac.assembly.orifices
        for j = 1:1:size(orifices)
            if orifices(j).from == i
                filter_orifices = cat(2, filter_orifices, j)
            end
        end
        orifice_string = strcat([string(filter_orifices)], ",")
        // ac.assembly.chambers(i).filter.orifices= "[" + orifice_string + "]"
        ac.assembly.chambers(i).filter.orifices= list();
        ac.assembly.chambers(i).filter.orifices(1) = filter_orifices;
    end
endfunction

function [ac]=GetPyroDetails(ac, text, ncham)
    for i=1:ncham
        temp=nab(text,'pyro_file',i,'')
//        disp('temp is ',temp)
        name=(strsplit(temp,'.'))(1) // omit the .pyro file extension
        //Update pyro file to latest formulation date
        name = part(name, 1:$-8) +  "20250528"
        pyromass=GetNumFromDeck(text,'generant_weight',i);
//        disp('first pyromass is ',pyromass)

        if pyromass ~= 0 then
            ac.assembly.chambers(i).pyro = list()
            ac.assembly.chambers(i).pyro(1).formulation=strsubst(name,"-","_")
            // get the actual number of the density 
            rho=GetNumFromDeck(text,'generant_density',i)
            ac.assembly.chambers(i).pyro(1).density=nab(text,'generant_density',i,'g/cm^3')
            ac.assembly.chambers(i).pyro(1).amount=msprintf("%.6f",pyromass)+' g'  
            ac.assembly.chambers(i).pyro(1).piles=1
            ac.assembly.chambers(i).pyro(1).flame_spread_time=nab(text,'flame_spread_time',i,'s')  
            ac.assembly.chambers(i).pyro(1).ignition_time.triggering_event = "SimStart"      
            ac.assembly.chambers(i).pyro(1).ignition_time.time_delay=nab(text,'ignition_delay',i,'s')      
            ac.assembly.chambers(i).pyro(1).reference_burn_rate=nab(text,'ref_burn_rate',i,'mm/s')
            ac.assembly.chambers(i).pyro(1).burn_rate_exponent=strtod(nab(text,'burn_rate_pressure_exp_n',i,''))
            ac.assembly.chambers(i).pyro(1).burn_rate_temperature_sensitivity=nab(text,'burn_rate_temp_sensitivity_sigma_p',i,'1/K')                
            ac.assembly.chambers(i).pyro(1).amount=nab(text,'generant_weight',i,'g')        
            // now a somewehat complex process is involved to identify the proper tags for the different shapes, so this will  be a 'case' statement
            shape_code=strtod(nab(text,'gen_shape_code',i,""))
//            disp('shape_code',shape_code)
            select shape_code
            case(1) then // tablet (don't need to worry about the number of tablets, aipp will calc that)
                ac.assembly.chambers(i).pyro(1).shape.geometry="tablet"
                ac.assembly.chambers(i).pyro(1).shape.total_height=nab(text,'starID_waferID_triBL_surfAREA',i,'mm') 
                ac.assembly.chambers(i).pyro(1).shape.diameter=nab(text,'tabOD_waferOD_starMD_triRAD',i,'mm')         
                ac.assembly.chambers(i).pyro(1).shape.dome_height=nab(text,'tabTHICK_triTHICK_waferTHICK_starOD',i,'mm') 
                ac.assembly.chambers(i).pyro(1).amount=msprintf("%.6f",pyromass)+' g'  
                
            case(2) then //sphere (don't need to worry about the number of spheres, aipp will calc that)
                ac.assembly.chambers(i).pyro(1).shape.geometry="sphere"           
                temp=nab(text,'sphereOD_starNFIN',i,''); // just get the value
                temp=strcat([string(strtod(temp)/2), " mm"]) // convert diameter to radius
                ac.assembly.chambers(i).pyro(1).shape.radius=temp;
                ac.assembly.chambers(i).pyro(1).amount=msprintf("%.6f",pyromass)+' g'  
            
            case(3) then  // wafer
                // now calculate the nearest integer value of wafers
                id=GetNumFromDeck(text,'tabTHICK_triTHICK_waferTHICK_starOD',i)
                od=GetNumFromDeck(text,'tabOD_waferOD_starMD_triRAD',i)
                h=GetNumFromDeck(text,'starID_waferID_triBL_surfAREA',i)
                vol=pi*(od^2-id^2)*h/4;
                n=round(1000*(pyromass/(vol*rho))) // 1000 is units correction
//                disp('n_wafers was found to be ',n)    
                
                
                nwafers=1000*pyromass/(vol*rho) // scaled
//                disp('nwafers as real is ',nwafers)
                nwafersi=round(nwafers)
//                disp('rounded, it is  ',nwafersi)
                
                disp(' current density is in gm/cm^3              ',rho)
                perfect_density=rho*nwafersi/nwafers
                disp(' for perfect Wafer density, alter it to ',perfect_density)   
                
                ac.assembly.chambers(i).pyro(1).shape.geometry="wafer"       
                ac.assembly.chambers(i).pyro(1).shape.outer_radius=strcat([string(od/2),' mm'])
                ac.assembly.chambers(i).pyro(1).shape.inner_radius=strcat([string(id/2),' mm'])        
                ac.assembly.chambers(i).pyro(1).shape.height=nab(text,'starID_waferID_triBL_surfAREA',i,'mm')     
                ac.assembly.chambers(i).pyro(1).amount=n;
                ac.assembly.chambers(i).pyro(1).density=(msprintf("%.6f",perfect_density)+' g/cm^3')

            case(7) then // grain               
                id=GetNumFromDeck(text,'tabOD_waferOD_starMD_triRAD',i)     
                od=GetNumFromDeck(text,'sphereOD_starNFIN',i)     
                fd=GetNumFromDeck(text,'starID_waferID_triBL_surfAREA',i)     
                finthick=GetNumFromDeck(text,'tabDOME_waferNBREAK_starFINTHICK',i)
                height=10.0  // just a place holder since the current deck files don't contain this information
                nfins=GetNumFromDeck(text,'tabTHICK_triTHICK_waferTHICK_starOD',i)
    
                theta=pi/nfins
                A1=.5*theta*((od/2)^2-(id/2)^2)
                
    //            beta=asin((finthick/2)/(fd/2))
                yc=sqrt((od/2)^2 - (finthick/2)^2)
                A2=(fd/2-yc)*finthick/2
                gamma=asin((finthick/2)/(od/2))
                A3=(1/4)*(od/2)^2*(2*gamma-sin(2*gamma))
                area=2*nfins*(A1+A2-A3)/100.  // convert to sq cm.
                vol=pyromass/rho;
                height=10*vol/area; // compute a new length leaving density/mass alone
               //vol=area*height/10. // convert to cu cm
               // disp('the grain end area is, in sq. cm. ' ,area)
               // disp('the grain vol is, in cc''s ',vol)
               disp('the grain lengtch was computed as ',height*1000)
                
    /*            ngrains=pyromass/(vol*rho) // scaled
                mprintf('ngrains as real is %.6f \n',ngrains)
                ngrainsi=round(ngrains)
                mprintf('rounded, it is     %.0f \n',ngrainsi)  */
                ngrainsi=1 ; // force to 1 grain temporarily
             //   mprintf(' the current density is %.6f \n',rho)
             //   perfect_density=rho*ngrainsi/ngrains
             //   mprintf(' for perfect Grain density, it was altered to %.6f \n', perfect_density)
                
                
    
                ac.assembly.chambers(i).pyro(1).shape.geometry="grain"
                ac.assembly.chambers(i).pyro(1).shape.inner_diameter=nab(text,'tabOD_waferOD_starMD_triRAD',i,'mm')     
                ac.assembly.chambers(i).pyro(1).shape.outer_diameter=nab(text,'sphereOD_starNFIN',i,'mm')     
                ac.assembly.chambers(i).pyro(1).shape.fin_diameter=nab(text,'starID_waferID_triBL_surfAREA',i,'mm')     
                ac.assembly.chambers(i).pyro(1).shape.fin_thickness=nab(text,'tabDOME_waferNBREAK_starFINTHICK',i,'mm')        
                ac.assembly.chambers(i).pyro(1).shape.cylinder_height="10 mm" // just a placeholder since the deck files don't havethis information
                
                lenstr=msprintf('%.5f mm',height)
                ac.assembly.chambers(i).pyro(1).shape.cylinder_height=lenstr;
                ac.assembly.chambers(i).pyro(1).shape.num_fins=strtod(nab(text,'tabTHICK_triTHICK_waferTHICK_starOD',i,''))
                ac.assembly.chambers(i).pyro(1).amount=ngrainsi;
         //     ac.assembly.chambers(i).pyro(1).density=(msprintf("%.6f",perfect_density)+' g/cm^3')
            end
        end
    end
    //If there is no pyro in a chamber the structure defaults to pyro = []
    //This loop removes and empty pyro children for each chamber so no 
    //erroneous output is written to the JSON file
    for i = 1:1:max(size(ac.assembly.chambers))
        try
            if ac.assembly.chambers(i).pyro(1) == []
               ac.assembly.chambers(i).pyro(1)=null()  
            end
            
            if ac.assembly.chambers(i).filter == []
               ac.assembly.chambers(i).filter = null()
            end
            
        catch
            mprintf('No pyros in chamber %i\n', i )
        end
    end
endfunction

function [ac]=GetHeatTransferDetails(ac, text, ncham)  
    //  from AIPP:  REAL(DP) :: rhosteel = 7833.d0, cpsteel=510.d0, ksteel=45.0d0
    default_density_string="7833.0 kg/m^3"
    default_conductivity_string="45.0 W/(m K)"
    default_specific_heat_string="510.0 J/(kg K)"
    default_heat_transfer_coefficient = "10 W/(m^2 K)"

    for i=1:ncham
        ac.assembly.walls(i).area=ComputeAreaFromVolume(ac.assembly.chambers(i).volume)
        ac.assembly.walls(i).thickness=nab(text,'wall_thickness_mass', i, 'mm')
        ac.assembly.walls(i).density=default_density_string
        ac.assembly.walls(i).thermal_conductivity=default_conductivity_string
        ac.assembly.walls(i).specific_heat=default_specific_heat_string
        ac.assembly.walls(i).temperature=nab(text,'conditioning_temperature',1,'K')
        ac.assembly.walls(i).right_connection.type='CONSTANT_HEAT'
        ac.assembly.walls(i).right_connection.heat='0 W'
        
        heat_loss = nab(text, 'wall_heatloss_factor', i, '')
        
        first = part(heat_loss,1)

        if first =="-"
            heat_loss_type = "CONSTANT_COEFFICIENT"
            heat_loss_child_key = "heat_transfer_coefficient"
            heat_loss_string = heat_loss + " W/(m^2 K)"
        else
            heat_loss_type = "VARIABLE_COEFFICIENT"
            heat_loss_child_key = "scale_factor"
            heat_loss_string = strtod(heat_loss)
        end
        ac.assembly.walls(i).left_connection.type=heat_loss_type
        ac.assembly.walls(i).left_connection.chamber_index=i//string(i)
        ac.assembly.walls(i).left_connection(heat_loss_child_key) = heat_loss_string
        
        ac.assembly.walls(ncham).temperature='294.15 K' // override the conditioning temp for the tank wall
        
        if i ==1 
            str = "ac.assembly.walls = list(ac.assembly.walls(1)"
        else
            str = str + "ac.assembly.walls(" + string(i)...
        + ")"
        end
    
        if i ~= ncham
             str = str + "," 
        else
            str = str + ")"
        end
    end
    
    execstr(str)
        
endfunction

// function to obtain token (x,y) from text, where text=mgetl(fn))
function [str]=nabstr(text,row,tokennumber,unit_to_apply_in_deck)
    // function that identifies values in the aipp.inp files and then
    // creates the proper translated entries for the JSON files
    str=tokens(text(row))(tokennumber) +' ' +unit_to_apply_in_deck
endfunction

// function to obtain token (x,y) from text, where text=mgetl(fn) and format it as a real)
function [str]=nabstrf(text,row,tokennumber,unit_to_apply_in_deck)
    // function that identifies values in the aipp.inp files and then
    // creates the proper translated entries for the JSON files
    value=strtod(tokens(text(row))(tokennumber));
    str=msprintf('%f',value)+' '+unit_to_apply_in_deck
endfunction


function [val]=nabval(text,row,tokennumber)
    // function that identifies values in the aipp.inp files and then
    // creates the proper translated entries for the JSON files
    val=strtod(tokens(text(row))(tokennumber))
endfunction

function [str]=nabrow(text,row)
    // function that identifies values in the aipp.inp files and then
    // creates the proper translated entries for the JSON files
    str=text(row)
endfunction

function [str]=nab(text,fieldname,tokennumber,unit)
    // function that identifies values in the DECK files and then
    // creates the proper translated entries for the JSON files
    [nrows,junk]=size(text)
    for i=1:nrows
        fields(i)=(tokens(text(i))($))
    end
    therow=find(fields==fieldname)
    str=tokens(text(therow))(tokennumber) +' ' +unit 
endfunction

// script to plunge into any file to pull a subset of the data based on fieldnames
// and return a structure containing the fields
function [res]=GetNumFromDeck(fn, FieldString, TokenNumber)
    //a=mgetl(fn);
    a=fn;
    [x,y]=grep(a,FieldString)
    RowTokens=(a(x))
    res=strtod(tokens(RowTokens)(TokenNumber))
endfunction

function [area]=ComputeAreaFromVolume(vol)
    volume=strtod(tokens(vol)(1));
    unit=tokens(vol)(2)
    select unit
    case("mm^3") then
        volume=volume/1e9
    case("cm^3") then
        volume=volume/1e6
    case("L") then 
        volume=volume/1e3
    end
    // below, artificially scaling by 2.5 like AIPP-2.3.5 does
    // area=(2.5*(4.0*%pi)*((3.0*volume)/(4.0*%pi))^(2.0/3.0))
    area=((4.0*%pi)*((3.0*volume)/(4.0*%pi))^(2.0/3.0))
    area=string(area*1e4)+' cm^2'
endfunction

function out = getAuxiliaryDefaults()
    out("species_library") = "auxiliary_files/species_library.json";
    out("pyro_formulations") = "auxiliary_files/pyrolist.json";
    out("materials") = "auxiliary_files/material_list.json"
endfunction

function out = getHeaderDefaults(fname)
    out("request_number") =  " - ";
    out("title") =  "Converted from " + fname + ".deck";
    out("system") =  " - ";
    out("part_number") =  " - ";
    out("description") =  "JSON file converted from AIPP 2.3.5 input deck. Please check inputs";
endfunction

function JSON = deckToJSON(deckFileName)
    AIPP235Doc.long = deckFileName;
    AIPP235Doc.short = fileparts(AIPP235Doc.long, "fname");

    // now read in the deck file you want to convert
    text=mgetl(AIPP235Doc.long);

    // gather some preliminary information
    ncham=strtod(tokens(text(5))(1))

    ac=GetTimes(text)

    ac = AddDefaultReactions(ac)

    ac=GetChamberDetails(ac, text, ncham)

    ac=GetOrificeDetails(ac,text,ncham)

    ac=GetFilterDetails(ac, text, ncham)

    ac=GetPyroDetails(ac,text,ncham)

    ac=GetHeatTransferDetails(ac, text, ncham)  

    res.aipp_calculation=ac;

    organized.aipp_calculation.header = getHeaderDefaults(AIPP235Doc.short);
    organized.aipp_calculation.auxiliary_files = getAuxiliaryDefaults();
    organized.aipp_calculation.time_specs = res.aipp_calculation.time_specs;
    organized.aipp_calculation.reaction_specs = res.aipp_calculation.reaction_specs;
    organized.aipp_calculation.assembly = res.aipp_calculation.assembly;

    JSON = toJSON(organized, 3);
    JSON = FixJSON(JSON);
 
endfunction