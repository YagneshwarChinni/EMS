import { supabase } from './client';

export interface DatabaseStatus {
  isSetup: boolean;
  missingTables: string[];
  error?: string;
}

const REQUIRED_TABLES = [
  'users',
  'events', 
  'bookings',
  'cart_items',
  'user_sessions',
  'admin_analytics',
  'reviews',
  'notifications',
  'event_categories'
];

export async function checkDatabaseSetup(): Promise<DatabaseStatus> {
  try {
    const missingTables: string[] = [];
    
    // Check each required table
    for (const table of REQUIRED_TABLES) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error && (error.code === 'PGRST116' || error.code === 'PGRST205')) {
          missingTables.push(table);
        }
      } catch (err) {
        missingTables.push(table);
      }
    }
    
    return {
      isSetup: missingTables.length === 0,
      missingTables,
    };
  } catch (error) {
    return {
      isSetup: false,
      missingTables: REQUIRED_TABLES,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Try a simple query that should work even without our custom tables
    const { error } = await supabase.auth.getSession();
    return !error;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}