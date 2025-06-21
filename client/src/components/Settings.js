import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { 
  Palette,
  User,
  Bell,
  Database,
  Download,
  Upload,
  Trash2,
  Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

function Settings() {
  const [settings, setSettings] = useState({
    profile: {
      name: 'ML Enthusiast',
      email: 'user@example.com',
      timezone: 'Europe/Berlin',
      language: 'en'
    },
    notifications: {
      dailyReminder: true,
      weeklyReport: true,
      milestoneAlerts: true,
      emailNotifications: false
    },
    preferences: {
      theme: 'auto',
      hoursGoal: 2.5,
      weekStart: 'monday',
      dateFormat: 'DD/MM/YYYY'
    },
    data: {
      autoBackup: true,
      backupFrequency: 'weekly'
    }
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');


  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('ml-tracker-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    if (seedDialogOpen) {
      axios.get('/api/roadmap/templates')
        .then(response => {
          setTemplates(response.data);
          if (response.data.length > 0) {
            setSelectedTemplate(response.data[0].id);
          }
        })
        .catch(error => {
          toast.error("Could not load roadmap templates.");
          console.error("Error fetching templates:", error);
        });
    }
  }, [seedDialogOpen]);

  const handleSave = () => {
    localStorage.setItem('ml-tracker-settings', JSON.stringify(settings));
    toast.success('Settings saved successfully!');
    // Trigger theme change immediately
    window.dispatchEvent(new Event('storage'));
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const exportData = () => {
    try {
      const dataStr = JSON.stringify({
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }, null, 2);
      
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ml-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch(err) {
      toast.error('Failed to export data.');
    }
  };
  
  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          if (importedData.settings) {
            setSettings(importedData.settings);
            toast.success('Data imported successfully! Click "Save settings" to apply.');
          } else {
            toast.error('Invalid backup file format.');
          }
        } catch (error) {
          toast.error('Invalid backup file. Could not parse JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  const resetAllData = async () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      const toastId = toast.loading('Resetting all data...');
      try {
        await axios.post('/api/data/reset');
        localStorage.clear();
        toast.success('All data has been reset!', { id: toastId });
        // Force a hard reload to clear all state
        window.location.href = '/'; 
      } catch (error) {
        console.error('Error resetting data:', error);
        toast.error('Failed to reset data.', { id: toastId });
      }
    }
  };

  const loadRoadmapTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template.");
      return;
    }
    const toastId = toast.loading('Loading roadmap template...');
    try {
      await axios.post('/api/roadmap/seed', { templateId: selectedTemplate });
      toast.success('Roadmap template loaded successfully!', { id: toastId });
      setSeedDialogOpen(false);
      // Redirect to dashboard to see the changes
      window.location.href = '/';
    } catch (error) {
      console.error('Error loading roadmap template:', error);
      toast.error('Failed to load roadmap template.', { id: toastId });
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Backup', icon: Database }
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">
          Configure your ML/AI learning tracker preferences
        </p>
      </header>

      <div className="grid md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <nav className="space-y-1 sticky top-24">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "secondary" : "ghost"}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full justify-start gap-3"
                >
                  <IconComponent size={18} />
                  {tab.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        <main className="md:col-span-3 space-y-8">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={settings.profile.name} onChange={(e) => handleSettingChange('profile', 'name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={settings.profile.email} onChange={(e) => handleSettingChange('profile', 'email', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select value={settings.profile.timezone} onValueChange={(v) => handleSettingChange('profile', 'timezone', v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                          <SelectItem value="Europe/London">Europe/London</SelectItem>
                          <SelectItem value="America/New_York">America/New York</SelectItem>
                          <SelectItem value="America/Los_Angeles">America/Los Angeles</SelectItem>
                          <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={settings.profile.language} onValueChange={(v) => handleSettingChange('profile', 'language', v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle>Application Preferences</CardTitle>
                <CardDescription>Customize the look and feel of the app.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hoursGoal">Daily Hours Goal</Label>
                      <Input id="hoursGoal" type="number" min="0.5" max="8" step="0.5" value={settings.preferences.hoursGoal} onChange={(e) => handleSettingChange('preferences', 'hoursGoal', parseFloat(e.target.value))} />
                      <p className="text-xs text-muted-foreground">Hours you aim to study each day.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <Select value={settings.preferences.theme} onValueChange={(v) => handleSettingChange('preferences', 'theme', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto (System)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Week Start Day</Label>
                      <Select value={settings.preferences.weekStart} onValueChange={(v) => handleSettingChange('preferences', 'weekStart', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date Format</Label>
                      <Select value={settings.preferences.dateFormat} onValueChange={(v) => handleSettingChange('preferences', 'dateFormat', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Daily Study Reminder</h4>
                    <p className="text-sm text-muted-foreground">Get reminded to maintain your daily study routine.</p>
                  </div>
                  <Switch checked={settings.notifications.dailyReminder} onCheckedChange={(v) => handleSettingChange('notifications', 'dailyReminder', v)} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Weekly Progress Report</h4>
                    <p className="text-sm text-muted-foreground">Receive weekly summaries of your learning progress.</p>
                  </div>
                   <Switch checked={settings.notifications.weeklyReport} onCheckedChange={(v) => handleSettingChange('notifications', 'weeklyReport', v)} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Milestone Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get notified when you complete important milestones.</p>
                  </div>
                  <Switch checked={settings.notifications.milestoneAlerts} onCheckedChange={(v) => handleSettingChange('notifications', 'milestoneAlerts', v)} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive notifications via email.</p>
                  </div>
                  <Switch checked={settings.notifications.emailNotifications} onCheckedChange={(v) => handleSettingChange('notifications', 'emailNotifications', v)} />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'data' && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Manage your application data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Auto Backup</h4>
                      <p className="text-sm text-muted-foreground">Automatically backup your data to local storage.</p>
                    </div>
                    <Switch checked={settings.data.autoBackup} onCheckedChange={(v) => handleSettingChange('data', 'autoBackup', v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Backup Frequency</Label>
                    <Select value={settings.data.backupFrequency} onValueChange={(v) => handleSettingChange('data', 'backupFrequency', v)} disabled={!settings.data.autoBackup}>
                      <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-3">
                  <div className="flex gap-3">
                    <Button onClick={exportData} variant="secondary">
                      <Download size={16} />
                      Export Data
                    </Button>
                    <Button asChild variant="secondary" className="cursor-pointer">
                      <Label>
                        <Upload size={16} />
                        Import Data
                        <Input type="file" accept=".json" className="hidden" onChange={importData} />
                      </Label>
                    </Button>
                  </div>
                   <Dialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Load Roadmap Template</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Load a Roadmap Template</DialogTitle>
                        <DialogDescription>
                          Select a template to load. This will replace all projects, tasks, and resources.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="template-select">Choose a roadmap</Label>
                        <Select onValueChange={setSelectedTemplate} defaultValue={selectedTemplate}>
                          <SelectTrigger id="template-select">
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedTemplate && templates.find(t => t.id === selectedTemplate) &&
                           <p className="text-sm text-muted-foreground mt-2">
                            {templates.find(t => t.id === selectedTemplate).description}
                           </p>
                        }
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setSeedDialogOpen(false)}>Cancel</Button>
                        <Button onClick={loadRoadmapTemplate} disabled={!selectedTemplate}>Load Template</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>
                    This action will permanently delete all your data including projects, time logs, and settings.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={resetAllData} variant="destructive">
                    <Trash2 size={16} />
                    Reset All Data
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave}>
              <Save size={16} />
              Save Settings
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings; 