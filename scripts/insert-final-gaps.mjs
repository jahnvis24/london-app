import { createClient } from "@supabase/supabase-js";

const s = createClient(
  'https://hhkmbyrwyardhozufusu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoa21ieXJ3eWFyZGhvenVmdXN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4OTU4MywiZXhwIjoyMDk0NzY1NTgzfQ.3Yp-vYfPuonbYzAISpsRxOKlC3fUKmH-X2DxNY7S4BE'
);

const venues = [
  // SOUTH - Stockwell, Oval
  {name:"The Canton Arms",area:"Stockwell",zone:"South",category:"bar",price:"Under £15pp",vibe_tags:["foodie","chill","hidden_gems"],comment:"Michelin-listed gastropub — exceptional food in a proper boozer."},
  {name:"Brunswick House",area:"Stockwell",zone:"South",category:"restaurant",price:"£15-35pp",vibe_tags:["aesthetic","romantic","hidden_gems","cultural"],comment:"Restaurant in a Georgian mansion filled with salvaged antiques."},
  {name:"Caboose Stockwell",area:"Stockwell",zone:"South",category:"cafe",price:"Under £15pp",vibe_tags:["chill","aesthetic","solo"],comment:"Specialty coffee and brunch in a converted railway arch."},
  {name:"Stockwell War Memorial Garden",area:"Stockwell",zone:"South",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","solo"],comment:"Quiet memorial garden with benches — a hidden pause in the city."},
  {name:"The Oval Tavern",area:"Oval",zone:"South",category:"bar",price:"Under £15pp",vibe_tags:["social","chill"],comment:"Community pub with live music, comedy, and a garden."},
  {name:"Kennington Park Cafe",area:"Oval",zone:"South",category:"cafe",price:"Under £15pp",vibe_tags:["chill","outdoor","social"],comment:"Park cafe with outdoor seating near The Oval cricket ground."},

  // EAST - Stepney, Poplar
  {name:"The George Tavern",area:"Stepney",zone:"East",category:"bar",price:"Under £15pp",vibe_tags:["chaotic","underground","cultural","iconic"],comment:"Historic music venue — Amy Winehouse played her first gig here."},
  {name:"Stepney City Farm",area:"Stepney",zone:"East",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","hidden_gems","solo"],comment:"Urban farm with animals, gardens, and a community cafe."},
  {name:"Poplar Union",area:"Poplar",zone:"East",category:"experience",price:"Under £15pp",vibe_tags:["cultural","social","hidden_gems"],comment:"Community arts centre with theatre, exhibitions, and cafe."},
  {name:"All Saints DLR Park",area:"Poplar",zone:"East",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill"],comment:"Small riverside park with Canary Wharf skyline views."},

  // SOUTHEAST - Catford, Honor Oak, Nunhead, Lee
  {name:"The Catford Constitutional Club",area:"Catford",zone:"Southeast",category:"bar",price:"Under £15pp",vibe_tags:["social","chill","hidden_gems"],comment:"Wetherspoons in a former concert hall — ornate ceiling intact."},
  {name:"Catford Food Market",area:"Catford",zone:"Southeast",category:"market",price:"Under £15pp",vibe_tags:["foodie","social","chaotic"],comment:"Weekly street food market with global cuisines."},
  {name:"The Honor Oak",area:"Honor Oak",zone:"Southeast",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","foodie"],comment:"Refurbished pub with craft beer and weekend pizzas."},
  {name:"One Tree Hill",area:"Honor Oak",zone:"Southeast",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","hidden_gems","romantic"],comment:"Hilltop nature reserve with panoramic London skyline views."},
  {name:"Nunhead Cemetery",area:"Nunhead",zone:"Southeast",category:"outdoor",price:"Free",vibe_tags:["outdoor","cultural","hidden_gems","solo","aesthetic"],comment:"Overgrown Victorian cemetery — one of the Magnificent Seven, utterly atmospheric."},
  {name:"The Ivy House",area:"Nunhead",zone:"Southeast",category:"bar",price:"Under £15pp",vibe_tags:["social","cultural","hidden_gems"],comment:"Community-owned pub saved from developers — live music and comedy."},
  {name:"The Old Tiger Head",area:"Lee",zone:"Southeast",category:"bar",price:"Under £15pp",vibe_tags:["chill","social"],comment:"Cosy village pub with Thai food and a fireplace."},
  {name:"Manor House Gardens",area:"Lee",zone:"Southeast",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","romantic"],comment:"Edwardian park with a lake, old library, and quiet paths."},

  // SOUTHWEST - Colliers Wood, Morden, Raynes Park, Norbury
  {name:"The Charles Holden",area:"Colliers Wood",zone:"Southwest",category:"bar",price:"Under £15pp",vibe_tags:["social","chill"],comment:"Named after the Tube architect — craft beers and pub grub."},
  {name:"Merton Abbey Mills",area:"Colliers Wood",zone:"Southwest",category:"market",price:"Under £15pp",vibe_tags:["chill","social","foodie","hidden_gems"],comment:"Riverside craft market and food stalls on weekends."},
  {name:"Morden Hall Park",area:"Morden",zone:"Southwest",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","romantic","hidden_gems"],comment:"National Trust parkland with wetlands, deer, and a rose garden."},
  {name:"The Leather Bottle",area:"Morden",zone:"Southwest",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","outdoor"],comment:"Historic pub with a large garden backing onto the park."},
  {name:"The Cavern Raynes Park",area:"Raynes Park",zone:"Southwest",category:"bar",price:"Under £15pp",vibe_tags:["chill","social"],comment:"Freehouse with rotating guest ales and quiz nights."},
  {name:"The Bee",area:"Norbury",zone:"Southwest",category:"bar",price:"Under £15pp",vibe_tags:["social","chill"],comment:"Community pub with beer garden and family-friendly vibes."},
  {name:"Norbury Park",area:"Norbury",zone:"Southwest",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","active"],comment:"Large green space with playing fields and mature woodland."},

  // WEST - Hanwell
  {name:"The Fox Hanwell",area:"Hanwell",zone:"West",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","foodie"],comment:"Village pub with excellent Sunday roasts and a courtyard."},
  {name:"Broom Water Park",area:"Hanwell",zone:"West",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","hidden_gems"],comment:"Canal-side green space near the Hanwell flight of locks."},
];

(async () => {
  let n = 0;
  for (const v of venues) {
    const { error } = await s.from('experiences').insert({ ...v, status: 'pending', is_event: false });
    if (error) console.log('Err:', v.name, error.message);
    else n++;
  }
  console.log(`Inserted ${n} venues as pending`);
})();
