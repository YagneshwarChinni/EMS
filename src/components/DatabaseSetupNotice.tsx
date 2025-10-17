import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Database, ExternalLink, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { checkDatabaseSetup, testDatabaseConnection, type DatabaseStatus } from '../utils/supabase/databaseChecker';
import { toast } from 'sonner';

interface DatabaseSetupNoticeProps {
  onDismiss?: () => void;
  className?: string;
}

export function DatabaseSetupNotice({ onDismiss, className }: DatabaseSetupNoticeProps) {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      setIsChecking(true);
      try {
        const dbStatus = await checkDatabaseSetup();
        setStatus(dbStatus);
      } catch (error) {
        console.error('Error checking database status:', error);
        setStatus({
          isSetup: false,
          missingTables: [],
          error: 'Failed to check database status'
        });
      } finally {
        setIsChecking(false);
      }
    };

    checkStatus();
  }, []);

  const handleRecheck = async () => {
    setIsChecking(true);
    const dbStatus = await checkDatabaseSetup();
    setStatus(dbStatus);
    setIsChecking(false);
    
    if (dbStatus.isSetup) {
      toast.success('Database setup complete! 🎉');
    }
  };

  const copySchemaUrl = () => {
    const url = window.location.origin + '/database-schema.sql';
    navigator.clipboard.writeText(url);
    toast.success('Schema URL copied to clipboard');
  };

  const openSupabaseProject = () => {
    window.open('https://supabase.com/dashboard/project/nkgejttsnlhqdffitxrz/sql/new', '_blank');
  };

  if (isDismissed || (status?.isSetup && !isChecking)) {
    return null;
  }

  if (isChecking) {
    return (
      <Alert className={`mb-6 border-blue-200 bg-blue-50 ${className}`}>
        <Database className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Checking database setup...
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (!status || status.error) {
    return (
      <Alert className={`mb-6 border-red-200 bg-red-50 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Unable to check database status. Please ensure your Supabase connection is working.
          {status?.error && <div className="mt-1 text-sm opacity-75">{status.error}</div>}
        </AlertDescription>
      </Alert>
    );
  }

  if (!status.isSetup) {
    return (
      <Card className={`mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <Database className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-orange-900">Database Setup Required</CardTitle>
              <CardDescription className="text-orange-700">
                Your Supabase database needs to be configured for the event management system.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {status.missingTables.length} tables missing
            </Badge>
            <Badge variant="outline" className="border-orange-300 text-orange-700">
              Using mock data
            </Badge>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Quick Setup Instructions:</strong>
              <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm">
                <li>Open your Supabase SQL Editor</li>
                <li>Copy and paste the database schema</li>
                <li>Run the script to create all tables</li>
                <li>Refresh this page</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={openSupabaseProject}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Supabase SQL Editor
            </Button>
            
            <Button 
              variant="outline" 
              onClick={copySchemaUrl}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Schema URL
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleRecheck}
              disabled={isChecking}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {isChecking ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Check Again
            </Button>
          </div>

          <div className="pt-2 border-t border-orange-200">
            <p className="text-sm text-orange-700">
              <strong>Note:</strong> The application will work with sample data until the database is set up. 
              See <code className="bg-orange-100 px-1 py-0.5 rounded text-xs">SUPABASE_SETUP.md</code> for detailed instructions.
            </p>
          </div>

          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setIsDismissed(true);
                onDismiss?.();
              }}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
            >
              Dismiss for now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}