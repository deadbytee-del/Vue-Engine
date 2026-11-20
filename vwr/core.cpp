extern "C" {
unsigned vwr_grid_build(unsigned n,const double*x,const double*y,const double*w,const double*h,double cell);
unsigned vwr_grid_query(double x0,double y0,double x1,double y1,unsigned*out,unsigned cap);
}
#define MAXS 131072
#define MAXD 65536
#define QCAP 4096
static double SX[MAXS],SY[MAXS],SZ[MAXS],SW[MAXS],SH[MAXS],SD[MAXS];
static double SPX[MAXS],SPW[MAXS];
static double SR[MAXS*6];
static double DX[MAXD],DY[MAXD],DZ[MAXD],DW[MAXD],DH[MAXD],DD[MAXD],DVX[MAXD],DVY[MAXD],DVZ[MAXD],DGS[MAXD];
static unsigned char DGR[MAXD];
static unsigned Q[QCAP];
static int D3=0;
static unsigned NS=0,NE=0;
static inline double fabs_(double v){return v<0?-v:v;}
extern "C" {
double*vwr_sx(){return SX;}double*vwr_sy(){return SY;}double*vwr_sz(){return SZ;}
double*vwr_sw(){return SW;}double*vwr_sh(){return SH;}double*vwr_sd(){return SD;}
double*vwr_dx(){return DX;}double*vwr_dy(){return DY;}double*vwr_dz(){return DZ;}
double*vwr_dw(){return DW;}double*vwr_dh(){return DH;}double*vwr_dd(){return DD;}
double*vwr_dvx(){return DVX;}double*vwr_dvy(){return DVY;}double*vwr_dvz(){return DVZ;}
double*vwr_dgs(){return DGS;}unsigned char*vwr_dgr(){return DGR;}
unsigned vwr_max_static(){return MAXS;}
unsigned vwr_max_dynamic(){return MAXD;}
unsigned vwr_static(unsigned n,unsigned ne,int d3,double cell){
if(n>MAXS)n=MAXS;
NS=n;NE=ne;D3=d3;
for(unsigned i=0;i<n;i++){double*r=SR+i*6;r[0]=SX[i];r[1]=SY[i];r[2]=SW[i];r[3]=SH[i];r[4]=SZ[i];r[5]=SD[i];}
if(d3){for(unsigned i=0;i<n;i++){SPX[i]=SZ[i];SPW[i]=SD[i];}return vwr_grid_build(n,SX,SPX,SW,SPW,cell);}
return vwr_grid_build(n,SX,SY,SW,SH,cell);
}
}
static unsigned QN=0;
static void q2(unsigned i,double ex,double ey){
double x=DX[i],y=DY[i],w=DW[i]*0.5,h=DH[i]*0.5;
double x0=x-w,x1=x+w,y0=y-h,y1=y+h;
if(ex<0)x0+=ex;else x1+=ex;
if(ey<0)y0+=ey;else y1+=ey;
QN=vwr_grid_query(x0,y0,x1,y1,Q,QCAP);
}
static void res2(unsigned i,int ax){
double w=DW[i],h=DH[i];
for(unsigned pass=0;pass<2;pass++)for(unsigned k=0;k<QN;k++){
unsigned s=Q[k];
if((s<NE)!=(pass==0))continue;
const double*r=SR+s*6;double sx=r[0],sy=r[1],sw=r[2],sh=r[3];
double x=DX[i],y=DY[i];
if(!(fabs_(x-sx)*2<sw+w&&fabs_(y-sy)*2<sh+h))continue;
if(ax){
if(DVX[i]>0||(DVX[i]==0&&x<sx))DX[i]=sx-(sw+w)*0.5;else DX[i]=sx+(sw+w)*0.5;
DVX[i]=0;
}else{
if(DVY[i]>0||(DVY[i]==0&&y<sy)){DY[i]=sy-(sh+h)*0.5;DGR[i]=1;}else DY[i]=sy+(sh+h)*0.5;
DVY[i]=0;
}
}
}
static void q3(unsigned i,double ex,double ez){
double w=DW[i]*0.5,d=DD[i]*0.5;
double x0=DX[i]-w,x1=DX[i]+w,z0=DZ[i]-d,z1=DZ[i]+d;
if(ex<0)x0+=ex;else x1+=ex;
if(ez<0)z0+=ez;else z1+=ez;
QN=vwr_grid_query(x0,z0,x1,z1,Q,QCAP);
}
static void res3(unsigned i,int ax){
double w=DW[i],h=DH[i],d=DD[i];
for(unsigned k=0;k<QN;k++){
const double*r=SR+Q[k]*6;
double sx=r[0],sy=r[1],sw=r[2],sh=r[3],sz=r[4],sd=r[5];
double x=DX[i],y=DY[i],z=DZ[i];
if(!(fabs_(x-sx)*2<w+sw&&fabs_(y-sy)*2<h+sh&&fabs_(z-sz)*2<d+sd))continue;
if(ax==0){
if(DVX[i]>0||(DVX[i]==0&&x<sx))DX[i]=sx-(sw+w)*0.5;else DX[i]=sx+(sw+w)*0.5;
DVX[i]=0;
}else if(ax==2){
if(DVZ[i]>0||(DVZ[i]==0&&z<sz))DZ[i]=sz-(sd+d)*0.5;else DZ[i]=sz+(sd+d)*0.5;
DVZ[i]=0;
}else{
if(DVY[i]<0||(DVY[i]==0&&y>sy)){DY[i]=sy+(sh+h)*0.5;DGR[i]=1;}else DY[i]=sy-(sh+h)*0.5;
DVY[i]=0;
}
}
}
extern "C" void vwr_step(unsigned n,double dt,double g){
if(n>MAXD)n=MAXD;
if(D3){
for(unsigned i=0;i<n;i++){
DVY[i]-=g*DGS[i]*dt;
q3(i,DVX[i]*dt,DVZ[i]*dt);
DX[i]+=DVX[i]*dt;res3(i,0);
DZ[i]+=DVZ[i]*dt;res3(i,2);
DGR[i]=0;
DY[i]+=DVY[i]*dt;res3(i,1);
}
}else{
for(unsigned i=0;i<n;i++){
DVY[i]+=g*DGS[i]*dt;
double ex=DVX[i]*dt,ey=DVY[i]*dt;
q2(i,ex,ey);
DX[i]+=ex;res2(i,1);
DGR[i]=0;
DY[i]+=DVY[i]*dt;res2(i,0);
}
}
}
