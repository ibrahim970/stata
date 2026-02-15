import { supabase } from './supabase';

export async function uploadProfilePicture(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-pictures')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function uploadPostImage(file: File, postId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `post_${postId}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('post-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function uploadEventImage(file: File, eventId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `event_${eventId}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('event-images')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('event-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteProfilePicture(userId: string): Promise<void> {
  const { data: files } = await supabase.storage
    .from('profile-pictures')
    .list(userId);

  if (files && files.length > 0) {
    const filePaths = files.map(file => `${userId}/${file.name}`);
    await supabase.storage
      .from('profile-pictures')
      .remove(filePaths);
  }
}
