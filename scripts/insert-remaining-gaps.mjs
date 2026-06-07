import { createClient } from "@supabase/supabase-js";

const s = createClient(
  'https://hhkmbyrwyardhozufusu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoa21ieXJ3eWFyZGhvenVmdXN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4OTU4MywiZXhwIjoyMDk0NzY1NTgzfQ.3Yp-vYfPuonbYzAISpsRxOKlC3fUKmH-X2DxNY7S4BE'
);

const venues = [
  // CENTRAL - Pimlico, Westminster, Bloomsbury
  {name:"A Wong",area:"Pimlico",zone:"Central",category:"restaurant",price:"£35-70pp",vibe_tags:["foodie","fancy","cultural","iconic"],comment:"Two Michelin stars — finest dim sum in London."},
  {name:"The Vincent Rooms",area:"Pimlico",zone:"Central",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","hidden_gems","chill"],comment:"Student-run restaurant training future chefs — incredible value."},
  {name:"Pimlico Garden Cafe",area:"Pimlico",zone:"Central",category:"cafe",price:"Under £15pp",vibe_tags:["chill","outdoor","solo"],comment:"Hidden cafe in a walled garden off Pimlico Road."},
  {name:"The Gallery Cafe at St James",area:"Westminster",zone:"Central",category:"cafe",price:"Under £15pp",vibe_tags:["chill","cultural","hidden_gems"],comment:"Peaceful courtyard cafe inside a Piccadilly church."},
  {name:"Lamb and Flag",area:"Bloomsbury",zone:"Central",category:"bar",price:"Under £15pp",vibe_tags:["chill","iconic","cultural"],comment:"One of Londons oldest pubs — Dickens drank here."},
  {name:"The Bloomsbury Club Bar",area:"Bloomsbury",zone:"Central",category:"bar",price:"£15-35pp",vibe_tags:["fancy","romantic","aesthetic"],comment:"Art Deco cocktail bar in the Bloomsbury Hotel."},
  {name:"Russell Square",area:"Bloomsbury",zone:"Central",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","solo"],comment:"Elegant Georgian square with fountain and cafe."},

  // NORTH - Muswell Hill, Highgate, Barnsbury, Stroud Green
  {name:"Toffs of Muswell Hill",area:"Muswell Hill",zone:"North",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","iconic","social"],comment:"Best fish and chips in North London since 1968."},
  {name:"The Clissold Arms",area:"Muswell Hill",zone:"North",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","outdoor"],comment:"Huge beer garden with BBQ and live music weekends."},
  {name:"The Flask Highgate",area:"Highgate",zone:"North",category:"bar",price:"Under £15pp",vibe_tags:["chill","iconic","cultural"],comment:"17th century pub at the top of Highgate village."},
  {name:"Highgate Cemetery",area:"Highgate",zone:"North",category:"outdoor",price:"Under £15pp",vibe_tags:["cultural","aesthetic","hidden_gems","solo"],comment:"Gothic Victorian cemetery — Karl Marx buried here."},
  {name:"The Albion Barnsbury",area:"Barnsbury",zone:"North",category:"bar",price:"£15-35pp",vibe_tags:["chill","social","foodie","outdoor"],comment:"Gastropub with a gorgeous walled garden."},
  {name:"Trullo",area:"Barnsbury",zone:"North",category:"restaurant",price:"£35-70pp",vibe_tags:["foodie","romantic","chill"],comment:"Charcoal grill Italian — handmade pasta daily."},
  {name:"The Crooked Billet",area:"Stroud Green",zone:"North",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","outdoor"],comment:"Local pub with beer garden and weekend DJs."},
  {name:"Il Bacio Stroud Green",area:"Stroud Green",zone:"North",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","social","chill"],comment:"Neighbourhood Italian with wood-fired oven and BYO."},

  // NORTHWEST - Swiss Cottage, St Johns Wood, Brondesbury, Cricklewood
  {name:"Bradley's",area:"Swiss Cottage",zone:"Northwest",category:"restaurant",price:"£35-70pp",vibe_tags:["foodie","romantic","fancy"],comment:"French-British fine dining institution since 1990."},
  {name:"The Clifton",area:"St Johns Wood",zone:"Northwest",category:"bar",price:"£15-35pp",vibe_tags:["chill","social","hidden_gems"],comment:"Historic pub where Edward VII kept a secret room."},
  {name:"Harry Morgan",area:"St Johns Wood",zone:"Northwest",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","iconic","social"],comment:"Legendary Jewish deli — salt beef bagels since 1948."},
  {name:"The Queensbury",area:"Brondesbury",zone:"Northwest",category:"bar",price:"Under £15pp",vibe_tags:["social","chill","foodie"],comment:"Award-winning gastropub with craft beer and Sunday roasts."},
  {name:"Crown Cricklewood",area:"Cricklewood",zone:"Northwest",category:"bar",price:"Under £15pp",vibe_tags:["social","chill"],comment:"Irish-leaning local with live music and a warm crowd."},

  // EAST - Clapton, Mile End, Leyton, Leytonstone, Limehouse, Victoria Park
  {name:"Chatsworth Road Market",area:"Clapton",zone:"East",category:"market",price:"Under £15pp",vibe_tags:["foodie","social","chill","hidden_gems"],comment:"Sunday market with street food, vinyl, and artisan goods."},
  {name:"The Crooked Billet Clapton",area:"Clapton",zone:"East",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","hidden_gems"],comment:"No-frills pub with a huge garden and craft beers."},
  {name:"Barge East",area:"Clapton",zone:"East",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","romantic","aesthetic","hidden_gems"],comment:"Restaurant on a Dutch barge — hyper seasonal, canal-side."},
  {name:"Mile End Park",area:"Mile End",zone:"East",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","active","social"],comment:"Green bridge connecting parks with sports facilities and art."},
  {name:"The Palm Tree",area:"Mile End",zone:"East",category:"bar",price:"Under £15pp",vibe_tags:["chill","hidden_gems","cultural","iconic"],comment:"Old East End boozer with live jazz — time-capsule pub."},
  {name:"Leyton Technical",area:"Leyton",zone:"East",category:"bar",price:"Under £15pp",vibe_tags:["social","aesthetic","hidden_gems"],comment:"Former library turned bar-restaurant with courtyard."},
  {name:"The Red Lion Leytonstone",area:"Leytonstone",zone:"East",category:"bar",price:"Under £15pp",vibe_tags:["social","chill","cultural"],comment:"Arts pub with comedy, film nights, and craft beer."},
  {name:"The Grapes",area:"Limehouse",zone:"East",category:"bar",price:"£15-35pp",vibe_tags:["chill","iconic","cultural","romantic"],comment:"16th century Thames pub — Ian McKellen is co-owner."},
  {name:"Pavilion Cafe Victoria Park",area:"Victoria Park",zone:"East",category:"cafe",price:"Under £15pp",vibe_tags:["outdoor","chill","social","aesthetic"],comment:"Lakeside cafe in the park — brunch queues worth it."},

  // SOUTHEAST - New Cross, Lewisham, Dulwich, Woolwich
  {name:"The Amersham Arms",area:"New Cross",zone:"Southeast",category:"bar",price:"Under £15pp",vibe_tags:["chaotic","social","underground"],comment:"Live music venue and art space above a proper boozer."},
  {name:"Malpas Road Kitchen",area:"New Cross",zone:"Southeast",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","hidden_gems","chill"],comment:"Tiny neighbourhood BYOB with changing weekly menu."},
  {name:"The Ravensbourne Arms",area:"Lewisham",zone:"Southeast",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","hidden_gems"],comment:"Community pub revived with natural wines and DJs."},
  {name:"Sparrow Lewisham",area:"Lewisham",zone:"Southeast",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","social","aesthetic"],comment:"Modern bistro with seasonal British menu and cocktails."},
  {name:"Dulwich Picture Gallery",area:"Dulwich",zone:"Southeast",category:"gallery",price:"Under £15pp",vibe_tags:["cultural","aesthetic","romantic","iconic"],comment:"Worlds first purpose-built public art gallery — Rembrandts included."},
  {name:"Dulwich Park",area:"Dulwich",zone:"Southeast",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","romantic","social"],comment:"Boating lake, cafe, and beautiful flower gardens."},
  {name:"Woolwich Works",area:"Woolwich",zone:"Southeast",category:"experience",price:"£15-35pp",vibe_tags:["cultural","aesthetic","social"],comment:"Former arsenal buildings turned arts venue with gigs and food."},

  // SOUTHWEST - Balham, Wandsworth, Earlsfield
  {name:"The Bedford",area:"Balham",zone:"Southwest",category:"bar",price:"Under £15pp",vibe_tags:["social","chaotic","iconic"],comment:"Victorian pub with comedy club, live music, and dancing."},
  {name:"Foxlow Balham",area:"Balham",zone:"Southwest",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","social","chill"],comment:"Steaks and slow-cooked meats from the Hawksmoor team."},
  {name:"The Alma",area:"Wandsworth",zone:"Southwest",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","foodie"],comment:"Proper gastropub with a beautiful conservatory."},
  {name:"Chez Bruce",area:"Wandsworth",zone:"Southwest",category:"restaurant",price:"£35-70pp",vibe_tags:["foodie","romantic","fancy","iconic"],comment:"Neighbourhood legend — consistently voted Londons favourite restaurant."},
  {name:"The Halfway House",area:"Earlsfield",zone:"Southwest",category:"bar",price:"Under £15pp",vibe_tags:["social","chill"],comment:"Popular local with beer garden and weekend brunch."},
  {name:"Wandsworth Common",area:"Wandsworth",zone:"Southwest",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","active","social"],comment:"Nature reserve, lake, and The Scope pub at the edge."},

  // WEST - Ladbroke Grove, Hammersmith, Fulham, Hanwell
  {name:"The Distillery",area:"Ladbroke Grove",zone:"West",category:"bar",price:"£15-35pp",vibe_tags:["fancy","social","aesthetic"],comment:"Gin distillery with tastings and cocktail bar above."},
  {name:"The River Cafe",area:"Hammersmith",zone:"West",category:"restaurant",price:"£70pp+",vibe_tags:["foodie","romantic","iconic","fancy"],comment:"Ruth Rogers riverside Italian — a London institution."},
  {name:"The Dove Hammersmith",area:"Hammersmith",zone:"West",category:"bar",price:"Under £15pp",vibe_tags:["chill","romantic","iconic","cultural"],comment:"Thames-side pub since 1730 — smallest bar room in Guinness Book."},
  {name:"Manuka Kitchen",area:"Fulham",zone:"West",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","chill","social"],comment:"Brunch-famous spot with New Zealand-inspired menu."},
  {name:"The Sands End",area:"Fulham",zone:"West",category:"bar",price:"£15-35pp",vibe_tags:["chill","social","foodie"],comment:"Neighbourhood gastropub with an open kitchen and garden."},
  {name:"Bishops Park",area:"Fulham",zone:"West",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","romantic"],comment:"Thames-side park next to Craven Cottage with a walled garden."},
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
