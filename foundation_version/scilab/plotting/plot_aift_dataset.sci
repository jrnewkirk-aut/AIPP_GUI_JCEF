function p3510AiftReset()
 global P3510_AIFT_X P3510_AIFT_Y P3510_AIFT_HEADERS P3510_AIFT_FILES P3510_AIFT_LOAD_MS P3510_AIFT_POINTS;P3510_AIFT_X=list();P3510_AIFT_Y=list();P3510_AIFT_HEADERS=list();P3510_AIFT_FILES=[];P3510_AIFT_LOAD_MS=[];P3510_AIFT_POINTS=[];
endfunction
function row=p3510AsNumericRow(v)
 row=v;if typeof(row)<>"constant" then error("utsread returned a nonnumeric data array.");end;row=matrix(row,1,-1);
endfunction
function [count,totalPoints,loadMs]=p3510LoadAiftDataset(folderPath,limit)
 global P3_DATASET_ACTIVE P3_DATASET_ID P3_CURVE_COUNT P3_POINTS_PER_CURVE P3_X_MIN P3_X_MAX P3_VIEWPORT_CACHE_KEYS P3_VIEWPORT_CACHE_VALUES P3510_AIFT_X P3510_AIFT_Y P3510_AIFT_HEADERS P3510_AIFT_FILES P3510_AIFT_LOAD_MS P3510_AIFT_POINTS;
 if exists("utsread")==0 then error("UTSREAD_NOT_AVAILABLE: Load the toolbox providing utsread.");end;if ~isdir(folderPath) then error("AIFT_DATA_FOLDER_NOT_FOUND: "+folderPath);end;files=gsort(listfiles(fullfile(folderPath,"*.aift")),"g","i");if files==[] then error("NO_AIFT_FILES");end;count=min(size(files,"*"),max(1,limit));p3510AiftReset();totalPoints=0;loadMs=0;P3_X_MIN=%inf;P3_X_MAX=-%inf;
 for i=1:count;started=getdate();[x,y,h]=utsread(files(i));elapsed=etime(getdate(),started)*1000;x=p3510AsNumericRow(x);y=p3510AsNumericRow(y);if size(x,"*")<>size(y,"*")|size(x,"*")<2 then error("AIFT_ARRAY_MISMATCH: "+files(i));end;if or(isnan(x))|or(isinf(x)) then error("AIFT_INVALID_X: "+files(i));end;if or(diff(x)<0) then error("AIFT_X_NOT_MONOTONIC: "+files(i));end;P3510_AIFT_X(i)=x;P3510_AIFT_Y(i)=y;P3510_AIFT_HEADERS(i)=h;P3510_AIFT_FILES(i)=files(i);P3510_AIFT_LOAD_MS(i)=elapsed;P3510_AIFT_POINTS(i)=size(x,"*");totalPoints=totalPoints+size(x,"*");loadMs=loadMs+elapsed;P3_X_MIN=min(P3_X_MIN,min(x));P3_X_MAX=max(P3_X_MAX,max(x));end
 P3_DATASET_ACTIVE=%t;P3_CURVE_COUNT=count;P3_POINTS_PER_CURVE=max(P3510_AIFT_POINTS);P3_DATASET_ID="aift-"+string(count)+"-"+string(getdate("s"));P3_VIEWPORT_CACHE_KEYS=[];P3_VIEWPORT_CACHE_VALUES=list();p358PyramidReset();
endfunction
function [x,y]=p3510AiftRange(curveIndex,xMin,xMax)
 global P3510_AIFT_X P3510_AIFT_Y;x0=P3510_AIFT_X(curveIndex);y0=P3510_AIFT_Y(curveIndex);inside=find(x0>=xMin&x0<=xMax);if inside==[] then [d,idx]=min(abs(x0-(xMin+xMax)/2));x=x0(idx);y=y0(idx);else a=max(1,inside(1)-1);z=min(size(x0,"*"),inside($)+1);x=x0(a:z);y=y0(a:z);end
endfunction
function [x,y,idx]=p3510AiftPoint(curveIndex,xValue)
 global P3510_AIFT_X P3510_AIFT_Y;x0=P3510_AIFT_X(curveIndex);y0=P3510_AIFT_Y(curveIndex);[d,idx]=min(abs(x0-xValue));x=x0(idx);y=y0(idx);
endfunction
