import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Github, 
  Globe, 
  Edit,
  Plus,
  FolderPlus,
  MoreVertical,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import Skeleton from 'react-loading-skeleton';

const typeColors = {
  regression: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  classification: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  computer_vision: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  nlp: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  recommender: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
  integration: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  portfolio: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
};

function ProjectsView() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = searchQuery 
        ? `/api/projects/search?q=${encodeURIComponent(searchQuery)}`
        : '/api/projects';
      const response = await axios.get(endpoint);
      setProjects(response.data);
    } catch (error) {
      toast.error('Error fetching projects.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProjects();
    }, 300); // Debounce search requests

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, fetchProjects]);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;

    const toastId = toast.loading('Quickly adding project...');
    try {
      await axios.post('/api/projects/quick-add', { title: quickAddTitle });
      setQuickAddTitle('');
      fetchProjects();
      toast.success('Project added!', { id: toastId });
    } catch (error) {
      toast.error('Failed to quick-add project.', { id: toastId });
    }
  };

  const handleSave = async (formData) => {
    const isEditing = !!editingProject;
    const toastId = toast.loading(isEditing ? 'Updating project...' : 'Creating project...');
    try {
      if (isEditing) {
        await axios.put(`/api/projects/${editingProject.id}`, formData);
      } else {
        await axios.post('/api/projects', formData);
      }
      setDialogOpen(false);
      fetchProjects();
      toast.success(isEditing ? 'Project updated!' : 'Project created!', { id: toastId });
    } catch (error) {
      toast.error(isEditing ? 'Failed to update project.' : 'Failed to create project.', { id: toastId });
    }
  };

  const openDialog = (project = null) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'in_progress': return <Badge variant="warning">In Progress</Badge>;
      default: return <Badge variant="secondary">Not Started</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Projects</h1>
            <p className="text-muted-foreground">
              Manage all your ML/AI projects and track their progress.
            </p>
          </div>
          <Button>
            <Plus size={16} className="mr-2" />
            New Project
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Projects</h1>
          <p className="text-muted-foreground">
            Manage all your ML/AI projects and track their progress.
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus size={16} className="mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6 items-center">
        <form onSubmit={handleQuickAdd} className="md:col-span-1">
          <Input 
            placeholder="✨ Quickly add a new project... (e.g., 'Build a text summarizer')" 
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
          />
        </form>
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search projects by title or description..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>


      {projects.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <FolderPlus className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">{searchQuery ? 'No projects match your search.' : 'No projects found'}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery ? 'Try a different search term.' : 'Get started by creating a new project or using the Smart Add feature on the dashboard.'}
          </p>
          <div className="mt-6">
            <Button onClick={() => openDialog()}>
              <Plus size={16} className="mr-2" />
              New Project
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${typeColors[project.type] || typeColors.portfolio} mb-2 capitalize`}>
                      {project.type.replace('_', ' ')}
                    </span>
                    <CardTitle className="hover:text-primary">
                      <Link to={`/project/${project.id}`}>{project.title}</Link>
                    </CardTitle>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <p className="text-muted-foreground text-sm flex-grow">{project.description}</p>
              </CardContent>

              <CardFooter className="flex-col items-start pt-4">
                <div className="w-full">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-bold uppercase text-muted-foreground text-xs">Progress</span>
                    <span className="font-semibold">{project.progress_percentage}%</span>
                  </div>
                  <Progress value={project.progress_percentage} className="h-2" />
                </div>
                <div className="w-full border-t mt-4 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {project.github_url ? (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer"><Github size={18} /></a>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" disabled><Github size={18} /></Button>
                    )}
                    {project.deployment_url ? (
                       <Button variant="ghost" size="icon" asChild>
                        <a href={project.deployment_url} target="_blank" rel="noopener noreferrer"><Globe size={18} /></a>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" disabled><Globe size={18} /></Button>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => openDialog(project)}>
                        <Edit size={14} className="mr-2" /> Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <ProjectForm 
        key={editingProject ? editingProject.id : 'new'}
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        onSave={handleSave}
        project={editingProject}
      />
    </div>
  );
}

const ProjectForm = ({ isOpen, setIsOpen, onSave, project }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', month_id: '1', type: 'regression', tech_stack: '',
    status: 'not_started', github_url: '', deployment_url: '', 
    documentation_status: 'not_started', progress_percentage: 0
  });

  useEffect(() => {
    if (project) {
      setFormData({...project, month_id: String(project.month_id)});
    } else {
      setFormData({
        title: '', description: '', month_id: '1', type: 'regression', tech_stack: '',
        status: 'not_started', github_url: '', deployment_url: '', 
        documentation_status: 'not_started', progress_percentage: 0
      });
    }
  }, [project]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, progress_percentage: Number(formData.progress_percentage) });
  };

  const isEditing = !!project;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Project' : 'Create a New Project'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for "${project.title}"` : 'Fill in the details for your new project.'}
          </DialogDescription>
        </DialogHeader>
        <form id="project-form" onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {!isEditing && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title</Label>
                  <Input name="title" value={formData.title} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month_id">Month</Label>
                  <Select name="month_id" value={formData.month_id} onValueChange={value => setFormData({...formData, month_id: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[...Array(6)].map((_, i) => <SelectItem key={i+1} value={String(i+1)}>Month {i+1}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" value={formData.description} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Project Type</Label>
                  <Select name="type" value={formData.type} onValueChange={value => setFormData({...formData, type: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(typeColors).map(type => <SelectItem key={type} value={type} className="capitalize">{type.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tech_stack">Tech Stack</Label>
                  <Input name="tech_stack" value={formData.tech_stack} onChange={handleChange} placeholder="e.g., Python, PyTorch, Streamlit" />
                </div>
              </div>
            </>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" value={formData.status} onValueChange={value => setFormData({...formData, status: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Documentation</Label>
               <Select name="documentation_status" value={formData.documentation_status} onValueChange={value => setFormData({...formData, documentation_status: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Progress: {formData.progress_percentage}%</Label>
            <Input name="progress_percentage" type="range" min="0" max="100" value={formData.progress_percentage} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input name="github_url" value={formData.github_url} onChange={handleChange} placeholder="https://github.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deployment_url">Deployment URL</Label>
              <Input name="deployment_url" value={formData.deployment_url} onChange={handleChange} placeholder="https://your-app.com" />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" form="project-form">{isEditing ? 'Save Changes' : 'Create Project'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ProjectCardSkeleton = () => (
    <Card className="flex flex-col">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <Skeleton height={16} width={100} className="mb-2" />
                    <Skeleton height={24} width={200} />
                </div>
                <Skeleton height={24} width={80} />
            </div>
        </CardHeader>
        <CardContent className="flex-grow">
            <Skeleton count={2} />
        </CardContent>
        <CardFooter className="flex-col items-start pt-4">
            <div className="w-full">
                <div className="flex items-center justify-between text-sm mb-1">
                    <Skeleton height={16} width={60} />
                    <Skeleton height={16} width={40} />
                </div>
                <Skeleton height={8} />
            </div>
            <div className="w-full border-t mt-4 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton circle width={32} height={32} />
                    <Skeleton circle width={32} height={32} />
                </div>
                <Skeleton width={28} height={28} />
            </div>
        </CardFooter>
    </Card>
);


export { ProjectsView as default, ProjectForm }; 