import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Target, 
  Clock, 
  CheckCircle,
  BookOpen,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import Skeleton from 'react-loading-skeleton';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, monthsResponse] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/months')
      ]);
      
      setStats(statsResponse.data);
      setMonths(monthsResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'in_progress': return <Badge variant="warning">In Progress</Badge>;
      default: return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const calculateProgress = (completed, total) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            ML/AI Roadmap Dashboard
          </h1>
          <p className="text-muted-foreground">
            Your 6-month journey to becoming a job-ready ML Engineer.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<Target size={24} className="text-primary" />}
          label="Total Projects"
          value={stats?.total_projects || 0}
          detail={`${stats?.completed_projects || 0} completed`}
        />
        <StatCard 
          icon={<Clock size={24} className="text-blue-500" />}
          label="Hours Logged"
          value={`${stats?.total_hours || 0}h`}
          detail={`${((stats?.total_hours || 0) / 30).toFixed(1)}h avg/day`}
        />
        <StatCard 
          icon={<CheckCircle size={24} className="text-green-500" />}
          label="Overall Progress"
          value={`${calculateProgress(stats?.completed_projects, stats?.total_projects)}%`}
          detail={`${stats?.in_progress_projects || 0} in progress`}
        />
        <StatCard 
          icon={<BookOpen size={24} className="text-purple-500" />}
          label="Resources"
          value={stats?.completed_resources || 0}
          detail="materials completed"
        />
      </div>

      {/* Monthly Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Monthly Roadmap</CardTitle>
              <p className="text-sm text-muted-foreground">Track your learning journey month by month.</p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link to="/goals">View Goals</Link>
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {months.map((month) => {
              const progress = calculateProgress(month.completed_projects, month.total_projects);
              const isCompleted = progress === 100;
              
              return (
                <Link
                  key={month.month_number}
                  to={`/month/${month.month_number}`}
                  className="block p-4 rounded-lg hover:bg-muted/50 transition-colors border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'} rounded-full flex items-center justify-center text-sm font-bold`}>
                        {isCompleted ? <CheckCircle size={20} /> : month.month_number}
                      </div>
                      <div>
                        <h3 className="font-semibold">{month.title}</h3>
                        <p className="text-sm text-muted-foreground">{month.theme}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {month.completed_projects}/{month.total_projects} projects
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {getStatusBadge(isCompleted ? 'completed' : progress > 0 ? 'in_progress' : 'not_started')}
                      </div>
                    </div>
                  </div>
                  
                  {progress > 0 && (
                    <Progress value={progress} className="mt-3 h-2" />
                  )}
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              <QuickActionLink to="/time-tracker" icon={<Clock className="text-blue-500" />} title="Log Time" subtitle="Track your daily work" />
              <QuickActionLink to="/projects" icon={<Target className="text-indigo-500" />} title="Update Projects" subtitle="Manage project status" />
              <QuickActionLink to="/resources" icon={<BookOpen className="text-purple-500" />} title="Learning Resources" subtitle="View tutorials & guides" />
              <QuickActionLink to="https://github.com" icon={<ExternalLink className="text-gray-500" />} title="GitHub Profile" subtitle="Showcase your work" external />
            </div>

            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-semibold text-foreground mb-2">Daily Goal</h3>
              <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Log 2-3 hours</span>
                  <span className="font-bold text-green-600">On Track</span>
              </div>
              <Progress value={80} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const DashboardSkeleton = () => (
  <div>
    <div className="flex items-center justify-between mb-8">
      <div>
        <Skeleton width={300} height={36} />
        <Skeleton width={400} height={20} className="mt-1" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton width={100} height={20} />
            <Skeleton circle width={24} height={24} />
          </CardHeader>
          <CardContent>
            <Skeleton width={60} height={32} className="mb-1" />
            <Skeleton width={120} height={16} />
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle><Skeleton width={200} height={28} /></CardTitle>
              <Skeleton width={300} height={20} className="mt-2" />
            </div>
            <Skeleton width={80} height={36} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton circle width={36} height={36} />
                    <div>
                      <Skeleton height={20} width={150} />
                      <Skeleton height={16} width={100} className="mt-1" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton height={20} width={100} />
                    <Skeleton height={16} width={80} className="mt-1" />
                  </div>
                </div>
                <Skeleton height={8} className="mt-3" />
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle><Skeleton width={150} height={28} /></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2">
                <Skeleton circle width={40} height={40} />
                <div className="flex-grow">
                  <Skeleton height={20} width="80%" />
                  <Skeleton height={16} width="60%" className="mt-1"/>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <Skeleton height={20} width={80} className="mb-2" />
            <div className="flex items-center justify-between text-sm">
              <Skeleton height={16} width={100} />
              <Skeleton height={16} width={60} />
            </div>
            <Skeleton height={8} className="mt-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)

const StatCard = ({ icon, label, value, detail }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{label}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </CardContent>
  </Card>
);

const QuickActionLink = ({ to, icon, title, subtitle, external }) => (
  <Button variant="ghost" className="w-full justify-start h-auto p-3" asChild>
    <Link
      to={to}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mr-4">
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div className="flex-grow text-left">
        <div className="font-semibold text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
      <ArrowRight size={16} className="text-muted-foreground" />
    </Link>
  </Button>
);

export default Dashboard; 