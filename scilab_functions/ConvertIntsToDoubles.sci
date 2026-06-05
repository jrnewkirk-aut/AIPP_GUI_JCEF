function doubled_ints = ConvertIntsToDoublesJSON(json_txt, vars)
    for i=1:1:max(size(vars))
        regex.pre = '/\b'
        regex.post = '\b/'
        rows = grep(json_txt, regex.pre + vars(i) + regex.post, 'r')
        if rows ~= []
            for j=1:1:max(size(rows))
                colsindex = strindex(json_txt(rows(j)),":")
                temp = strsplit(json_txt(rows(j)),":")(2)
                numsindex = strindex(temp,"/[0-9]/",'r')
                numsindex = numsindex+colsindex
                start = min(numsindex)
                stop = max(numsindex)

                intval = part(json_txt(rows(j)),start:stop)
                if strindex(intval,"^") ~=0
                    intval = strsplit(intval," ")(1)
                end
                intval2 = intval

                //Check if an adequate precision already exists
                parts = strsplit(intval2, ".")
                if max(size(parts)) ~= 1
                    fractional = parts(2)
                    precision = length(fractional)
                else
                    precision = 2
                end

                if part(json_txt(rows(j)),start-1) == "."                
                    intval2 = strcat(["0.", intval2])
                    intval = strcat([".",intval])
                end
                
                precision_string = "%." + string(precision) + "f"
                json_txt(rows(j)) = strsubst(json_txt(rows(j)), ...
                                             intval, ...
                                             msprintf(precision_string, ...
                                             strtod(intval2)))  
            end
        end 
    end
    doubled_ints = json_txt
endfunction