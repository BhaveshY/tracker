import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft,
  Github,
  Globe,
  Target,
  Edit,
  Plus,
  Zap,
  ChevronRight,
  ListTodo,
  Timer,
  FileText
} from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [timeLogs, setTimeLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projectsResponse, timeLogsResponse, resourcesResponse, tasksResponse] = await Promise.all([
        axios.get('/api/projects'),
        axios.get(`/api/projects/${projectId}/time-logs`),
        axios.get('/api/learning-resources'),
        axios.get(`/api/projects/${projectId}/tasks`)
      ]);
      
      const currentProject = projectsResponse.data.find(p => p.id === projectId);
      setProject(currentProject);
      setTimeLogs(timeLogsResponse.data);
      setTasks(tasksResponse.data);
      
      // Filter resources for this project's month
      const monthResources = resourcesResponse.data.filter(r => r.month_id === currentProject?.month_id);
      setResources(monthResources);
      
    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleTaskSave = async (taskData) => {
    const isEditing = !!editingTask;
    const toastId = toast.loading(isEditing ? 'Updating task...' : 'Creating task...');
    try {
      if (isEditing) {
        await axios.put(`/api/tasks/${editingTask.id}`, { ...taskData, project_id: projectId });
      } else {
        await axios.post('/api/tasks', { ...taskData, project_id: projectId });
      }
      toast.success(isEditing ? 'Task updated!' : 'Task created!', { id: toastId });
      setTaskDialogOpen(false);
      setEditingTask(null);
      fetchProjectDetails();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update task.' : 'Failed to create task.', { id: toastId });
    }
  };

  const openTaskDialog = (task = null) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      in_progress: 'warning',
      not_started: 'secondary',
      todo: 'secondary'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-500',
      medium: 'text-yellow-500',
      low: 'text-green-500'
    };
    return colors[priority] || 'text-muted-foreground';
  };

  const getTypeColor = (type) => {
    const colors = {
      regression: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      classification: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      computer_vision: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      nlp: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      recommender: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
      integration: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
      portfolio: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[type] || 'bg-gray-100 dark:bg-gray-700';
  };

  const calculateTotalHours = () => {
    return timeLogs.reduce((total, log) => total + log.hours_spent, 0);
  };

  if (loading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
        <Button asChild>
          <Link to="/projects">
            <ArrowLeft size={20} />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to="/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
            Back to Projects
          </Link>
        </Button>
        <div>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(project.type)} mb-2 capitalize`}>
            {project.type.replace('_', ' ')}
          </span>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground max-w-3xl mt-1">{project.description}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <nav className="-mb-px flex gap-6" aria-label="Tabs">
                <TabButton name="tasks" activeTab={activeTab} setActiveTab={setActiveTab} icon={<ListTodo size={16}/>}>
                  Tasks
                </TabButton>
                <TabButton name="time-logs" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Timer size={16}/>}>
                  Time Logs
                </TabButton>
                <TabButton name="resources" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FileText size={16}/>}>
                  Resources
                </TabButton>
              </nav>
            </CardHeader>
            <CardContent className="p-6">
              {activeTab === 'tasks' && <TasksSection tasks={tasks} getStatusBadge={getStatusBadge} getPriorityColor={getPriorityColor} onEdit={openTaskDialog} />}
              {activeTab === 'time-logs' && <TimeLogsSection timeLogs={timeLogs} />}
              {activeTab === 'resources' && <ResourcesSection resources={resources} />}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status & Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <OverviewItem icon={<Zap className="text-yellow-500"/>} label="Status">
                {getStatusBadge(project.status)}
              </OverviewItem>
              <OverviewItem icon={<Target className="text-indigo-500"/>} label="Progress">
                <div className="flex items-center gap-2">
                  <Progress value={project.progress_percentage} className="h-2 flex-1" />
                  <span className="text-sm font-medium text-muted-foreground">{project.progress_percentage}%</span>
                </div>
              </OverviewItem>
              <OverviewItem icon={<Timer className="text-blue-500"/>} label="Total Hours Logged">
                <span className="text-lg font-semibold">{calculateTotalHours()} hours</span>
              </OverviewItem>
            </CardContent>
            <div className="p-6 pt-0 mt-2 space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                  <Github size={16} />
                  View on GitHub
                </a>
              </Button>
              <Button className="w-full" asChild>
                <a href={project.deployment_url} target="_blank" rel="noopener noreferrer">
                  <Globe size={16} />
                  View Live Demo
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <TaskForm
        key={editingTask ? editingTask.id : 'new'}
        isOpen={taskDialogOpen}
        setIsOpen={setTaskDialogOpen}
        onSave={handleTaskSave}
        task={editingTask}
      />
    </div>
  );
}

const ProjectDetailSkeleton = () => (
  <div>
    <Skeleton width={120} height={20} className="mb-4" />
    <div className="mb-8">
      <Skeleton width={100} height={22} className="mb-2" />
      <Skeleton width={300} height={36} />
      <Skeleton width={500} height={20} className="mt-1" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="border-b"><Skeleton height={40} /></CardHeader>
          <CardContent className="p-6"><Skeleton height={200} /></CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle><Skeleton width={150} height={24} /></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton height={20} width="50%" />
                <Skeleton height={24} width="80%" className="mt-1"/>
              </div>
            ))}
          </CardContent>
          <div className="p-6 pt-0 mt-2 space-y-2">
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        </Card>
      </div>
    </div>
  </div>
);

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

const OverviewItem = ({ icon, label, children }) => (
  <div>
    <div className="flex items-center gap-3 mb-1">
      <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-full">
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
    <div className="pl-11">
      {children}
    </div>
  </div>
);

const TasksSection = ({ tasks, getStatusBadge, getPriorityColor, onEdit }) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-lg">Project Tasks</h3>
      <Button size="sm" onClick={() => onEdit(null)}>
        <Plus size={16}/>
        Add Task
      </Button>
    </div>
    <div className="space-y-3">
      {tasks.map(task => (
        <div key={task.id} className="p-3 bg-muted/50 rounded-lg border flex items-start justify-between">
          <div>
            <p className="font-semibold">{task.title}</p>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {getStatusBadge(task.status)}
            <span className={`font-medium capitalize ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
              <Edit size={16}/>
            </Button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TimeLogsSection = ({ timeLogs }) => (
  <div>
    <h3 className="font-semibold text-lg mb-4">Time Logs</h3>
    <ul className="space-y-3">
      {timeLogs.map(log => (
        <li key={log.id} className="p-3 bg-muted/50 rounded-lg border flex items-center justify-between">
          <div>
            <p className="font-semibold">{log.hours_spent.toFixed(1)} hours</p>
            <p className="text-sm text-muted-foreground">{log.summary}</p>
          </div>
          <span className="text-sm text-muted-foreground">{new Date(log.log_date).toLocaleDateString()}</span>
        </li>
      ))}
    </ul>
  </div>
);

const ResourcesSection = ({ resources }) => (
  <div>
    <h3 className="font-semibold text-lg mb-4">Relevant Resources</h3>
    <ul className="space-y-3">
      {resources.map(resource => (
        <a href={resource.url} target="_blank" rel="noopener noreferrer" key={resource.id} 
           className="p-3 bg-muted/50 rounded-lg border flex items-center justify-between hover:bg-muted transition-colors">
          <div>
            <p className="font-semibold">{resource.title}</p>
            <p className="text-sm text-muted-foreground">{resource.type}</p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground"/>
        </a>
      ))}
    </ul>
  </div>
);

const TaskForm = ({ isOpen, setIsOpen, onSave, task }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : ''
      });
    } else {
      setFormData({
        title: '', description: '', status: 'todo', priority: 'medium', due_date: ''
      });
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create a New Task'}</DialogTitle>
        </DialogHeader>
        <form id="task-form" onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={value => setFormData({...formData, status: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={value => setFormData({...formData, priority: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" form="task-form">{task ? 'Save Changes' : 'Create Task'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetail; 