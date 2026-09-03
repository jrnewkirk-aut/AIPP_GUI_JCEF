function [xo,yo]=p3ReduceLTTB(x,y,threshold)
 n=size(x,"*");threshold=max(3,min(threshold,n));if threshold>=n then xo=x;yo=y;return;end
 xo=zeros(1,threshold);yo=zeros(1,threshold);xo(1)=x(1);yo(1)=y(1);xo($)=x($);yo($)=y($);a=1;every=(n-2)/(threshold-2);
 for i=1:(threshold-2)
  avgStart=floor((i+1)*every)+2;avgEnd=min(n,floor((i+2)*every)+2);if avgStart>n then avgStart=n;end;if avgEnd<avgStart then avgEnd=avgStart;end
  avgX=mean(x(avgStart:avgEnd));avgY=mean(y(avgStart:avgEnd));rangeStart=floor((i-1)*every)+2;rangeEnd=min(n-1,floor(i*every)+2);best=-1;chosen=rangeStart;
  for j=rangeStart:rangeEnd
   area=abs((x(a)-avgX)*(y(j)-y(a))-(x(a)-x(j))*(avgY-y(a)));
   if area>best then best=area;chosen=j;end
  end
  xo(i+1)=x(chosen);yo(i+1)=y(chosen);a=chosen;
 end
endfunction
function [xo,yo,level]=p3ReducePyramid(x,y,pixelWidth)
 n=size(x,"*");target=max(2,2*pixelWidth);level=0;stride=1;while ceil(n/stride)>target;stride=stride*2;level=level+1;end;ids=1:stride:n;if ids($)<>n then ids=[ids n];end;xo=x(ids);yo=y(ids);
endfunction
function yi=p3InterpLinear(xr,yr,x)
 yi=interp1(xr,yr,x,"linear");
endfunction
function m=p3FidelityAdvanced(x,y,xr,yr)
 yi=p3InterpLinear(xr,yr,x);d=yi-y;sourceArea=inttrap(x,y);reducedArea=inttrap(xr,yr);[smax,imax]=max(y);[rmax,irmax]=max(yr);[smin,imin]=min(y);[rmin,irmin]=min(yr);
 m=struct("rms_error",sqrt(mean(d.^2)),"area_relative_error",abs(reducedArea-sourceArea)/max(1d-12,abs(sourceArea)), ...
 "positive_peak_error",abs(smax-rmax),"negative_peak_error",abs(smin-rmin),"positive_peak_time_error",abs(x(imax)-xr(irmax)),"negative_peak_time_error",abs(x(imin)-xr(irmin)), ...
 "first_error",abs(y(1)-yr(1)),"last_error",abs(y($)-yr($)),"boundary_error",max(abs([y(1)-yr(1),y($)-yr($)])));
endfunction
