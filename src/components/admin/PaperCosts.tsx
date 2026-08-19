import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaperCost {
  id: string;
  paper_type: string;
  size: string;
  cost_per_page: number;
}

const PaperCosts: React.FC = () => {
  const [costs, setCosts] = useState<PaperCost[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ paper_type: '', size: '', cost_per_page: 0 });
  const [newCost, setNewCost] = useState({ paper_type: '', size: '', cost_per_page: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('paper_costs')
        .select('*')
        .order('paper_type', { ascending: true });

        console.log("DATA:", data);
        console.log("ERROR:", error);

      if (error) throw error;
      setCosts(data || []);
    } catch (error: any) {
      console.error('Error fetching paper costs:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : JSON.stringify(error)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  const handleEdit = (cost: PaperCost) => {
    setEditingId(cost.id);
    setEditForm({
      paper_type: cost.paper_type,
      size: cost.size,
      cost_per_page: cost.cost_per_page,
    });
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('paper_costs')
        .update(editForm)
        .eq('id', editingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Paper cost updated successfully',
      });
      
      setEditingId(null);
      fetchCosts();
    } catch (error) {
      console.error('Error updating paper cost:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update paper cost',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this paper cost?')) {
      try {
        const { error } = await supabase
          .from('paper_costs')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Paper cost deleted successfully',
        });
        
        fetchCosts();
      } catch (error) {
        console.error('Error deleting paper cost:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete paper cost',
        });
      }
    }
  };

  const handleAddNew = async () => {
    try {
      const { error } = await supabase
        .from('paper_costs')
        .insert([newCost]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Paper cost added successfully',
      });
      
      setShowAddForm(false);
      setNewCost({ paper_type: '', size: '', cost_per_page: 0 });
      fetchCosts();
    } catch (error) {
      console.error('Error adding paper cost:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add paper cost',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading paper costs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Paper Costs</h1>
          <p className="text-gray-600">Manage paper costs per page for different types and sizes</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Paper Cost
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Paper Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Paper Type (e.g., Cream 80gsm)"
                value={newCost.paper_type}
                onChange={(e) => setNewCost({...newCost, paper_type: e.target.value})}
              />
              <Input
                placeholder="Size (e.g., A5)"
                value={newCost.size}
                onChange={(e) => setNewCost({...newCost, size: e.target.value})}
              />
              <Input
                type="number"
                step="0.00001"
                placeholder="Cost per page"
                value={newCost.cost_per_page}
                onChange={(e) => setNewCost({...newCost, cost_per_page: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paper Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Cost per Page (NGN)</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs.map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell>
                    {editingId === cost.id ? (
                      <Input
                        value={editForm.paper_type}
                        onChange={(e) => setEditForm({...editForm, paper_type: e.target.value})}
                      />
                    ) : (
                      cost.paper_type
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === cost.id ? (
                      <Input
                        value={editForm.size}
                        onChange={(e) => setEditForm({...editForm, size: e.target.value})}
                      />
                    ) : (
                      cost.size
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === cost.id ? (
                      <Input
                        type="number"
                        step="0.00001"
                        value={editForm.cost_per_page}
                        onChange={(e) => setEditForm({...editForm, cost_per_page: parseFloat(e.target.value) || 0})}
                      />
                    ) : (
                      `₦${cost.cost_per_page.toLocaleString()}`
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {editingId === cost.id ? (
                        <>
                          <Button size="sm" onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(cost)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(cost.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaperCosts;