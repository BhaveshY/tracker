import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, subDays } from 'date-fns';
import { 
  Clock, 
  Plus, 
  Target,
  TrendingUp,
  BookOpen,
  X
} from 'lucide-react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import Skeleton from 'react-loading-skeleton';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

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

function TimeTracker() {
  const [projects, setProjects] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    hours_spent: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsResponse] = await Promise.all([
        axios.get('/api/projects')
      ]);
      
      setProjects(projectsResponse.data);
      
      // Fetch recent time logs
      const recentLogs = [];
      for (const project of projectsResponse.data) {
        try {
          const logsResponse = await axios.get(`/api/projects/${project.id}/time-logs`);
          recentLogs.push(...logsResponse.data.map(log => ({
            ...log,
            project_title: project.title
          })));
        } catch (error) {
          console.error(`Error fetching logs for project ${project.id}:`, error);
        }
      }
      
      // Sort by date descending
      recentLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTimeLogs(recentLogs.slice(0, 20)); // Show last 20 entries
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const toastId = toast.loading('Logging time...');

    try {
      await axios.post('/api/time-logs', {
        ...formData,
        hours_spent: parseFloat(formData.hours_spent)
      });
      
      setFormData({
        project_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hours_spent: '',
        description: ''
      });
      setShowAddForm(false);
      fetchData();
      toast.success('Time logged successfully!', { id: toastId });
    } catch (error) {
      console.error('Error adding time log:', error);
      toast.error('Failed to log time.', { id: toastId });
    }
  };

  const calculateTotalHours = () => {
    return timeLogs.reduce((total, log) => total + log.hours_spent, 0);
  };

  const calculateWeeklyAverage = () => {
    const weeklyHours = {};
    timeLogs.forEach(log => {
      const week = format(new Date(log.date), 'yyyy-ww');
      weeklyHours[week] = (weeklyHours[week] || 0) + log.hours_spent;
    });
    
    const weeks = Object.keys(weeklyHours);
    if (weeks.length === 0) return 0;
    
    const totalWeeklyHours = Object.values(weeklyHours).reduce((sum, hours) => sum + hours, 0);
    return (totalWeeklyHours / weeks.length).toFixed(1);
  };

  const getCalendarData = () => {
    const values = timeLogs.map(log => {
      return {
        date: format(new Date(log.date), 'yyyy-MM-dd'),
        count: log.hours_spent,
      };
    });
    
    // Group by date
    const groupedByDate = values.reduce((acc, curr) => {
      acc[curr.date] = (acc[curr.date] || 0) + curr.count;
      return acc;
    }, {});
    
    return Object.keys(groupedByDate).map(date => ({
      date,
      count: groupedByDate[date]
    }));
  };

  if (loading) {
    return <TimeTrackerSkeleton />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Time Tracker</h1>
          <p className="text-muted-foreground">
            Log your daily work hours to stay on track.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus size={16} className="mr-2" />
          Log Time
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<Clock size={24} className="text-blue-500" />}
          label="Total Hours"
          value={`${calculateTotalHours().toFixed(1)}h`}
          detail="Across all projects"
        />
        <StatCard 
          icon={<TrendingUp size={24} className="text-green-500" />}
          label="Weekly Average"
          value={`${calculateWeeklyAverage()}h`}
          detail="Hours per week"
        />
        <StatCard 
          icon={<Target size={24} className="text-indigo-500" />}
          label="Work Sessions"
          value={timeLogs.length}
          detail="Total logged sessions"
        />
        <StatCard 
          icon={<BookOpen size={24} className="text-purple-500" />}
          label="Active Projects"
          value={projects.filter(p => p.status === 'in_progress').length}
          detail={`${projects.length} total projects`}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Time Logs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Time Logs</CardTitle>
            <p className="text-sm text-muted-foreground">Your latest work sessions</p>
          </CardHeader>
          <CardContent>
            {timeLogs.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No time logs</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Log your work to see your activity here.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus size={16} className="mr-2" />
                    Log Time
                  </Button>
                </div>
              </div>
            ) : (
              <ul className="-my-4 divide-y">
                {timeLogs.map((log) => (
                  <li key={log.id} className="flex items-center py-4 space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock size={24} className="text-primary"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.project_title}</p>
                      <p className="text-sm text-muted-foreground truncate">{log.description || 'General work'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary">{log.hours_spent}h</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(log.log_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        
        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Heatmap</CardTitle>
          </CardHeader>
          <CardContent className="time-tracker-heatmap text-sm">
            <CalendarHeatmap
              startDate={subDays(new Date(), 180)}
              endDate={new Date()}
              values={getCalendarData()}
              classForValue={(value) => {
                if (!value) { return 'color-empty'; }
                return `color-scale-${Math.min(Math.ceil(value.count), 4)}`;
              }}
              tooltipDataAttrs={value => {
                if (!value || !value.date) {
                  return null;
                }
                return {
                  'data-tooltip-id': 'heatmap-tooltip',
                  'data-tooltip-content': `${value.date}: ${value.count ? value.count.toFixed(1) : '0'} hours`,
                };
              }}
              showWeekdayLabels={true}
            />
            <Tooltip id="heatmap-tooltip" />
            <p className="text-xs text-muted-foreground mt-2 text-center">Last 6 months of activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Time Log Modal */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Work Time</DialogTitle>
          </DialogHeader>
          <form id="time-log-form" onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData({...formData, project_id: v})} required>
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title} (Month {project.month_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Hours Spent</Label>
              <Input type="number" step="0.5" min="0" max="24" placeholder="2.5" value={formData.hours_spent} onChange={(e) => setFormData({...formData, hours_spent: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="What did you work on?" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button type="submit" form="time-log-form">Log Time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Daily Goal Reminder */}
      <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-200 mb-1">Daily Goal: 2-3 Hours</h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Aim for 2-3 hours of focused work daily to complete the roadmap successfully.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const TimeTrackerSkeleton = () => (
  <div>
    <div className="flex items-center justify-between mb-8">
      <div>
        <Skeleton width={300} height={36} />
        <Skeleton width={400} height={20} className="mt-1" />
      </div>
      <Skeleton width={120} height={40} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton width={80} height={20} />
            <Skeleton circle width={24} height={24} />
          </CardHeader>
          <CardContent>
            <Skeleton width={60} height={32} />
            <Skeleton width={120} height={16} className="mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle><Skeleton width={200} height={28} /></CardTitle>
          <Skeleton width={300} height={20} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton circle width={48} height={48} />
              <div className="flex-grow">
                <Skeleton height={20} width="60%" />
                <Skeleton height={16} width="80%" className="mt-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle><Skeleton width={150} height={28} /></CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton height={150} />
        </CardContent>
      </Card>
    </div>
  </div>
);

export default TimeTracker; 