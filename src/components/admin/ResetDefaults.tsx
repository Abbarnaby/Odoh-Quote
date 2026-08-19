import React, { useState } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ResetDefaults: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetToDefaults = async () => {
    setLoading(true);
    
    try {
      // Clear all existing data
      await Promise.all([
        supabase.from('paper_costs').delete().neq('id', ''),
        supabase.from('toner_costs').delete().neq('id', ''),
        supabase.from('cover_costs').delete().neq('id', ''),
        supabase.from('finishing_costs').delete().neq('id', ''),
        supabase.from('packaging_costs').delete().neq('id', ''),
        supabase.from('bhr_config').delete().neq('id', ''),
        supabase.from('additional_services').delete().neq('id', ''),
      ]);

      // Re-insert default data (same as in migration)
      const defaultData = {
        paperCosts: [
          { paper_type: 'Cream 100gsm', size: 'A6', cost_per_page: 1.84375 },
          { paper_type: 'Cream 100gsm', size: 'A5', cost_per_page: 3.6875 },
          { paper_type: 'Cream 100gsm', size: '6x9', cost_per_page: 7.375 },
          { paper_type: 'Cream 100gsm', size: '7x10', cost_per_page: 7.375 },
          { paper_type: 'Cream 100gsm', size: 'A4', cost_per_page: 7.375 },
          { paper_type: 'Cream 100gsm', size: 'A3', cost_per_page: 14.75 },
          { paper_type: 'Cream 80gsm', size: 'A6', cost_per_page: 1.75 },
          { paper_type: 'Cream 80gsm', size: 'A5', cost_per_page: 3.5 },
          { paper_type: 'Cream 80gsm', size: '6x9', cost_per_page: 7 },
          { paper_type: 'Cream 80gsm', size: '7x10', cost_per_page: 7 },
          { paper_type: 'Cream 80gsm', size: 'A4', cost_per_page: 7 },
          { paper_type: 'Cream 80gsm', size: 'A3', cost_per_page: 14 },
          { paper_type: 'White 80gsm', size: 'A6', cost_per_page: 1.40625 },
          { paper_type: 'White 80gsm', size: 'A5', cost_per_page: 2.8125 },
          { paper_type: 'White 80gsm', size: '6x9', cost_per_page: 5.625 },
          { paper_type: 'White 80gsm', size: 'A4', cost_per_page: 5.625 },
          { paper_type: 'Gloss 135gsm', size: 'A5', cost_per_page: 8.125 },
          { paper_type: 'Gloss 135gsm', size: 'A4', cost_per_page: 16.25 }
        ],
        tonerCosts: [
          { type: 'B/W', size: 'A6', cost_per_page: 0.5 },
          { type: 'B/W', size: 'A5', cost_per_page: 1 },
          { type: 'B/W', size: '6x9', cost_per_page: 2 },
          { type: 'B/W', size: 'A4', cost_per_page: 2 },
          { type: 'Colour', size: 'A6', cost_per_page: 2.5 },
          { type: 'Colour', size: 'A5', cost_per_page: 5 },
          { type: 'Colour', size: '6x9', cost_per_page: 10 },
          { type: 'Colour', size: 'A4', cost_per_page: 10 }
        ],
        coverCosts: [
          { cover_type: 'Soft', size: 'A6', cost: 100 },
          { cover_type: 'Soft', size: 'A5', cost: 165 },
          { cover_type: 'Soft', size: '6x9', cost: 310 },
          { cover_type: 'Soft', size: 'A4', cost: 350 },
          { cover_type: 'Hard Cover (Casebound)', size: 'A6', cost: 250 },
          { cover_type: 'Hard Cover (Casebound)', size: 'A5', cost: 500 },
          { cover_type: 'Hard Cover (Casebound)', size: '6x9', cost: 800 },
          { cover_type: 'Hard Cover (Casebound)', size: 'A4', cost: 1000 }
        ],
        finishingCosts: [
          { page_range_min: 50, page_range_max: 140, cost: 70 },
          { page_range_min: 150, page_range_max: 320, cost: 120 },
          { page_range_min: 350, page_range_max: null, cost: 300 }
        ],
        packagingCosts: [
          { size: 'A6', cost: 7 },
          { size: 'A5', cost: 14 },
          { size: '6x9', cost: 15 },
          { size: 'A4', cost: 25 }
        ],
        additionalServices: [
          { service_name: 'Design', cost: 10000 },
          { service_name: 'ISBN', cost: 8000 }
        ],
      };

      await Promise.all([
        supabase.from('paper_costs').insert(defaultData.paperCosts),
        supabase.from('toner_costs').insert(defaultData.tonerCosts),
        supabase.from('cover_costs').insert(defaultData.coverCosts),
        supabase.from('finishing_costs').insert(defaultData.finishingCosts),
        supabase.from('packaging_costs').insert(defaultData.packagingCosts),
        supabase.from('bhr_config').insert([{ rate_per_hour: 3000 }]),
        supabase.from('additional_services').insert(defaultData.additionalServices),
      ]);

      toast({
        title: 'Reset Complete',
        description: 'All cost settings have been reset to default values.',
      });
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: 'Failed to reset to default values.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reset to Defaults</h1>
        <p className="text-gray-600">Restore all cost configurations to their original default values</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            Warning: Destructive Action
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 mb-2">This action will:</h3>
            <ul className="list-disc list-inside text-orange-700 space-y-1">
              <li>Delete all current paper costs and restore defaults</li>
              <li>Delete all current toner costs and restore defaults</li>
              <li>Delete all current cover costs and restore defaults</li>
              <li>Delete all current finishing costs and restore defaults</li>
              <li>Delete all current packaging costs and restore defaults</li>
              <li>Reset BHR rate to NGN 3,000 per hour</li>
              <li>Reset additional services to Design (NGN 10,000) and ISBN (NGN 8,000)</li>
              
            </ul>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold">
              ⚠️ This action cannot be undone. All custom configurations will be permanently lost.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full"
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {loading ? 'Resetting...' : 'Reset All Settings to Default'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete all current cost configurations and restore the original default values. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={resetToDefaults}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, reset to defaults
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetDefaults;