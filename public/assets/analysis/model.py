"""Preliminary paddy dryer sizing; no measured data. All lengths SI except named mm."""
import math,json
P=101.325

def psat(t): return .61094*math.exp(17.625*t/(t+243.04))
def omega(t,rh):
 p=rh*psat(t); return .622*p/(P-p)
def h(t,w): return 1.006*t+w*(2501+1.86*t)
def specific_volume(t,w): return .287042*(t+273.15)*(1+1.607858*w)/P
def ergun(v,L=.6,eps=.45,dp=.0025,mu=2.07e-5,rho=1): return L*(150*mu*(1-eps)**2/(eps**3*dp**2)*v+1.75*rho*(1-eps)/(eps**3*dp)*v*v)
def calc(m=100,mi=.22,mf=.14,rhob=560,L=.6,inner=.25,tout=.002,outer=.67,hours=6,ambient=30,rh=.70,air=80,exhaust=45,rhout=.70):
 if not(0<=mf<mi<1 and m>0 and rhob>0 and L>0 and hours>0 and 0<inner<outer-2*tout and 0<=rh<=1 and 0<=rhout<=1): raise ValueError('Invalid geometry or inputs')
 water=m*(mi-mf)/(1-mf); A=math.pi/4*((outer-2*tout)**2-inner**2); req=m/rhob; d_req=2*math.sqrt(req/(math.pi*L)+(inner/2)**2)+2*tout
 wi,wo=omega(ambient,rh),omega(exhaust,rhout); dw=wo-wi
 if dw<=0: raise ValueError('Nonpositive humidity pickup')
 md=water/(hours*3600*dw); q=md*specific_volume(air,wi); v=q/A; rho=(1+wi)/specific_volume(air,wi)
 useful=water*2406+m*1.7*15
 return dict(water_kg=water,dry_solids_kg=m*(1-mi),final_mass_kg=m-water,required_volume_m3=req,area_m2=A,capacity_kg=A*L*rhob,required_outer_OD_mm=1000*d_req,radial_gap_mm=1000*((outer-2*tout-inner)/2),omega_in=wi,omega_out=wo,humidity_pickup=dw,dry_air_kg_s=md,flow_m3_h=3600*q,superficial_m_s=v,bed_dp_Pa=ergun(v,L,rho=rho),useful_MJ=useful/1000,legacy_margin_kW=1.5*useful/(hours*3600),air_preheat_kW=md*(h(air,wi)-h(ambient,wi)),bed_enthalpy_increase_kW=md*(h(exhaust,wo)-h(air,wi)),solar_gross_kW=.9*600*outer*L/1000,legacy_dp_Pa=ergun(.057),inner_open_pct=100*math.pi/(2*math.sqrt(3))*(1.5/6)**2,outer_open_pct=100*math.pi/(2*math.sqrt(3))*(2/12)**2)
if __name__=='__main__':
 d=calc(); print(json.dumps(d,indent=2)); assert abs(d['water_kg']-9.30232558)<1e-6; assert abs(d['capacity_kg']-100.56)<.02; assert d['bed_enthalpy_increase_kW']>0
