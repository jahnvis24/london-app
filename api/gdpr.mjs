import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth check
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { action, user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  if (action === 'export') {
    const [experiences, connections, shares, sharedLists, sharedListItems, ratings, profile, plans] = await Promise.all([
      supabase.from('experiences').select('*').eq('user_id', user_id),
      supabase.from('connections').select('*').or(`user_a.eq.${user_id},user_b.eq.${user_id}`),
      supabase.from('shares').select('*').or(`from_user.eq.${user_id},to_user.eq.${user_id}`),
      supabase.from('shared_lists').select('*').eq('owner', user_id),
      supabase.from('shared_list_items').select('*').eq('added_by', user_id),
      supabase.from('venue_ratings').select('*').eq('user_id', user_id),
      supabase.from('profiles').select('*').eq('id', user_id),
      supabase.from('shared_plans').select('*'),
    ]);

    const exported = {
      exported_at: new Date().toISOString(),
      user_id,
      profile: profile.data?.[0] || null,
      saves: experiences.data || [],
      connections: connections.data || [],
      shares: shares.data || [],
      bucket_lists: sharedLists.data || [],
      bucket_list_items: sharedListItems.data || [],
      venue_ratings: ratings.data || [],
      plans: (plans.data || []).filter(p => {
        const payload = p.plan;
        return payload && JSON.stringify(payload).includes(user_id);
      }),
    };

    return res.status(200).json({ found: true, data: exported });
  }

  if (action === 'delete') {
    await supabase.from('analytics_events').delete().eq('user_id', user_id);
    await supabase.from('venue_ratings').delete().eq('user_id', user_id);
    await supabase.from('shared_list_items').delete().eq('added_by', user_id);
    await supabase.from('shared_list_members').delete().eq('user_id', user_id);
    await supabase.from('shared_lists').delete().eq('owner', user_id);
    await supabase.from('shares').delete().or(`from_user.eq.${user_id},to_user.eq.${user_id}`);
    await supabase.from('connections').delete().or(`user_a.eq.${user_id},user_b.eq.${user_id}`);
    await supabase.from('experiences').delete().eq('user_id', user_id);
    await supabase.from('profiles').delete().eq('id', user_id);
    await supabase.auth.admin.deleteUser(user_id);

    return res.status(200).json({ deleted: true });
  }

  return res.status(400).json({ error: 'action must be "export" or "delete"' });
}
