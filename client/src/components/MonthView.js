import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft,
  Calendar,
  Target,
  BookOpen,
  ExternalLink,
  Github,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import Skeleton from 'react-loading-skeleton';

function MonthView() {
  const { monthNumber } = useParams();
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthData();
  }, [monthNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMonthData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/months/${monthNumber}`);
      setMonthData(response.data);
    } catch (error) {
      console.error('Error fetching month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      in_progress: 'warning',
      not_started: 'secondary'
    };
    const labels = {
      completed: 'Completed',
      in_progress: 'In Progress',
      not_started: 'Not Started'
    };
    return (
      <Badge variant={variants[status]} className="capitalize">
        {labels[status] || status.replace('_', ' ')}
      </Badge>
    );
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
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const calculateProgress = () => {
    if (!monthData || !monthData.projects) return 0;
    const completed = monthData.projects.filter(p => p.status === 'completed').length;
    return monthData.projects.length > 0 ? Math.round((completed / monthData.projects.length) * 100) : 0;
  };

  if (loading) {
    return <MonthViewSkeleton />;
  }

  if (!monthData) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">Month Not Found</h2>
        <Button asChild>
          <Link to="/">
            <ArrowLeft size={20} className="mr-2"/>
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <Button asChild variant="secondary" className="mb-4">
          <Link to="/">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-lg font-bold text-primary">
            {monthNumber}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{monthData.title}</h1>
            <p className="text-muted-foreground">{monthData.description}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Target className="w-6 h-6 text-primary" />
            <CardTitle className="text-base">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{calculateProgress()}%</div>
            <p className="text-sm text-muted-foreground">
              {monthData.projects.filter(p => p.status === 'completed').length} of {monthData.projects.length} projects completed
            </p>
            <Progress value={calculateProgress()} className="mt-4 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Calendar className="w-6 h-6 text-green-500" />
            <CardTitle className="text-base">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthData.projects.length}</div>
            <p className="text-sm text-muted-foreground">
              {monthData.projects.filter(p => p.status === 'in_progress').length} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <BookOpen className="w-6 h-6 text-purple-500" />
            <CardTitle className="text-base">Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthData.resources.length}</div>
            <p className="text-sm text-muted-foreground">
              {monthData.resources.filter(r => r.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <p className="text-sm text-muted-foreground">Build these projects to master the month's concepts</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthData.projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(project.status)}
                    <div>
                      <h4 className="font-semibold">{project.title}</h4>
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${getTypeColor(project.type)}`}>
                        {project.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(project.status)}
                </div>

                <p className="text-muted-foreground text-sm mb-3">{project.description}</p>
                
                <div className="text-sm text-muted-foreground mb-3">
                  <strong>Tech Stack:</strong> {project.tech_stack}
                </div>

                <div className="w-full">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{project.progress_percentage}%</span>
                  </div>
                  <Progress value={project.progress_percentage} className="h-2" />
                </div>
                
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {project.github_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer" title="GitHub">
                          <Github size={16} />
                        </a>
                      </Button>
                    )}
                    {project.deployment_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={project.deployment_url} target="_blank" rel="noopener noreferrer" title="Live Demo">
                          <Globe size={16} />
                        </a>
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Docs:</span>
                    {getStatusBadge(project.documentation_status)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Resources</CardTitle>
            <p className="text-sm text-muted-foreground">Recommended tutorials and documentation</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {monthData.resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-medium">{resource.title}</h4>
                    <Badge variant="outline">{resource.type}</Badge>
                  </div>
                  {resource.notes && (
                    <p className="text-sm text-muted-foreground ml-7">{resource.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(resource.status)}
                  <Button variant="ghost" size="icon" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16} />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Month-specific Tips */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">Month {monthNumber} Tips</h3>
        <div className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
          {monthNumber === '1' && (
            <div>
              <p>• Start with simple datasets to understand the fundamentals</p>
              <p>• Focus on understanding train/test splits and evaluation metrics</p>
              <p>• Deploy your first Streamlit app to get comfortable with the workflow</p>
            </div>
          )}
          {monthNumber === '2' && (
            <div>
              <p>• Use pre-trained models when possible to save time</p>
              <p>• Understand the difference between classification and object detection</p>
              <p>• Practice with different image datasets to see how CNNs adapt</p>
            </div>
          )}
          {monthNumber === '3' && (
            <div>
              <p>• Start with HuggingFace pipelines for quick prototyping</p>
              <p>• Fine-tune pre-trained models rather than training from scratch</p>
              <p>• Focus on understanding tokenization and text preprocessing</p>
            </div>
          )}
          {monthNumber === '4' && (
            <div>
              <p>• Use the MovieLens dataset for hands-on collaborative filtering</p>
              <p>• Understand the cold start problem in recommendation systems</p>
              <p>• Compare collaborative filtering with content-based approaches</p>
            </div>
          )}
          {monthNumber === '5' && (
            <div>
              <p>• Integrate multiple ML models into a single application</p>
              <p>• Focus on API design and user experience</p>
              <p>• Use Docker for consistent deployment environments</p>
            </div>
          )}
          {monthNumber === '6' && (
            <div>
              <p>• Polish your GitHub repositories with clear documentation</p>
              <p>• Create a portfolio website showcasing all your projects</p>
              <p>• Practice explaining your projects for job interviews</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MonthViewSkeleton = () => (
    <div>
        <div className="mb-8">
            <Skeleton height={36} width={150} className="mb-4" />
            <div className="flex items-center gap-4 mb-4">
                <Skeleton circle width={48} height={48} />
                <div>
                    <Skeleton height={36} width={300} />
                    <Skeleton height={20} width={400} className="mt-1" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center gap-3 pb-2">
                        <Skeleton circle width={24} height={24} />
                        <Skeleton height={20} width={150} />
                    </CardHeader>
                    <CardContent>
                        <Skeleton height={32} width={80} />
                        <Skeleton height={20} width={150} className="mt-2" />
                         <Skeleton height={8} className="mt-4" />
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton height={28} width={150} /></CardTitle>
                    <Skeleton height={20} width={300} className="mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                            <Skeleton height={20} width="80%" />
                            <Skeleton height={16} width="60%" className="mt-2" />
                            <Skeleton height={8} className="mt-4" />
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton height={28} width={200} /></CardTitle>
                    <Skeleton height={20} width={300} className="mt-1" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-3 border rounded-lg">
                             <Skeleton height={20} width="90%" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    </div>
);


export default MonthView;