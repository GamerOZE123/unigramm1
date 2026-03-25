import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, Bell } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalNotifications: number;
}

const AdminOverviewStats: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalPosts: 0, totalNotifications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, postsRes, notifRes] = await Promise.all([
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('notifications').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        totalUsers: usersRes.count ?? 0,
        totalPosts: postsRes.count ?? 0,
        totalNotifications: notifRes.count ?? 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
    { label: 'Total Posts', value: stats.totalPosts, icon: FileText, color: 'text-green-400' },
    { label: 'Total Notifications', value: stats.totalNotifications, icon: Bell, color: 'text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-muted ${c.color}`}>
              <c.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? '…' : c.value.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminOverviewStats;
