import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface CoverCost {
  id: string;
  cover_type: string;
  size: string;
  cost: number;
}

const CoverCosts: React.FC = () => {
  const [coverCosts, setCoverCosts] = useState<CoverCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CoverCost | null>(null);
  const [formData, setFormData] = useState({
    cover_type: '',
    size: '',
    cost: 0,
  });

  useEffect(() => {
    fetchCoverCosts();
  }, []);

  const fetchCoverCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('cover_costs')
        .select('*')
        .order('cover_type', { ascending: true });

      if (error) throw error;
      setCoverCosts(data || []);
    } catch (error) {
      toast.error('Failed to load cover costs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('cover_costs')
          .update(formData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Cover cost updated successfully');
      } else {
        const { error } = await supabase
          .from('cover_costs')
          .insert([formData]);
        if (error) throw error;
        toast.success('Cover cost added successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchCoverCosts();
    } catch (error) {
      toast.error('Failed to save cover cost');
    }
  };

  const handleEdit = (item: CoverCost) => {
    setEditingItem(item);
    setFormData({
      cover_type: item.cover_type,
      size: item.size,
      cost: item.cost,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cover cost?')) return;
    try {
      const { error } = await supabase
        .from('cover_costs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Cover cost deleted successfully');
      fetchCoverCosts();
    } catch (error) {
      toast.error('Failed to delete cover cost');
    }
  };

  const resetForm = () => {
    setFormData({ cover_type: '', size: '', cost: 0 });
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
        <CardTitle>Cover Costs</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Cover Cost
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit' : 'Add'} Cover Cost</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cover_type">Cover Type</Label>
                <Input
                  id="cover_type"
                  value={formData.cover_type}
                  onChange={(e) => setFormData({ ...formData, cover_type: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
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
              <TableHead>Cover Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coverCosts.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.cover_type}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell>NGN {item.cost.toFixed(2)}</TableCell>
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

export default CoverCosts;
