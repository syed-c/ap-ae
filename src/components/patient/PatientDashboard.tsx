'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Settings, LogOut, History } from 'lucide-react';
import { useRouter } from 'next/router';

export default function PatientDashboard() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: appointments } = useQuery({
    queryKey: ['patient-appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('appointments')
        .select('*, clinic:clinics(name, slug), treatment:treatments(name)')
        .eq('patient_id', user.id)
        .order('preferred_date', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'appointments', label: 'My Appointments', icon: Calendar },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xl bg-gradient-to-r from-teal to-gold bg-clip-text text-transparent">
              AppointPanda
            </span>
            <span className="text-sm text-muted-foreground">Patient Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{profile?.full_name || user?.email}</span>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-56 shrink-0">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-teal/10 text-teal font-medium'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold">Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-teal" />
                        Upcoming Appointments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {appointments?.filter(a => a.status === 'confirmed' || a.status === 'pending').length || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gold" />
                        Past Appointments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {appointments?.filter(a => a.status === 'completed').length || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <History className="h-4 w-4 text-coral" />
                        Total Visits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{appointments?.length || 0}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold">My Appointments</h1>
                {appointments?.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No appointments yet. <Button variant="link" onClick={() => router.push('/search')}>Find a dentist</Button>
                    </CardContent>
                  </Card>
                ) : (
                  appointments?.map((apt: any) => (
                    <Card key={apt.id}>
                      <CardContent className="py-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{apt.clinic?.name || 'Unknown Clinic'}</p>
                          <p className="text-sm text-muted-foreground">{apt.treatment?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {apt.preferred_date ? new Date(apt.preferred_date).toLocaleDateString() : 'Date TBD'}
                            {apt.preferred_time ? ` at ${apt.preferred_time}` : ''}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          apt.status === 'confirmed' ? 'bg-teal/10 text-teal' :
                          apt.status === 'completed' ? 'bg-blue/10 text-blue' :
                          apt.status === 'cancelled' ? 'bg-coral/10 text-coral' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {apt.status}
                        </span>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold">Settings</h1>
                <Card>
                  <CardContent className="py-6 space-y-4">
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">{profile?.full_name || 'Not set'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold">Treatment History</h1>
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Treatment history coming soon.
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
