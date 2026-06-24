import { supabase } from './supabase';

export interface Ad {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: 'video' | 'image';
  thumb_url: string | null;
  cta_text: string;
  cta_url: string | null;
  duration: number;
  skip_after: number;
  coins: number;
  weight: number;
}

export async function fetchRandomAd(): Promise<Ad | null> {
  const { data, error } = await supabase
    .from('ads')
    .select('id,title,description,media_url,media_type,thumb_url,cta_text,cta_url,duration,skip_after,coins,weight')
    .eq('active', true)
    .limit(50);

  if (error || !data?.length) return null;

  // Weighted random: repeat each ad by its weight then pick
  const pool: Ad[] = [];
  for (const ad of data as Ad[]) {
    for (let i = 0; i < (ad.weight ?? 1); i++) pool.push(ad);
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
