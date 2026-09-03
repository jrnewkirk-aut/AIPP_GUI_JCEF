function p3CreateDataset(curveCount, pointsPerCurve, seed)
 global P3_DATASET_ACTIVE P3_DATASET_ID P3_CURVE_COUNT P3_POINTS_PER_CURVE P3_X_MIN P3_X_MAX P3_DATASET_SEED P3_VIEWPORT_CACHE_KEYS P3_VIEWPORT_CACHE_VALUES;
 P3_DATASET_ACTIVE=%t; P3_DATASET_ID="synthetic-"+string(curveCount)+"x"+string(pointsPerCurve)+"-s"+string(seed);
 P3_CURVE_COUNT=curveCount; P3_POINTS_PER_CURVE=pointsPerCurve; P3_X_MIN=0; P3_X_MAX=1; P3_DATASET_SEED=seed;
 P3_VIEWPORT_CACHE_KEYS=[]; P3_VIEWPORT_CACHE_VALUES=list(); p358PyramidReset();
endfunction
function y=p3SyntheticY(curveIndex,x)
 phase=curveIndex*0.071; freq=1+modulo(curveIndex,11); y=sin(2*%pi*freq*x+phase)+0.18*sin(2*%pi*(freq*7+1)*x);
 // Deterministic narrow extrema and step features.
 peakX=0.15+0.7*modulo(curveIndex*37,97)/97; dipX=0.12+0.72*modulo(curveIndex*53,101)/101;
 y=y+3.5*exp(-((x-peakX)/0.0008).^2)-3.0*exp(-((x-dipX)/0.0011).^2)+(x>0.62)*0.45;
endfunction
function [x,y]=p3FullRange(curveIndex,xMin,xMax)
 global P3_DATASET_ID;if part(P3_DATASET_ID,1:min(5,length(P3_DATASET_ID)))=="aift-" then [x,y]=p3510AiftRange(curveIndex,xMin,xMax);return;end;global P3_POINTS_PER_CURVE;i0=max(0,floor(xMin*(P3_POINTS_PER_CURVE-1)));i1=min(P3_POINTS_PER_CURVE-1,ceil(xMax*(P3_POINTS_PER_CURVE-1)));idx=i0:i1;x=idx/(P3_POINTS_PER_CURVE-1);y=p3SyntheticY(curveIndex,x);
endfunction
