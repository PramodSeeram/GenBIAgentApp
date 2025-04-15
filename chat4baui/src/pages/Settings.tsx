import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AlertCircle, Check, Globe, Key, Shield, User, Users } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Separator } from '@/components/ui/separator';

const Settings = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [userSettings, setUserSettings] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    notifications: {
      email: true,
      pushNotifications: false,
      dataUpdates: true,
      marketingEmails: false
    }
  });
  
  const [apiSettings, setApiSettings] = useState({
    apiKeys: [
      { name: 'Development', key: 'dev_api_3f8d9c0b5a2e1f7d', created: '2023-04-12', lastUsed: '2 hours ago' },
      { name: 'Production', key: 'prod_api_7e2b4d8f6a9c3e5b', created: '2023-05-01', lastUsed: '3 days ago' },
    ],
    rateLimit: '1000',
    timeout: '30'
  });
  
  const handleSaveProfile = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('Profile settings saved successfully');
      setLoading(false);
    }, 1000);
  };
  
  const createApiKey = () => {
    setLoading(true);
    setTimeout(() => {
      const newKey = {
        name: 'New Key',
        key: `api_${Math.random().toString(36).substring(2, 15)}`,
        created: new Date().toISOString().split('T')[0],
        lastUsed: 'Never'
      };
      setApiSettings(prev => ({
        ...prev,
        apiKeys: [...prev.apiKeys, newKey]
      }));
      setLoading(false);
      toast.success('New API key created successfully');
    }, 1000);
  };

  const [apiKeys, setApiKeys] = useState({
    openai: '',
    perplexity: '',
    anthropic: '',
    googleAI: ''
  });

  const handleSaveApiKeys = () => {
    setLoading(true);
    // In a real app, these would be securely stored
    localStorage.setItem('api_keys', JSON.stringify(apiKeys));
    setTimeout(() => {
      toast.success('API keys saved successfully');
      setLoading(false);
    }, 1000);
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-4 md:inline-flex">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and how we can contact you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={userSettings.name} 
                      onChange={e => setUserSettings({...userSettings, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={userSettings.email} 
                      onChange={e => setUserSettings({...userSettings, email: e.target.value})} 
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive email updates about your account activity</p>
                      </div>
                      <Switch 
                        id="email-notifications" 
                        checked={userSettings.notifications.email} 
                        onCheckedChange={checked => setUserSettings({
                          ...userSettings, 
                          notifications: {...userSettings.notifications, email: checked}
                        })} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                      </div>
                      <Switch 
                        id="push-notifications" 
                        checked={userSettings.notifications.pushNotifications} 
                        onCheckedChange={checked => setUserSettings({
                          ...userSettings, 
                          notifications: {...userSettings.notifications, pushNotifications: checked}
                        })} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="data-updates" className="font-medium">Data Updates</Label>
                        <p className="text-sm text-muted-foreground">Get notified when your data sources are updated</p>
                      </div>
                      <Switch 
                        id="data-updates" 
                        checked={userSettings.notifications.dataUpdates} 
                        onCheckedChange={checked => setUserSettings({
                          ...userSettings, 
                          notifications: {...userSettings.notifications, dataUpdates: checked}
                        })} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="marketing-emails" className="font-medium">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">Receive emails about new features and promotions</p>
                      </div>
                      <Switch 
                        id="marketing-emails" 
                        checked={userSettings.notifications.marketingEmails} 
                        onCheckedChange={checked => setUserSettings({
                          ...userSettings, 
                          notifications: {...userSettings.notifications, marketingEmails: checked}
                        })} 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={loading}>
                  {loading ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4 mt-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys & Integrations
                </CardTitle>
                <CardDescription>
                  Manage your API keys for different language models and services.
                  Please note: Store your API keys securely and never share them.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai">OpenAI API Key</Label>
                    <Input
                      id="openai"
                      type="password"
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                      placeholder="sk-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="perplexity">Perplexity AI API Key</Label>
                    <Input
                      id="perplexity"
                      type="password"
                      value={apiKeys.perplexity}
                      onChange={(e) => setApiKeys({ ...apiKeys, perplexity: e.target.value })}
                      placeholder="pplx-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anthropic">Anthropic API Key</Label>
                    <Input
                      id="anthropic"
                      type="password"
                      value={apiKeys.anthropic}
                      onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                      placeholder="sk-ant-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="googleai">Google AI API Key</Label>
                    <Input
                      id="googleai"
                      type="password"
                      value={apiKeys.googleAI}
                      onChange={(e) => setApiKeys({ ...apiKeys, googleAI: e.target.value })}
                      placeholder="..."
                    />
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Security Notice</p>
                      <p className="text-muted-foreground">
                        API keys are stored locally in your browser. For better security,
                        consider using environment variables in a production environment.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveApiKeys} disabled={loading}>
                  {loading ? 'Saving...' : (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Save API Keys
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>
                  Manage your security settings and two-factor authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Password</Label>
                    <p className="text-sm text-muted-foreground">Change your password</p>
                  </div>
                  <Button variant="outline">Change</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 mt-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the appearance of the application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select defaultValue={theme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="density">Interface Density</Label>
                  <Select defaultValue="comfortable">
                    <SelectTrigger>
                      <SelectValue placeholder="Select density" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="spacious">Spacious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="animations" className="font-medium">Interface Animations</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable UI animations</p>
                  </div>
                  <Switch id="animations" defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => toast.success('Appearance settings saved')}>
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
