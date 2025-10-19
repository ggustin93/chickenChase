/**
 * Simple database connectivity test
 */

import { describe, it, expect } from 'vitest';
import { supabase } from '../../src/lib/supabase';

describe('Database Connectivity', () => {
  it('should connect to Supabase', async () => {
    const { data, error } = await supabase
      .from('games')
      .select('count')
      .limit(1);
    
    console.log('Database query result:', { data, error });
    expect(error).toBeNull();
  });

  it('should be able to insert a game', async () => {
    const { data, error } = await supabase
      .from('games')
      .insert([{
        join_code: 'TEST123',
        cagnotte_initial: 1000,
        cagnotte_current: 1000
      }])
      .select();
    
    console.log('Insert result:', { data, error });
    
    if (data && data.length > 0) {
      // Cleanup
      await supabase.from('games').delete().eq('id', data[0].id);
    }
  });
});