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

interface ProfitMargin {
  id: string;
  copies_min: number;
  copies_max: number;
  margin_percentage_1: number;
  margin_percentage_2: number;
}

const ProfitMargins: React.FC = () => {
  const [margins, setMargins] = useState<ProfitMargin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProfitMargin | null>(null);
  const [formData, setFormData] = useState({
    copies_min: 0,
    copies_max: 0,
    margin_percentage_1: 0,
    margin_percentage_2: 0,
  });

  useEffect(() => {
    fetchMargins();
  }, []);

  const fetchMargins = async () => {
    try {
      const { data, error } = await supabase
        .from('profit_margins')
        .select('*')
        .order('copies_min', { ascending: true });

      if (error) throw error;
      setMargins(data || []);
    } catch (error) {
      toast.error('Failed to load profit margins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('profit_margins')
          .update(formData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Profit margin updated successfully');
      } else {
        const { error } = await supabase
          .from('profit_margins')
          .insert([formData]);
        if (error) throw error;
        toast.success('Profit margin added successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchMargins();
    } catch (error) {
      toast.error('Failed to save profit margin');
    }
  };

  const handleEdit = (item: ProfitMargin) => {
    setEditingItem(item);
    setFormData({
      copies_min: item.copies_min,
      copies_max: item.copies_max,
      margin_percentage_1: item.margin_percentage_1,
      margin_percentage_2: item.margin_percentage_2,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profit margin?')) return;
    try {
      const { error } = await supabase
        .from('profit_margins')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Profit margin deleted successfully');
      fetchMargins();
    } catch (error) {
      toast.error('Failed to delete profit margin');
    }
  };

  const resetForm = () => {
    setFormData({ copies_min: 0, copies_max: 0, margin_percentage_1: 0, margin_percentage_2: 0 });
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
        <CardTitle>Profit Margins</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Profit Margin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit' : 'Add'} Profit Margin</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="copies_min">Copies Min</Label>
                <Input
                  id="copies_min"
                  type="number"
                  value={formData.copies_min}
                  onChange={(e) => setFormData({ ...formData, copies_min: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="copies_max">Copies Max</Label>
                <Input
                  id="copies_max"
                  type="number"
                  value={formData.copies_max}
                  onChange={(e) => setFormData({ ...formData, copies_max: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="margin_percentage_1">Margin Percentage 1 (%)</Label>
                <Input
                  id="margin_percentage_1"
                  type="number"
                  step="0.01"
                  value={formData.margin_percentage_1}
                  onChange={(e) => setFormData({ ...formData, margin_percentage_1: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="margin_percentage_2">Margin Percentage 2 (%)</Label>
                <Input
                  id="margin_percentage_2"
                  type="number"
                  step="0.01"
                  value={formData.margin_percentage_2}
                  onChange={(e) => setFormData({ ...formData, margin_percentage_2: parseFloat(e.target.value) })}
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
              <TableHead>Copy Range</TableHead>
              <TableHead>Margin % 1</TableHead>
              <TableHead>Margin % 2</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {margins.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.copies_min} - {item.copies_max}</TableCell>
                <TableCell>{item.margin_percentage_1}%</TableCell>
                <TableCell>{item.margin_percentage_2}%</TableCell>
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

export default ProfitMargins;
