"use client";

import AppLayout from '@/components/AppLayout';
import { Building2, Bed, TrendingUp, Eye, CalendarCheck, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const EffortDashboard = () => {
  const { data: propertyEffort, isLoading } = useQuery({
    queryKey: ['property-effort-combined'],
    queryFn: async () => {
      const res = await fetch('/api/effort');
      if (!res.ok) throw new Error('Failed to fetch effort data');
      return res.json();
    },
  });

  return (
    <AppLayout title="Effort Visibility" subtitle="Transparent effort metrics per property">
      <div className="space-y-6">

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading effort metrics...</div>
        ) : !propertyEffort?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <TrendingUp size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No properties yet</p>
            <p className="text-xs mt-1">Add properties and rooms to see effort metrics</p>
          </div>
        ) : (
          <div className="space-y-4">
            {propertyEffort.map((p: any) => (
              <div key={p.id} className="p-5 rounded-xl border bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-accent" />
                      <h2 className="font-semibold">{p.name}</h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.area && `${p.area}, `}{p.city || ''}
                      {p.owners?.name && ` · Owner: ${p.owners.name}`}
                    </p>
                  </div>
                  {p.lockedRooms > 0 && (
                    <div className="px-2 py-0.5 rounded text-[10px] bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                      {p.lockedRooms} auto-locked
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <MetricCard icon={Bed} label="Total Rooms" value={p.roomCount} />
                  <MetricCard icon={Bed} label="Available" value={p.vacantRooms} color="text-emerald-600" />
                  <MetricCard icon={Eye} label="Leads Pitched" value={p.totalLeads} color="text-sky-600" />
                  <MetricCard icon={CalendarCheck} label="Visits Done" value={p.totalVisits} color="text-violet-600" />
                  <MetricCard icon={ThumbsUp} label="Booked" value={p.booked} color="text-emerald-600" />
                  <MetricCard icon={Minus} label="Considering" value={p.considering} color="text-amber-600" />
                  <MetricCard icon={ThumbsDown} label="Not Interested" value={p.notInterested} color="text-destructive" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const MetricCard = ({ icon: Icon, label, value, color = 'text-foreground' }: { icon: any; label: string; value: number; color?: string }) => (
  <div className="text-center p-2 rounded-lg bg-muted/50">
    <Icon size={14} className={`mx-auto mb-1 ${color}`} />
    <p className={`text-lg font-bold font-display ${color}`}>{value}</p>
    <p className="text-[9px] text-muted-foreground">{label}</p>
  </div>
);

export default EffortDashboard;

