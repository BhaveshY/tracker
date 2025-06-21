import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Target, 
  Clock,
  Plus,
  Trophy,
  Flag,
  Briefcase,
  Book,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import toast from 'react-hot-toast';
import { differenceInDays, format } from 'date-fns';
import Skeleton from 'react-loading-skeleton';

const goalIcons = {
  daily: { icon: Clock, color: 'text-blue-500' },
  project: { icon: Target, color: 'text-green-500' },
  milestone: { icon: Flag, color: 'text-purple-500' },
  portfolio: { icon: Trophy, color: 'text-orange-500' },
  career: { icon: Briefcase, color: 'text-red-500' },
  learning: { icon: Book, color: 'text-cyan-500' },
};

function Goals() {
  const [goals, setGoals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('goals');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [goalsResponse, projectsResponse] = await Promise.all([
        axios.get('/api/goals'),
        axios.get('/api/projects')
      ]);
      
      const portfolioProjects = projectsResponse.data.filter(p => p.github_url).length;
      
      const updatedGoals = goalsResponse.data.map(goal => {
        if (goal.type === 'portfolio') {
          return { ...goal, current_value: portfolioProjects };
        }
        return goal;
      });

      setGoals(updatedGoals);
      setProjects(projectsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleSaveGoal = async (goalData) => {
    const toastId = toast.loading(editingGoal ? 'Updating goal...' : 'Creating goal...');
    try {
      if (editingGoal) {
        await axios.put(`/api/goals/${editingGoal.id}`, goalData);
      } else {
        await axios.post('/api/goals', goalData);
      }
      toast.success(editingGoal ? 'Goal updated!' : 'Goal created!', { id: toastId });
      setDialogOpen(false);
      setEditingGoal(null);
      fetchData(); // Refresh data
    } catch (error) {
      toast.error('Failed to save goal.', { id: toastId });
    }
  };

  const handleDeleteGoal = async (goalId) => {
    const toastId = toast.loading('Deleting goal...');
    try {
      await axios.delete(`/api/goals/${goalId}`);
      toast.success('Goal deleted!', { id: toastId });
      fetchData(); // Refresh data
    } catch (error) {
      toast.error('Failed to delete goal.', { id: toastId });
    }
  };

  const openEditDialog = (goal) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };
  
  const openNewDialog = () => {
    setEditingGoal(null);
    setDialogOpen(true);
  };

  const getProgressPercentage = useCallback((goal) => {
    if (!goal.target_value) return 0;
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  }, []);

  if (loading) {
    return <GoalsSkeleton />;
  }
  
  const milestones = getMilestones(projects);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Goals & Milestones</h1>
          <p className="text-muted-foreground">
            Track your high-level objectives and progress towards job readiness.
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus size={16} className="mr-2"/>
          New Goal
        </Button>
      </div>

      <div className="mt-8">
        <div className="border-b">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            <TabButton name="goals" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Target size={16}/>}>
              Active Goals
            </TabButton>
            <TabButton name="milestones" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Trophy size={16}/>}>
              Roadmap Milestones
            </TabButton>
          </nav>
        </div>
        
        <div className="mt-6">
          {activeTab === 'goals' && (
            <GoalsGrid 
              goals={goals} 
              getProgressPercentage={getProgressPercentage} 
              onEdit={openEditDialog}
              onDelete={handleDeleteGoal}
            />
          )}
          {activeTab === 'milestones' && <MilestonesTimeline milestones={milestones} />}
        </div>
      </div>

      <GoalForm 
        key={editingGoal ? editingGoal.id : 'new'}
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        onSave={handleSaveGoal}
        goal={editingGoal}
      />
    </div>
  );
}

