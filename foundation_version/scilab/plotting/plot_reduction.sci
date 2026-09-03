function [xo,yo]=p3ReduceMinMax(x,y,pixelWidth)
 n=size(x,"*"); buckets=max(1,min(pixelWidth,n)); if n<=2*buckets then xo=x;yo=y;return;end
 edges=round(linspace(1,n+1,buckets+1)); xo=[];yo=[];
 for b=1:buckets
  a=edges(b); z=max(a,min(n,edges(b+1)-1)); seg=y(a:z); [mn,imn]=min(seg);[mx,imx]=max(seg); imn=a+imn-1;imx=a+imx-1;
  if imn<=imx then xo=[xo x(imn) x(imx)];yo=[yo mn mx]; else xo=[xo x(imx) x(imn)];yo=[yo mx mn];end
 end
endfunction
function [xo,yo]=p3ReduceFLMM(x,y,pixelWidth)
 n=size(x,"*"); buckets=max(1,min(pixelWidth,n)); if n<=4*buckets then xo=x;yo=y;return;end
 edges=round(linspace(1,n+1,buckets+1));xo=[];yo=[];
 for b=1:buckets
  a=edges(b);z=max(a,min(n,edges(b+1)-1));seg=y(a:z);[mn,imn]=min(seg);[mx,imx]=max(seg);ids=unique([a,a+imn-1,a+imx-1,z]);ids=gsort(ids,"g","i");xo=[xo x(ids)];yo=[yo y(ids)];
 end
endfunction
function m=p3Fidelity(sourceY,reducedY)
 m=struct("source_min",min(sourceY),"source_max",max(sourceY),"reduced_min",min(reducedY),"reduced_max",max(reducedY), ...
          "min_error",abs(min(sourceY)-min(reducedY)),"max_error",abs(max(sourceY)-max(reducedY)));
endfunction
