import { createClient } from "@supabase/supabase-js";

const s = createClient(
  'https://hhkmbyrwyardhozufusu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoa21ieXJ3eWFyZGhvenVmdXN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE4OTU4MywiZXhwIjoyMDk0NzY1NTgzfQ.3Yp-vYfPuonbYzAISpsRxOKlC3fUKmH-X2DxNY7S4BE'
);

const venues = [
  // TUFNELL PARK (North)
  {name:"The Dome",area:"Tufnell Park",zone:"North",category:"bar",price:"Under £15pp",vibe_tags:["chill","social"],comment:"Classic Tufnell Park local with live music nights."},
  {name:"The Boston Arms",area:"Tufnell Park",zone:"North",category:"bar",price:"Under £15pp",vibe_tags:["social","underground","chaotic"],comment:"Live gig venue upstairs, proper pub downstairs."},
  {name:"Zia Lucia Tufnell Park",area:"Tufnell Park",zone:"North",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","social","chill"],comment:"Multi-dough pizza with charcoal and turmeric bases."},
  {name:"Le Coq",area:"Tufnell Park",zone:"North",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","romantic","hidden_gems"],comment:"Rotisserie chicken and French classics in a tiny bistro."},
  {name:"Tufnell Park Tavern",area:"Tufnell Park",zone:"North",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","outdoor"],comment:"Neighbourhood pub with a big beer garden."},
  {name:"Tufnell Park Playing Fields",area:"Tufnell Park",zone:"North",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","active"],comment:"Local park with tennis courts and quiet green space."},

  // GOLDERS GREEN (Northwest)
  {name:"Carmelli Bakeries",area:"Golders Green",zone:"Northwest",category:"cafe",price:"Under £15pp",vibe_tags:["foodie","cultural","iconic"],comment:"Legendary kosher bakery with challah and rugelach since 1964."},
  {name:"Cote Brasserie Golders Green",area:"Golders Green",zone:"Northwest",category:"restaurant",price:"£15-35pp",vibe_tags:["chill","romantic","social"],comment:"Reliable French brasserie with prix fixe."},
  {name:"Goldfish Dimsum",area:"Golders Green",zone:"Northwest",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","social","hidden_gems"],comment:"Cantonese dim sum with a loyal local following."},
  {name:"Golders Hill Park",area:"Golders Green",zone:"Northwest",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","romantic","hidden_gems"],comment:"Deer park, gardens, and free zoo on quiet side of Heath."},
  {name:"The White Swan Golders Green",area:"Golders Green",zone:"Northwest",category:"bar",price:"Under £15pp",vibe_tags:["chill","social"],comment:"Traditional pub with garden and Sunday roasts."},

  // CANONBURY (North)
  {name:"The Canonbury Tavern",area:"Canonbury",zone:"North",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","outdoor"],comment:"Beautiful old pub with a big garden and Thai food."},
  {name:"Sushi Show",area:"Canonbury",zone:"North",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","hidden_gems"],comment:"Tiny omakase counter with excellent value set menus."},
  {name:"The Alwyne Castle",area:"Canonbury",zone:"North",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","hidden_gems"],comment:"Tucked-away gastropub with a heated courtyard."},
  {name:"Oldroyd",area:"Canonbury",zone:"North",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","romantic","aesthetic"],comment:"Tom Oldroyd bistro with seasonal British-Mediterranean small plates."},
  {name:"New River Walk",area:"Canonbury",zone:"North",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","solo","romantic"],comment:"Hidden linear garden following the old New River path."},

  // SYDENHAM (Southeast)
  {name:"The Golden Lion Sydenham",area:"Sydenham",zone:"Southeast",category:"bar",price:"Under £15pp",vibe_tags:["chill","social"],comment:"Corner pub with live jazz nights and friendly crowd."},
  {name:"Dulwich Wood House",area:"Sydenham",zone:"Southeast",category:"bar",price:"Under £15pp",vibe_tags:["chill","outdoor","social"],comment:"Large pub with gardens bordering Sydenham Hill Woods."},
  {name:"Gurkha Kitchen Sydenham",area:"Sydenham",zone:"Southeast",category:"restaurant",price:"Under £15pp",vibe_tags:["foodie","social","hidden_gems"],comment:"Nepalese restaurant with momos and thali sets."},
  {name:"The Brasserie Sydenham",area:"Sydenham",zone:"Southeast",category:"restaurant",price:"£15-35pp",vibe_tags:["chill","social","foodie"],comment:"Neighbourhood brasserie with brunch and evening menus."},
  {name:"Sydenham Hill Wood",area:"Sydenham",zone:"Southeast",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","hidden_gems","solo"],comment:"Ancient woodland with ruins of a Victorian folly hidden inside."},

  // PARSONS GREEN (West)
  {name:"The White Horse",area:"Parsons Green",zone:"West",category:"bar",price:"£15-35pp",vibe_tags:["chill","social","iconic"],comment:"The Sloaney Pony — huge terrace overlooking the green."},
  {name:"Koji",area:"Parsons Green",zone:"West",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","romantic","aesthetic"],comment:"Intimate Japanese with creative sushi and sake pairings."},
  {name:"Tendido Cero",area:"Parsons Green",zone:"West",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","social","romantic"],comment:"Authentic Spanish tapas with excellent sherry selection."},
  {name:"Parsons Green",area:"Parsons Green",zone:"West",category:"outdoor",price:"Free",vibe_tags:["outdoor","chill","social"],comment:"Village green with cricket in summer and pubs all around."},
  {name:"The Brown Cow",area:"Parsons Green",zone:"West",category:"bar",price:"Under £15pp",vibe_tags:["chill","social","foodie"],comment:"Gastropub with a walled garden and wine list."},

  // WHITE CITY (West)
  {name:"Kiln White City",area:"White City",zone:"West",category:"restaurant",price:"£15-35pp",vibe_tags:["foodie","social","chaotic"],comment:"Thai clay-pot cooking — open fire theatre from the Soho original."},
  {name:"Pergola on the Roof",area:"White City",zone:"West",category:"bar",price:"£15-35pp",vibe_tags:["social","aesthetic","outdoor"],comment:"Rooftop garden bar with fairy lights and street food."},
  {name:"White City House Rooftop",area:"White City",zone:"West",category:"bar",price:"£15-35pp",vibe_tags:["aesthetic","social","fancy"],comment:"Rooftop pool bar with city views open to public."},
  {name:"Television Centre Courtyard",area:"White City",zone:"West",category:"outdoor",price:"Free",vibe_tags:["outdoor","aesthetic","chill"],comment:"Iconic BBC building converted with fountains and dining."},
  {name:"Bluebird White City",area:"White City",zone:"West",category:"restaurant",price:"£35-70pp",vibe_tags:["fancy","romantic","aesthetic"],comment:"Modern British in the Television Centre development."},
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
