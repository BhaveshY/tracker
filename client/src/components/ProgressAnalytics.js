import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Target, 
  Clock,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Skeleton from 'react-loading-skeleton';

function ProgressAnalytics() {
  const [stats, setStats] = useState(null);
  const [timeLogs, setTimeLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [statsResponse, projectsResponse] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/projects')
      ]);
      
      setStats(statsResponse.data);
      setProjects(projectsResponse.data);
      
      // Fetch time logs for all projects
      const allTimeLogs = [];
      for (const project of projectsResponse.data) {
        try {
          const logsResponse = await axios.get(`/api/projects/${project.id}/time-logs`);
          allTimeLogs.push(...logsResponse.data.map(log => ({
            ...log,
            project_title: project.title,
            project_type: project.type
          })));
        } catch (error) {
          console.error(`Error fetching logs for project ${project.id}:`, error);
        }
      }
      
      setTimeLogs(allTimeLogs.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectTypeDistribution = () => {
    const distribution = {};
    projects.forEach(project => {
      distribution[project.type] = (distribution[project.type] || 0) + 1;
    });
    return distribution;
  };

  const getCompletionRate = () => {
    if (projects.length === 0) return 0;
    const completed = projects.filter(p => p.status === 'completed').length;
    return Math.round((completed / projects.length) * 100);
  };

  const getWeeklyProgress = () => {
    const weeks = {};
    timeLogs.forEach(log => {
      const weekStart = new Date(log.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      weeks[weekKey] = (weeks[weekKey] || 0) + log.hours_spent;
    });
    
    return Object.entries(weeks)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-8) // Last 8 weeks
      .map(([date, hours]) => ({
        week: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: parseFloat(hours.toFixed(1))
      }));
  };

  const getMonthlyDistribution = () => {
    const months = {};
    projects.forEach(project => {
      const month = `Month ${project.month_id}`;
      if (!months[month]) {
        months[month] = { total: 0, completed: 0 };
      }
      months[month].total++;
      if (project.status === 'completed') {
        months[month].completed++;
      }
    });
    
    return Object.entries(months).map(([month, data]) => ({
      month,
      completion: Math.round((data.completed / data.total) * 100),
      total: data.total,
      completed: data.completed
    }));
  };

  const getProductivityInsights = () => {
    const insights = [];
    
    // Average hours per day
    const totalDays = timeLogs.length > 0 ? 
      Math.ceil((new Date() - new Date(timeLogs[timeLogs.length - 1].date)) / (1000 * 60 * 60 * 24)) : 0;
    const avgHoursPerDay = totalDays > 0 ? (stats?.total_hours || 0) / totalDays : 0;
    
    if (avgHoursPerDay >= 2.5) {
      insights.push({
        type: 'positive',
        message: `Great pace! You're averaging ${avgHoursPerDay.toFixed(1)} hours/day`
      });
    } else if (avgHoursPerDay >= 1.5) {
      insights.push({
        type: 'warning',
        message: `Good progress but aim for 2-3 hours daily (currently ${avgHoursPerDay.toFixed(1)}h/day)`
      });
    } else {
      insights.push({
        type: 'danger',
        message: `Increase daily commitment to meet goals (currently ${avgHoursPerDay.toFixed(1)}h/day)`
      });
    }
    
    // Project completion rate
    const completionRate = getCompletionRate();
    if (completionRate >= 80) {
      insights.push({
        type: 'positive',
        message: `Excellent completion rate: ${completionRate}%`
      });
    } else if (completionRate >= 50) {
      insights.push({
        type: 'warning',
        message: `Good progress: ${completionRate}% completion rate`
      });
    }
    
    return insights;
  };

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  const weeklyProgress = getWeeklyProgress();
  const monthlyDistribution = getMonthlyDistribution();
  const typeDistribution = getProjectTypeDistribution();
  const insights = getProductivityInsights();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Progress Analytics</h1>
        <p className="text-muted-foreground">
          Detailed insights into your learning progress and productivity
        </p>
      </div>

      {/* Key Insights */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">📊 Key Insights</h2>
        <div className="grid gap-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                insight.type === 'positive' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300' :
                insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300' :
                'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
              }`}
            >
              <p>{insight.message}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Weekly Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Weekly Hours Trend
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {weeklyProgress.map((week, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{week.week}</span>
                <div className="flex items-center gap-3 flex-1 ml-4">
                  <div className="flex-1 bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.min((week.hours / 21) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{week.hours}h</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Monthly Completion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Monthly Completion Rates
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {monthlyDistribution.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{month.month}</span>
                <div className="flex items-center gap-3 flex-1 ml-4">
                  <div className="flex-1 bg-secondary rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${month.completion}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    {month.completed}/{month.total}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Project Type Distribution */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Project Type Distribution
          </CardTitle>
        </CardHeader>
        
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Object.entries(typeDistribution).map(([type, count]) => (
            <div key={type} className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{count}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {type.replace('_', ' ')}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity Timeline
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {timeLogs.slice(0, 10).map((log) => (
            <div key={log.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{log.project_title}</div>
                <div className="text-sm text-muted-foreground">{log.description}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(log.date).toLocaleDateString()} • {log.project_type.replace('_', ' ')}
                </div>
              </div>
              <div className="text-lg font-semibold text-primary">
                {log.hours_spent}h
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Goals & Recommendations */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 dark:from-purple-900/20 dark:to-indigo-900/20 dark:border-purple-800">
        <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-3">🎯 Goals & Recommendations</h3>
        <div className="text-purple-700 dark:text-purple-300 text-sm space-y-2">
          <p>• Maintain 2-3 hours daily to complete the roadmap in 6 months</p>
          <p>• Focus on deploying each project to build your portfolio</p>
          <p>• Document your learnings for future reference and interviews</p>
          <p>• Join ML communities and share your progress for networking</p>
          <p>• Prepare for Werkstudent applications by month 4-5</p>
        </div>
      </div>
    </div>
  );
}

const AnalyticsSkeleton = () => (
    <div>
        <div className="mb-8">
            <Skeleton height={36} width={300} />
            <Skeleton height={20} width={400} className="mt-1" />
        </div>

        <div className="mb-8">
            <Skeleton height={24} width={150} className="mb-4" />
            <div className="grid gap-4">
                <Skeleton height={60} />
                <Skeleton height={40} />
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
                <CardHeader><CardTitle><Skeleton height={28} width={200} /></CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} height={20} />)}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle><Skeleton height={28} width={250} /></CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} height={20} />)}
                </CardContent>
            </Card>
        </div>
        
        <Card className="mb-8">
            <CardHeader><CardTitle><Skeleton height={28} width={280} /></CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Skeleton height={60} />
                <Skeleton height={60} />
                <Skeleton height={60} />
                <Skeleton height={60} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle><Skeleton height={28} width={250} /></CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 {[...Array(3)].map((_, i) => <Skeleton key={i} height={60} />)}
            </CardContent>
        </Card>
    </div>
);

export default ProgressAnalytics; 