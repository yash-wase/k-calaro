import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import type { User } from '../App';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const userId = 'default_user';

  useEffect(() => {
    loadUser();
    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/user/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        setUsername(data.user.username);
        setDailyLimit(data.user.dailyLimitKcal.toString());
      }
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/user/${userId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: username.trim() })
        }
      );

      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        toast.success('Username updated successfully!');
      } else {
        toast.error('Failed to update username');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error('Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLimit = async () => {
    const limit = parseInt(dailyLimit);
    if (!limit || limit < 1) {
      toast.error('Please enter a valid calorie limit');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/user/${userId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ dailyLimitKcal: limit })
        }
      );

      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        toast.success('Daily limit updated successfully!');
      } else {
        toast.error('Failed to update daily limit');
      }
    } catch (error) {
      console.error('Error updating daily limit:', error);
      toast.error('Failed to update daily limit');
    } finally {
      setSaving(false);
    }
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setDarkMode(checked);
    localStorage.setItem('darkMode', checked.toString());
    
    if (checked) {
      document.documentElement.classList.add('dark');
      toast.success('Dark mode enabled');
    } else {
      document.documentElement.classList.remove('dark');
      toast.success('Light mode enabled');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className={darkMode ? 'text-white' : 'text-gray-900'}>Settings</h1>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
              Manage your account preferences
            </p>
          </div>
        </div>

        {/* Change Username Section */}
        <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <h2 className={darkMode ? 'text-white' : 'text-gray-900'}>Change Username</h2>
          <p className={`text-sm mt-1 mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Update your display name
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className={darkMode ? 'text-gray-300' : ''}>
                Current Username: <span className="font-semibold">{user?.username}</span>
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter new username"
                className={`rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              />
            </div>
            <Button
              onClick={handleUpdateUsername}
              disabled={saving}
              className="w-full rounded-lg bg-green-600 hover:bg-green-700"
            >
              {saving ? 'Updating...' : 'Update Username'}
            </Button>
          </div>
        </Card>

        {/* Light/Dark Mode Toggle Section */}
        <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <h2 className={darkMode ? 'text-white' : 'text-gray-900'}>Appearance</h2>
          <p className={`text-sm mt-1 mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Switch between light and dark mode
          </p>
          <div className="flex items-center justify-between p-4 rounded-lg bg-opacity-50" style={{ backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.5)' }}>
            <div>
              <Label htmlFor="dark-mode-toggle" className={darkMode ? 'text-gray-200' : 'text-gray-900'}>
                Dark Mode
              </Label>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {darkMode ? 'Currently enabled' : 'Currently disabled'}
              </p>
            </div>
            <Switch
              id="dark-mode-toggle"
              checked={darkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>
        </Card>

        {/* Set Daily Calorie Limit Section */}
        <Card className={`p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <h2 className={darkMode ? 'text-white' : 'text-gray-900'}>Daily Calorie Limit</h2>
          <p className={`text-sm mt-1 mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Set your daily calorie target
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="daily-limit" className={darkMode ? 'text-gray-300' : ''}>
                Current Limit: <span className="font-semibold">{user?.dailyLimitKcal} kcal</span>
              </Label>
              <Input
                id="daily-limit"
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                placeholder="2000"
                className={`rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              />
            </div>
            <Button
              onClick={handleUpdateLimit}
              disabled={saving}
              className="w-full rounded-lg bg-green-600 hover:bg-green-700"
            >
              {saving ? 'Updating...' : 'Update Daily Limit'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
