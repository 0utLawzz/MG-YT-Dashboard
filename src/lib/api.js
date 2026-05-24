import { supabase } from './supabase';

export async function fetchStories() {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) throw new Error(`Failed to fetch stories: ${error.message}`);
  return data;
}

export async function createStory(story) {
  const { data, error } = await supabase
    .from('stories')
    .insert([story])
    .select()
    .single();

  if (error) throw new Error(`Failed to create story: ${error.message}`);
  return data;
}

export async function updateStory(id, updates) {
  const { data, error } = await supabase
    .from('stories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update story: ${error.message}`);
  return data;
}

export async function deleteStory(id) {
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete story: ${error.message}`);
  return true;
}

