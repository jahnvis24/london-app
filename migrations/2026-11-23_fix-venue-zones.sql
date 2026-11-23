-- Re-zone venues whose stored zone contradicts their coordinates.
-- Bearing/distance from Charing Cross (51.512, -0.123): <4km Central,
-- otherwise one of 8 compass zones. Only touches rows labelled Central that sit >4.5km
-- out (old "Central" fallback in the save flow), plus Hampstead Heath (tagged South).
with c as (
  select id, (lat::float-51.512)*111 dy, (lng::float+0.123)*69 dx
  from experiences where lat is not null and lng is not null
), z as (
  select id, sqrt(dx*dx+dy*dy) d, degrees(atan2(dx,dy)) b from c
), calc as (
  select id, d, case when d>30 then 'Outskirts'
    when b between -22.5 and 22.5 then 'North' when b between 22.5 and 67.5 then 'Northeast'
    when b between 67.5 and 112.5 then 'East' when b between 112.5 and 157.5 then 'Southeast'
    when b between -67.5 and -22.5 then 'Northwest' when b between -112.5 and -67.5 then 'West'
    when b between -157.5 and -112.5 then 'Southwest' else 'South' end zone
  from z
)
update experiences e set zone = calc.zone
from calc
where e.id = calc.id and (
  (e.zone = 'Central' and calc.d > 4.5)
  or (e.name = 'Hampstead Heath' and e.zone = 'South')
) and calc.zone <> 'Outskirts';  -- zone check constraint has no Outskirts; leave out-of-London rows

-- Greenwich straddles the East/Southeast bearing line; keep the neighbourhood together.
update experiences set zone = 'Southeast' where area = 'Greenwich' and zone = 'East';
