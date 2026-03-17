"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useCreateVisit } from '@/hooks/useCrmData';
import { toast } from 'sonner';

const AddVisitDialog = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    leadName: '',
    leadPhone: '',
    leadId: '',
    propertyName: '',
    propertyAddress: '',
    agentName: '',
    scheduledAt: '',
    notes: '',
  });

  const createVisit = useCreateVisit();

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leadName || !form.propertyName || !form.agentName || !form.scheduledAt) {
      toast.error('Lead name, property, agent and date are required');
      return;
    }

    try {
      await createVisit.mutateAsync({
        leadId:          form.leadId || '000000000000000000000000',
        leadName:        form.leadName,
        leadPhone:       form.leadPhone,
        propertyName:    form.propertyName,
        propertyAddress: form.propertyAddress,
        agentName:       form.agentName,
        scheduledAt:     new Date(form.scheduledAt).toISOString(),
        notes:           form.notes,
      });
      setOpen(false);
      setForm({ leadName: '', leadPhone: '', leadId: '', propertyName: '', propertyAddress: '', agentName: '', scheduledAt: '', notes: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule visit');
    }
  };

  const inputCls = "h-9 text-sm rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500";
  const labelCls = "text-xs font-medium text-slate-500";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus size={13} /> Schedule Visit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Schedule Visit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* Lead */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelCls}>Lead Name *</Label>
              <Input className={inputCls} placeholder="Rahul Sharma" value={form.leadName} onChange={e => set('leadName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>Lead Phone</Label>
              <Input className={inputCls} placeholder="9876543210" value={form.leadPhone} onChange={e => set('leadPhone', e.target.value)} />
            </div>
          </div>

          {/* Property */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelCls}>Property Name *</Label>
              <Input className={inputCls} placeholder="Green Valley PG" value={form.propertyName} onChange={e => set('propertyName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>Property Address</Label>
              <Input className={inputCls} placeholder="Arera Colony, Bhopal" value={form.propertyAddress} onChange={e => set('propertyAddress', e.target.value)} />
            </div>
          </div>

          {/* Agent + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className={labelCls}>Agent / Staff *</Label>
              <Input className={inputCls} placeholder="Agent name" value={form.agentName} onChange={e => set('agentName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelCls}>Date & Time *</Label>
              <Input className={inputCls} type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className={labelCls}>Notes</Label>
            <Input className={inputCls} placeholder="Any special instructions..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={createVisit.isPending}>
              {createVisit.isPending ? 'Scheduling...' : 'Schedule Visit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVisitDialog;
