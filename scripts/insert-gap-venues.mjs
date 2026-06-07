import { createClient } from "@supabase/supabase-js";

const s = createClient(
  'https://hhkmbyrwyardhozufusu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoa21ieXJ3eWFyZGhvenVmdXN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4OTU4MywiZXhwIjoyMDk0NzY1NTgzfQ.3Yp-vYfPuonbYzAISpsRxOKlC3fUKmH-X2DxNY7S4BE'
);

const venues = [
  // SOUTH - Elephant & Castle, Camberwell, Walworth, Oval
  {name:"Forza Wine",area:"Camberwell",zone:"South",category:"bar",price:"£15-35pp",vibe_tags:["foodie","social","aesthetic","hidden_gems"],comment:"Natural wine bar with rotating Italian small plates."},
  {name:"Stormbird",area:"Camberwell",zone:"South",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","hidden_gems"],comment:"Craft beer pub with 20 rotating taps and board games."},
  {name:"The Crooked Well",area:"Camberwell",zone:"South",category:"bar",price:"£15-35pp",vibe_tags:["chill","social","foodie"],comment:"Gastropub with excellent cocktails and a walled garden."},
  {name:"Theo's Simple Italian",area:"Camberwell",zone:"South",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","romantic","chill"],comment:"Wood-fired pizza and handmade pasta in a cosy spot."},
  {name:"FM Mangal",area:"Camberwell",zone:"South",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","social","chaotic"],comment:"Legendary Turkish ocakbasi with charcoal-grilled meats."},
  {name:"Silk Road",area:"Camberwell",zone:"South",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","hidden_gems","chill"],comment:"Xinjiang Chinese hand-pulled noodles and cumin lamb."},
  {name:"Burgess Park",area:"Walworth",zone:"South",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","social"],comment:"Large urban park with a lake and multicultural community feel."},
  {name:"South London Gallery",area:"Camberwell",zone:"South",category:"gallery",price:"Free",vibe_tags:["cultural","aesthetic","hidden_gems"],comment:"Free contemporary art gallery with ambitious exhibitions since 1891."},

  // NORTHWEST - Kilburn, West Hampstead, Kensal Green, Willesden
  {name:"The Good Ship",area:"Kilburn",zone:"Northwest",category:"bar",price:"Under £15pp",vibe_tags:["chaotic","social","underground"],comment:"Dive bar and live music venue with emerging bands nightly."},
  {name:"The Alice House",area:"West Hampstead",zone:"Northwest",category:"bar",price:"£15-35pp",vibe_tags:["chill","social","romantic"],comment:"Cosy cocktail bar with candlelit tables."},
  {name:"Paradise by Way of Kensal Green",area:"Kensal Green",zone:"Northwest",category:"bar",price:"£15-35pp",vibe_tags:["chaotic","social","aesthetic","iconic"],comment:"Victorian gin palace with DJs and rooftop garden."},
  {name:"Sacro Cuore",area:"Kensal Rise",zone:"Northwest",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","chill","romantic"],comment:"Neighbourhood pizzeria with Neapolitan dough and garden terrace."},
  {name:"Vijay",area:"Willesden",zone:"Northwest",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","hidden_gems","social"],comment:"South Indian institution serving perfect dosas since 1985."},
  {name:"The Wet Fish Cafe",area:"West Hampstead",zone:"Northwest",category:"cafe",price:"Under £15pp",vibe_tags:["chill","aesthetic","solo"],comment:"Independent cafe with excellent brunch and a quiet garden."},
  {name:"Kensal Green Cemetery",area:"Kensal Green",zone:"Northwest",category:"outdoor",price:"Free",vibe_tags:["outdoor","cultural","hidden_gems","solo"],comment:"Atmospheric Victorian cemetery with Gothic architecture."},
  {name:"The Lexi Cinema",area:"Kensal Rise",zone:"Northwest",category:"experience",price:"Under £15pp",vibe_tags:["cultural","chill","romantic"],comment:"Social enterprise cinema donating profits to charity."},

  // NORTH - Crouch End, Stroud Green, Tufnell Park, Archway, Wood Green
  {name:"The Faltering Fullback",area:"Finsbury Park",zone:"North",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","hidden_gems","outdoor"],comment:"Thai pub with a legendary treehouse beer garden three storeys high."},
  {name:"Banners",area:"Crouch End",zone:"North",category:"restaurant",price:"Under £15pp",vibe_tags:["social","chaotic","foodie"],comment:"Beloved brunch spot with Caribbean-global comfort food."},
  {name:"Pizzeria Pappagone",area:"Crouch End",zone:"North",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","social","chill"],comment:"Neighbourhood Italian with generous portions and BYO wine."},
  {name:"The Woodman",area:"Archway",zone:"North",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","hidden_gems"],comment:"Refurbed pub with craft beer and Highgate Cemetery views."},
  {name:"Alexandra Palace",area:"Wood Green",zone:"North",category:"outdoor",price:"Free",vibe_tags:["outdoor","iconic","social"],comment:"Victorian palace with panoramic London views and boating lake."},

  // SOUTHEAST - Deptford, New Cross, Brockley, Blackheath
  {name:"Marcella",area:"Deptford",zone:"Southeast",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","romantic","hidden_gems"],comment:"Intimate Italian with handmade pasta and natural wines."},
  {name:"The Waiting Room",area:"Deptford",zone:"Southeast",category:"bar",price:"Under £15pp",vibe_tags:["chaotic","social","underground"],comment:"Live music venue and bar in a converted railway station."},
  {name:"Brockley Brewery",area:"Brockley",zone:"Southeast",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","hidden_gems"],comment:"Microbrewery taproom with rotating local beers."},
  {name:"Brookmill",area:"Deptford",zone:"Southeast",category:"restaurant",price:"£15-35pp",vibe_tags:["chill","foodie","hidden_gems"],comment:"Award-winning gastropub with a creek-side garden."},
  {name:"Blackheath Common",area:"Blackheath",zone:"Southeast",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","social"],comment:"Wide open heath with kite-flying and city views."},
  {name:"Rivoli Ballroom",area:"Brockley",zone:"Southeast",category:"experience",price:"£15-35pp",vibe_tags:["cultural","aesthetic","iconic","romantic"],comment:"Last intact 1950s ballroom in London — swing nights."},

  // SOUTHWEST - Tooting, Streatham, Earlsfield, Wandsworth
  {name:"Graveney Gin",area:"Tooting",zone:"Southwest",category:"bar",price:"£15-35pp",vibe_tags:["chill","aesthetic","hidden_gems"],comment:"Micro-distillery bar making gin on-site."},
  {name:"The Antelope",area:"Tooting",zone:"Southwest",category:"bar",price:"Under £15pp",vibe_tags:["social","chill","foodie"],comment:"Best Sunday roast in Tooting with a large beer garden."},
  {name:"Lahore Karahi",area:"Tooting",zone:"Southwest",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","social","chaotic","iconic"],comment:"BYO Pakistani grill with queue-worthy lamb chops."},
  {name:"Hana",area:"Streatham",zone:"Southwest",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","aesthetic","romantic"],comment:"Korean-inspired small plates with natural wines."},
  {name:"Tooting Bec Common",area:"Tooting",zone:"Southwest",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","social","active"],comment:"90-acre common with athletics track and nearby Lido."},

  // WEST - Shepherds Bush, Acton, Ealing, Brook Green
  {name:"The Oak W12",area:"Shepherds Bush",zone:"West",category:"bar",price:"£15-35pp",vibe_tags:["chill","social","foodie"],comment:"Stylish gastropub with craft cocktails."},
  {name:"Kiraku",area:"Ealing",zone:"West",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","hidden_gems","chill"],comment:"Tiny Japanese restaurant — best sushi in West London."},
  {name:"Santa Maria Pizzeria",area:"Ealing",zone:"West",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","social","iconic"],comment:"Award-winning Neapolitan pizza rivalling central."},
  {name:"Acton Park",area:"Acton",zone:"West",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","social"],comment:"Community park with mature trees and bowling green."},
  {name:"The Gate",area:"Brook Green",zone:"West",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","romantic","aesthetic"],comment:"Pioneering vegetarian fine dining in a converted church."},
];

(async () => {
  let inserted = 0;
  for (const v of venues) {
    const { error } = await s.from('experiences').insert({ ...v, status: 'pending', is_event: false });
    if (error) console.log('Error:', v.name, error.message);
    else inserted++;
  }
  console.log(`Inserted ${inserted} venues as pending (check Admin tab to approve)`);
})();
