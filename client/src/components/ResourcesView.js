import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ExternalLink, 
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
  Search
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
    const toastId = toast.loading('Updating resource...');
    try {
      await axios.put(`/api/learning-resources/${editingResource.id}`, formData);
      setEditingResource(null);
      fetchResources();
      toast.success('Resource updated!', { id: toastId });
    } catch (error) {
      toast.error('Error updating resource.', { id: toastId });
    }
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
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditingResource(resource)}>
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} />
            </a>
          </Button>
        </div>
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

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search resources by title, notes, or type..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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

      {editingResource && (
        <EditResourceDialog 
          resource={editingResource}
          setResource={setEditingResource}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

const EditResourceDialog = ({ resource, setResource, onSave }) => {
  const [formData, setFormData] = useState({
    status: resource.status,
    notes: resource.notes || ''
  });

  const handleSave = () => {
    onSave(formData);
  }

  return (
    <Dialog open={!!resource} onOpenChange={(isOpen) => !isOpen && setResource(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>Update the status and notes for "{resource.title}"</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
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
              <Textarea
                id="notes"
                placeholder="Your notes about this resource..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setResource(null)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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