import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ExternalLink, 
  Edit,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  MoreVertical
} from 'lucide-react';
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
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
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import { Input } from './ui/input';

function ResourcesView() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = searchQuery
        ? `/api/resources/search?q=${encodeURIComponent(searchQuery)}`
        : '/api/learning-resources';
      const response = await axios.get(endpoint);
      setResources(response.data);
    } catch (error) {
      toast.error('Error fetching resources.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchResources();
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, fetchResources]);

  const handleSave = async (formData) => {
    const isEditing = !!editingResource;
    const toastId = toast.loading(isEditing ? 'Updating resource...' : 'Creating resource...');
    try {
      if (isEditing) {
        await axios.put(`/api/learning-resources/${editingResource.id}`, formData);
      } else {
        await axios.post('/api/learning-resources', formData);
      }
      setDialogOpen(false);
      setEditingResource(null);
      fetchResources();
      toast.success(isEditing ? 'Resource updated!' : 'Resource created!', { id: toastId });
    } catch (error) {
      toast.error(isEditing ? 'Failed to save resource.' : 'Failed to save resource.', { id: toastId });
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    const toastId = toast.loading('Deleting resource...');
    try {
      await axios.delete(`/api/learning-resources/${resourceId}`);
      fetchResources();
      toast.success('Resource deleted!', { id: toastId });
    } catch (error) {
      toast.error('Failed to delete resource.', { id: toastId });
    }
  };
  
  const openDialog = (resource = null) => {
    setEditingResource(resource);
    setDialogOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      in_progress: 'warning',
      not_started: 'secondary'
    };
    return <Badge variant={variants[status]} className="capitalize">{status.replace('_', ' ')}</Badge>;
  };

  const groupedResources = resources.reduce((acc, resource) => {
    const month = `Month ${resource.month_id}`;
    if (!acc[month]) acc[month] = [];
    acc[month].push(resource);
    return acc;
  }, {});

  const renderResource = (resource) => (
    <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4 flex-1">
        {getStatusIcon(resource.status)}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="font-medium">{resource.title}</h4>
            <Badge variant="outline" className="text-xs">{resource.type}</Badge>
          </div>
          
          {resource.notes && (
            <p className="text-sm text-muted-foreground">{resource.notes}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {getStatusBadge(resource.status)}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => openDialog(resource)}>
              <Edit size={14} className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(resource.id)} className="text-red-500">
              <Trash2 size={14} className="mr-2" />
              Delete
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} className="mr-2" />
                Open Link
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  if (loading) {
    return <ResourcesSkeleton />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learning Resources</h1>
        <p className="text-muted-foreground">
          Track your progress through tutorials, documentation, and learning materials
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search resources..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => openDialog()}>
          <Plus size={16} className="mr-2"/>
          New Resource
        </Button>
      </div>

      <div className="space-y-8">
        {searchQuery ? (
          <div className="grid gap-4">
            {resources.length > 0 ? (
              resources.map(renderResource)
            ) : (
              <p className="text-center text-muted-foreground py-8">No resources match your search.</p>
            )}
          </div>
        ) : (
          Object.keys(groupedResources).sort().map((month) => (
            <Card key={month}>
              <CardHeader>
                <CardTitle>{month} Resources</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {groupedResources[month].filter(r => r.status === 'completed').length} of {groupedResources[month].length} completed
                </p>
              </CardHeader>

              <CardContent className="grid gap-4">
                {groupedResources[month].map(renderResource)}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ResourceForm 
        key={editingResource ? editingResource.id : 'new'}
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        resource={editingResource}
        onSave={handleSave}
      />
    </div>
  );
}

const ResourceForm = ({ isOpen, setIsOpen, resource, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    type: 'tutorial',
    notes: '',
    month_id: '1',
    status: 'not_started'
  });

  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title || '',
        url: resource.url || '',
        type: resource.type || 'tutorial',
        notes: resource.notes || '',
        month_id: String(resource.month_id || '1'),
        status: resource.status || 'not_started'
      });
    } else {
      // Reset for new resource form
      setFormData({
        title: '', url: '', type: 'tutorial', notes: '', month_id: '1', status: 'not_started'
      });
    }
  }, [resource]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isEditing = !!resource;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Resource' : 'Create New Resource'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update details for "${resource.title}"` : 'Add a new learning resource to your tracker.'}
          </DialogDescription>
        </DialogHeader>
        <form id="resource-form" onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          </div>
           <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input id="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={value => setFormData({...formData, type: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutorial">Tutorial</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={formData.month_id} onValueChange={value => setFormData({...formData, month_id: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...Array(6)].map((_, i) => <SelectItem key={i+1} value={String(i+1)}>Month {i+1}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={value => setFormData({...formData, status: value})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" form="resource-form">{isEditing ? 'Save Changes' : 'Create Resource'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const ResourcesSkeleton = () => (
    <div>
        <div className="mb-8">
            <Skeleton height={36} width={300} />
            <Skeleton height={20} width={400} className="mt-1" />
        </div>
        <div className="space-y-8">
            {[...Array(2)].map((_, m) => (
                <Card key={m}>
                    <CardHeader>
                        <Skeleton height={28} width={200} />
                        <Skeleton height={20} width={150} className="mt-1" />
                    </CardHeader>
                    <CardContent className="grid gap-4">
                         {[...Array(3)].map((__, r) => (
                            <div key={r} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4 flex-1">
                                    <Skeleton circle width={20} height={20} />
                                    <div className="flex-1">
                                        <Skeleton height={20} width="70%" />
                                        <Skeleton height={16} width="50%" className="mt-1" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Skeleton height={22} width={80} />
                                    <Skeleton height={32} width={32} />
                                    <Skeleton height={32} width={32} />
                                </div>
                            </div>
                         ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);

export default ResourcesView; 