import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const BHRSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [ratePerHour, setRatePerHour] = useState(0);
  const [configId, setConfigId] = useState<string | null>(null);

  useEffect(() => {
    fetchBHRConfig();
  }, []);

  const fetchBHRConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('bhr_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setRatePerHour(data.rate_per_hour);
        setConfigId(data.id);
      }
    } catch (error) {
      toast.error('Failed to load BHR settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (configId) {
        const { error } = await supabase
          .from('bhr_config')
          .update({ rate_per_hour: ratePerHour })
          .eq('id', configId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('bhr_config')
          .insert([{ rate_per_hour: ratePerHour }])
          .select()
          .single();
        if (error) throw error;
        setConfigId(data.id);
      }
      toast.success('BHR settings updated successfully');
    } catch (error) {
      toast.error('Failed to save BHR settings');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>BHR (Billable Hourly Rate) Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="rate_per_hour">Rate Per Hour (NGN)</Label>
            <Input
              id="rate_per_hour"
              type="number"
              step="0.01"
              value={ratePerHour}
              onChange={(e) => setRatePerHour(parseFloat(e.target.value))}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              This rate will be used to calculate the billable hours cost for printing jobs.
            </p>
          </div>
          <Button type="submit">Save Settings</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BHRSettings;