const TabButton = ({ name, activeTab, setActiveTab, icon, children }) => (
  <button
    onClick={() => setActiveTab(name)}
    className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
      activeTab === name
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
    }`}
  >
    {icon}
    {children}
  </button>
);

const GoalsGrid = ({ goals, getProgressPercentage, onEdit, onDelete }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {goals.length > 0 ? (
      goals.map((goal) => {
        const progress = getProgressPercentage(goal);
        const { icon: Icon, color } = goalIcons[goal.type] || goalIcons.project;
        const daysLeft = differenceInDays(new Date(goal.target_date), new Date());
        
        let statusBadge;
        if (progress >= 100) {
          statusBadge = <Badge variant="success">Completed</Badge>;
        } else if (daysLeft < 0) {
          statusBadge = <Badge variant="destructive">Overdue</Badge>;
        } else if (daysLeft <= 7) {
          statusBadge = <Badge variant="warning">Due Soon</Badge>;
        } else {
          statusBadge = <Badge variant="secondary">Active</Badge>;
        }
        
        return (
          <Card key={goal.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <CardDescription className="capitalize">{goal.type}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical size={16}/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onEdit(goal)}><Edit size={14} className="mr-2"/> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(goal.id)} className="text-red-500"><Trash2 size={14} className="mr-2"/> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground h-10">{goal.description}</p>
            </CardContent>
            <CardFooter className="flex-col items-start">
              <div className="w-full">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-medium text-muted-foreground">Progress</span>
                  <span className="font-bold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
                <div className="flex justify-between items-center mt-2">
                  {statusBadge}
                  <div className="text-xs text-muted-foreground">
                    {daysLeft >= 0 ? `${daysLeft} days left` : 'Deadline passed'}
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
        );
      })
    ) : (
      <div className="md:col-span-2 lg:col-span-3 text-center py-16 border-2 border-dashed rounded-lg">
        <Target className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium">No goals yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new goal or using Smart Add on the dashboard.</p>
      </div>
    )}
  </div>
);

const getMilestones = (projects) => [
    {
      month: 1,
      title: "Foundation Complete",
      description: "Master regression and classification basics",
      completed: projects.filter(p => p.month_id === 1 && p.status === 'completed').length >= 2
    },
    {
      month: 2,
      title: "Computer Vision Expert",
      description: "Build and deploy CNN models",
      completed: projects.filter(p => p.month_id === 2 && p.status === 'completed').length >= 2
    },
    {
      month: 3,
      title: "NLP Practitioner",
      description: "Work with transformers and BERT",
      completed: projects.filter(p => p.month_id === 3 && p.status === 'completed').length >= 2
    },
    {
      month: 4,
      title: "Recommendation Systems",
      description: "Build collaborative filtering systems",
      completed: projects.filter(p => p.month_id === 4 && p.status === 'completed').length >= 2
    },
    {
      month: 5,
      title: "Advanced Integration",
      description: "Combine multiple ML technologies",
      completed: projects.filter(p => p.month_id === 5 && p.status === 'completed').length >= 2
    },
    {
      month: 6,
      title: "Job Ready Portfolio",
      description: "Complete portfolio for applications",
      completed: projects.filter(p => p.month_id === 6 && p.status === 'completed').length >= 2
    }
];

const MilestonesTimeline = ({ milestones }) => (
  <div className="max-w-3xl mx-auto">
    {milestones.map((milestone, index) => (
      <div key={milestone.title} className="flex items-start gap-6">
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            milestone.completed ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            <Trophy size={20} />
          </div>
          {index < milestones.length - 1 && 
            <div className={`w-0.5 flex-grow ${milestone.completed ? 'bg-green-500' : 'bg-border'}`} style={{minHeight: '4rem'}}></div>
          }
        </div>
        <div className={`pb-12 ${milestone.completed ? '' : 'opacity-60'}`}>
          <p className="text-sm font-semibold text-muted-foreground">Month {milestone.month}</p>
          <h4 className="font-bold text-xl">{milestone.title}</h4>
          <p className="text-muted-foreground">{milestone.description}</p>
        </div>
      </div>
    ))}
  </div>
);

const GoalForm = ({ isOpen, setIsOpen, onSave, goal }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'daily',
    target_value: '1',
    current_value: '0',
    target_date: '',
    status: 'active'
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        type: goal.type || 'daily',
        target_value: String(goal.target_value || '1'),
        current_value: String(goal.current_value || '0'),
        target_date: goal.target_date ? format(new Date(goal.target_date), 'yyyy-MM-dd') : '',
        status: goal.status || 'active'
      });
    } else {
      setFormData({
        title: '', description: '', type: 'daily', target_value: '1',
        current_value: '0', target_date: '', status: 'active'
      });
    }
  }, [goal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      target_value: parseFloat(formData.target_value),
      current_value: parseFloat(formData.current_value),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create a New Goal'}</DialogTitle>
          <DialogDescription>
            {goal ? 'Update the details of your goal.' : 'Set a new goal to track your progress.'}
          </DialogDescription>
        </DialogHeader>
        <form id="goal-form" onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g., Complete 5 Kaggle competitions" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Briefly describe what this goal entails" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Goal Type</Label>
              <Select value={formData.type} onValueChange={value => setFormData({...formData, type: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(goalIcons).map(type => (
                    <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date</Label>
              <Input id="target_date" type="date" value={formData.target_date} onChange={e => setFormData({...formData, target_date: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_value">Target Value</Label>
              <Input id="target_value" type="number" value={formData.target_value} onChange={e => setFormData({...formData, target_value: e.target.value})} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="current_value">Current Value</Label>
              <Input id="current_value" type="number" value={formData.current_value} onChange={e => setFormData({...formData, current_value: e.target.value})} />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" form="goal-form">{goal ? 'Save Changes' : 'Create Goal'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const GoalsSkeleton = () => (
    <div>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
            <div>
                <Skeleton height={36} width={300} />
                <Skeleton height={20} width={400} className="mt-1" />
            </div>
            <Skeleton height={40} width={120} />
        </div>

        {/* Tabs skeleton */}
        <div className="mt-8">
            <div className="border-b">
                <div className="flex gap-6">
                    <Skeleton height={20} width={100} />
                    <Skeleton height={20} width={150} />
                </div>
            </div>
        </div>

        {/* Content skeleton (for goals grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton circle width={40} height={40} />
                                <div>
                                    <Skeleton height={22} width={150} />
                                    <Skeleton height={16} width={80} className="mt-1" />
                                </div>
                            </div>
                            <Skeleton width={32} height={32} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton count={2} />
                    </CardContent>
                    <CardFooter className="flex-col items-start">
                        <div className="w-full">
                           <Skeleton height={8} className="mb-2" />
                           <div className="flex justify-between items-center mt-2">
                                <Skeleton height={22} width={80} />
                                <Skeleton height={16} width={100} />
                           </div>
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </div>
);

export default Goals; 