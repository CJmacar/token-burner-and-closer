import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useSupabaseSecret = (secretName: string) => {
  return useQuery({
    queryKey: ['secret', secretName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secrets')
        .select('value')
        .eq('name', secretName)
        .single();
      
      if (error) {
        console.error('Error fetching secret:', error);
        return null;
      }
      
      return data?.value;
    },
  });
};