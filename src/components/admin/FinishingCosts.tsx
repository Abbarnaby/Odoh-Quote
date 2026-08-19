import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface FinishingCost {
  id: string;
  page_range_min: number;
  page_range_max: number;
  cost: number;
  description?: string;
}

const FinishingCosts: React.FC = () => {
  const [finishingCosts, setFinishingCosts] = useState<FinishingCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinishingCost | null>(null);
  const [formData, setFormData] = useState({
    page_range_min: 0,
    page_range_max: 0,
    cost: 0,
    description: '',
  });

  useEffect(() => {
    fetchFinishingCosts();
  }, []);

  const fetchFinishingCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('finishing_costs')
        .select('*')
        .order('page_range_min', { ascending: true });

      if (error) throw error;
      setFinishingCosts(data || []);
    } catch (error) {
      toast.error('Failed to load finishing costs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('finishing_costs')
          .update(formData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Finishing cost updated successfully');
      } else {
        const { error } = await supabase
          .from('finishing_costs')
          .insert([formData]);
        if (error) throw error;
        toast.success('Finishing cost added successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchFinishingCosts();
    } catch (error) {
      toast.error('Failed to save finishing cost');
    }
  };

  const handleEdit = (item: FinishingCost) => {
    setEditingItem(item);
    setFormData({
      page_range_min: item.page_range_min,
      page_range_max: item.page_range_max,
      cost: item.cost,
      description: item.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this finishing cost?')) return;
    try {
      const { error } = await supabase
        .from('finishing_costs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Finishing cost deleted successfully');
      fetchFinishingCosts();
    } catch (error) {
      toast.error('Failed to delete finishing cost');
    }
  };

  const resetForm = () => {
    setFormData({ page_range_min: 0, page_range_max: 0, cost: 0, description: '' });
    setEditingItem(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Finishing Costs</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Finishing Cost
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit' : 'Add'} Finishing Cost</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="page_range_min">Page Range Min</Label>
                <Input
                  id="page_range_min"
                  type="number"
                  value={formData.page_range_min}
                  onChange={(e) => setFormData({ ...formData, page_range_min: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="page_range_max">Page Range Max</Label>
                <Input
                  id="page_range_max"
                  type="number"
                  value={formData.page_range_max}
                  onChange={(e) => setFormData({ ...formData, page_range_max: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost (NGN)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page Range</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finishingCosts.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.page_range_min} - {item.page_range_max}</TableCell>
                <TableCell>NGN {item.cost.toFixed(2)}</TableCell>
                <TableCell>{item.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default FinishingCosts;
