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

interface TonerCost {
  id: string;
  type: string;
  size: string;
  cost_per_page: number;
}

const TonerCosts: React.FC = () => {
  const [tonerCosts, setTonerCosts] = useState<TonerCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TonerCost | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    size: '',
    cost_per_page: 0,
  });

  useEffect(() => {
    fetchTonerCosts();
  }, []);


  const fetchTonerCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('toner_costs')
        .select('*')
        .order('type', { ascending: true });

        console.log("Data:", data);
        console.log("Error:", error);


      if (error) throw error;
      setTonerCosts(data || []);
    } catch (error) {
      toast.error('Failed to load toner costs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('toner_costs')
          .update(formData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Toner cost updated successfully');
      } else {
        const { error } = await supabase
          .from('toner_costs')
          .insert([formData]);
        if (error) throw error;
        toast.success('Toner cost added successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchTonerCosts();
    } catch (error) {
      toast.error('Failed to save toner cost');
    }
  };

  const handleEdit = (item: TonerCost) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      size: item.size,
      cost_per_page: item.cost_per_page,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this toner cost?')) return;
    try {
      const { error } = await supabase
        .from('toner_costs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Toner cost deleted successfully');
      fetchTonerCosts();
    } catch (error) {
      toast.error('Failed to delete toner cost');
    }
  };

  const resetForm = () => {
    setFormData({ type: '', size: '', cost_per_page: 0 });
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
        <CardTitle>Toner Costs</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Toner Cost
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit' : 'Add'} Toner Cost</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Type (Color/B&W)</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                <Label htmlFor="cost_per_page">Cost Per Page (NGN)</Label>
                <Input
                  id="cost_per_page"
                  type="number"
                  step="0.01"
                  value={formData.cost_per_page}
                  onChange={(e) => setFormData({ ...formData, cost_per_page: parseFloat(e.target.value) })}
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
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Cost Per Page</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tonerCosts.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell>NGN {item.cost_per_page.toFixed(2)}</TableCell>
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

export default TonerCosts;
