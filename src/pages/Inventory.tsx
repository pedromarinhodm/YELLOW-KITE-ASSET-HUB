import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Building2, Tent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { equipmentService, getClassificationFromCategory } from '@/services/equipmentService';
import { 
  Equipment, 
  EquipmentCategory, 
  EquipmentStatus, 
  EquipmentClassification,
  CATEGORY_LABELS, 
  STATUS_LABELS,
  CLASSIFICATION_LABELS,
  STATION_CATEGORIES,
  FIELD_CATEGORIES,
} from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const allCategories: EquipmentCategory[] = [...STATION_CATEGORIES, ...FIELD_CATEGORIES, 'other'];
const statuses: EquipmentStatus[] = ['available', 'allocated', 'maintenance', 'reserved'];
const classifications: EquipmentClassification[] = ['station', 'field'];

export default function Inventory() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClassification, setFilterClassification] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    category: 'notebook' as EquipmentCategory,
    classification: 'station' as EquipmentClassification,
    serialNumber: '',
    purchaseValue: '',
    purchaseDate: '',
  });

  useEffect(() => {
    loadEquipments();
  }, []);

  useEffect(() => {
    filterEquipments();
  }, [equipments, searchTerm, filterCategory, filterStatus, filterClassification]);

  const loadEquipments = async () => {
    const data = await equipmentService.getAll();
    setEquipments(data);
    setLoading(false);
  };

  const filterEquipments = () => {
    let filtered = [...equipments];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        e => e.name.toLowerCase().includes(term) || e.serialNumber.toLowerCase().includes(term)
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(e => e.category === filterCategory);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    if (filterClassification !== 'all') {
      filtered = filtered.filter(e => e.classification === filterClassification);
    }

    setFilteredEquipments(filtered);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'notebook',
      classification: 'station',
      serialNumber: '',
      purchaseValue: '',
      purchaseDate: '',
    });
    setEditingEquipment(null);
  };

  const handleOpenDialog = (equipment?: Equipment) => {
    if (equipment) {
      setEditingEquipment(equipment);
      setFormData({
        name: equipment.name,
        category: equipment.category,
        classification: equipment.classification,
        serialNumber: equipment.serialNumber,
        purchaseValue: equipment.purchaseValue.toString(),
        purchaseDate: equipment.purchaseDate,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCategoryChange = (category: EquipmentCategory) => {
    const classification = getClassificationFromCategory(category);
    setFormData({ ...formData, category, classification });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      category: formData.category,
      classification: formData.classification,
      serialNumber: formData.serialNumber,
      purchaseValue: parseFloat(formData.purchaseValue),
      purchaseDate: formData.purchaseDate,
    };

    if (editingEquipment) {
      await equipmentService.update(editingEquipment.id, data);
      toast.success('Equipamento atualizado com sucesso!');
    } else {
      await equipmentService.create(data);
      toast.success('Equipamento cadastrado com sucesso!');
    }

    await loadEquipments();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await equipmentService.delete(deleteId);
      toast.success('Equipamento removido com sucesso!');
      await loadEquipments();
      setDeleteId(null);
    }
  };

  // Get available categories based on selected classification filter
  const getAvailableCategories = () => {
    if (filterClassification === 'station') return STATION_CATEGORIES;
    if (filterClassification === 'field') return FIELD_CATEGORIES;
    return allCategories;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inventário</h1>
          <p className="text-muted-foreground">Gerencie os equipamentos de setup de mesa e externas</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome/Modelo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: MacBook Pro 14&quot; M3"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: EquipmentCategory) => handleCategoryChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="section-station" disabled className="font-semibold text-xs text-muted-foreground">
                      — Setup de Mesa —
                    </SelectItem>
                    {STATION_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                    <SelectItem value="section-field" disabled className="font-semibold text-xs text-muted-foreground">
                      — Externas —
                    </SelectItem>
                    {FIELD_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm">
                  {formData.classification === 'station' ? (
                    <>
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="font-medium">Equipamento de Setup de Mesa</span>
                      <span className="text-muted-foreground">• Atribuição fixa (Onboarding/Offboarding)</span>
                    </>
                  ) : (
                    <>
                      <Tent className="w-4 h-4 text-amber-500" />
                      <span className="font-medium">Equipamento de Externas</span>
                      <span className="text-muted-foreground">• Uso compartilhado</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Número de Série/Patrimônio</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="Ex: MBP-2024-001"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseValue">Valor de Compra (R$)</Label>
                  <Input
                    id="purchaseValue"
                    type="number"
                    step="0.01"
                    value={formData.purchaseValue}
                    onChange={e => setFormData({ ...formData, purchaseValue: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Data de Aquisição</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingEquipment ? 'Salvar Alterações' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Classification Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          className={cn(
            "card-minimal cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-primary/50",
            filterClassification === 'station' && "ring-2 ring-primary"
          )}
          onClick={() => setFilterClassification(filterClassification === 'station' ? 'all' : 'station')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Equipamentos de Setup de Mesa</p>
              <p className="text-xl font-semibold">{equipments.filter(e => e.classification === 'station').length}</p>
            </div>
          </div>
        </div>
        <div 
          className={cn(
            "card-minimal cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-amber-500/50",
            filterClassification === 'field' && "ring-2 ring-amber-500"
          )}
          onClick={() => setFilterClassification(filterClassification === 'field' ? 'all' : 'field')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <Tent className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Equipamentos de Externas</p>
              <p className="text-xl font-semibold">{equipments.filter(e => e.classification === 'field').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou número de série..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {getAvailableCategories().map(cat => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Equipment List */}
      <div className="grid gap-3">
        {filteredEquipments.length > 0 ? (
          filteredEquipments.map(equipment => (
            <div
              key={equipment.id}
              className="card-minimal flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center",
                  equipment.classification === 'field' ? "bg-amber-500/10" : "bg-muted"
                )}>
                  <CategoryIcon category={equipment.category} className={cn(
                    "w-5 h-5",
                    equipment.classification === 'field' ? "text-amber-600" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">{equipment.name}</h3>
                    {equipment.classification === 'field' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Externas
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORY_LABELS[equipment.category]} • {equipment.serialNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    R$ {equipment.purchaseValue.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(equipment.purchaseDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <StatusBadge status={equipment.status} />

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(equipment)}
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(equipment.id)}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card-minimal text-center py-12">
            <p className="text-muted-foreground">Nenhum equipamento encontrado</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este equipamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
