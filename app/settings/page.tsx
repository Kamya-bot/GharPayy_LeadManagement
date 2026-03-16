"use client";

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAgents, useProperties, useCreateAgent, useUpdateAgent, useDeleteAgent, useCreateProperty, useDeleteProperty } from '@/hooks/useCrmData';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Trash2, UserCog, Building2, User, Save } from 'lucide-react';

const SettingsPage = () => {
  const user = { id: 'admin', email: 'admin@gharpayy.com', user_metadata: { full_name: 'Admin' } };
  const { data: agents } = useAgents();
  const { data: properties } = useProperties();

  return (
    <AppLayout title="Settings" subtitle="System configuration">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-sm">
            <TabsTrigger value="team" className="text-xs gap-1.5"><UserCog size={13} /> Team</TabsTrigger>
            <TabsTrigger value="properties" className="text-xs gap-1.5"><Building2 size={13} /> Properties</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs gap-1.5"><User size={13} /> Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="team">
            <TeamTab agents={agents || []} />
          </TabsContent>
          <TabsContent value="properties">
            <PropertiesTab properties={properties || []} />
          </TabsContent>
          <TabsContent value="profile">
            <ProfileTab user={user} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
};

function TeamTab({ agents }: { agents: any[] }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const handleAdd = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    try {
      await createAgent.mutateAsync(form);
      setForm({ name: '', email: '', phone: '' });
      toast.success('Agent added');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await updateAgent.mutateAsync({ id, is_active: !isActive });
      toast.success(isActive ? 'Agent deactivated' : 'Agent activated');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!confirm('Are you sure?')) return;
      await deleteAgent.mutateAsync(id);
      toast.success('Agent removed');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="kpi-card">
        <h3 className="font-display font-semibold text-xs mb-4">Add Agent</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px]">Name *</Label>
            <Input placeholder="Agent name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">Email</Label>
            <Input placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">Phone</Label>
            <Input placeholder="+91..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="text-xs" />
          </div>
        </div>
        <Button size="sm" onClick={handleAdd} disabled={createAgent.isPending} className="mt-3 gap-1.5 text-xs">
          <Plus size={12} /> {createAgent.isPending ? 'Adding...' : 'Add Agent'}
        </Button>
      </div>

      <div className="kpi-card">
        <h3 className="font-display font-semibold text-xs mb-4">Team Members</h3>
        <div className="space-y-2">
          {agents.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-accent">{a.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground">{a.email || a.phone || 'No contact info'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => handleToggle(a.id, (a as any).is_active)}>
                  {(a as any).is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
          {agents.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No agents yet</p>}
        </div>
      </div>
    </div>
  );
}

function PropertiesTab({ properties }: { properties: any[] }) {
  const [form, setForm] = useState({ name: '', city: '', area: '', price_range: '', address: '' });
  const createProperty = useCreateProperty();
  const deleteProperty = useDeleteProperty();

  const handleAdd = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    try {
      await createProperty.mutateAsync(form);
      toast.success('Property added');
      setForm({ name: '', city: '', area: '', price_range: '', address: '' });
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!confirm('Are you sure?')) return;
      await deleteProperty.mutateAsync(id);
      toast.success('Property removed');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="kpi-card">
        <h3 className="font-display font-semibold text-xs mb-4">Add Property</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px]">Name *</Label>
            <Input placeholder="Property name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">City</Label>
            <Input placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">Area</Label>
            <Input placeholder="Area" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className="text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">Price Range</Label>
            <Input placeholder="₹50L - 80L" value={form.price_range} onChange={e => setForm(f => ({ ...f, price_range: e.target.value }))} className="text-xs" />
          </div>
        </div>
        <Button size="sm" onClick={handleAdd} disabled={createProperty.isPending} className="mt-3 gap-1.5 text-xs">
          <Plus size={12} /> {createProperty.isPending ? 'Adding...' : 'Add Property'}
        </Button>
      </div>

      <div className="kpi-card">
        <h3 className="font-display font-semibold text-xs mb-4">Properties</h3>
        <div className="space-y-2">
          {properties.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div>
                <p className="text-xs font-medium text-foreground">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{[p.area, p.city].filter(Boolean).join(', ')} {(p as any).price_range ? `· ${(p as any).price_range}` : ''}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}>
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
          {properties.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No properties yet</p>}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: any }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Stub for profile update using fetch
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Profile updated (simulated)');
      setPassword('');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="kpi-card max-w-md">
      <h3 className="font-display font-semibold text-xs mb-4">Your Profile</h3>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[10px]">Email</Label>
          <Input value={user?.email || ''} disabled className="text-xs bg-secondary" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px]">Full Name</Label>
          <Input placeholder="Update your name" value={name} onChange={e => setName(e.target.value)} className="text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px]">New Password</Label>
          <Input type="password" placeholder="Leave blank to keep current" value={password} onChange={e => setPassword(e.target.value)} className="text-xs" />
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 text-xs">
          <Save size={12} /> {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

export default SettingsPage;

