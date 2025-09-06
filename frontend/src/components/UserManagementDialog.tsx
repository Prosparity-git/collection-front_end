
import { useState } from 'react';
import { Settings, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { client } from '@/integrations/api/client';
import { toast } from 'sonner';

const UserManagementDialog = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const createTestUser = async () => {
    setLoading(true);
    console.log('Creating test user for kanishk@prosparity.in');
    
    try {
      // First try to sign up the user
      const { data: signUpData, error: signUpError } = await client.auth.signUp({
        email: 'kanishk@prosparity.in',
        password: 'Kanishk@123',
        options: {
          data: {
            full_name: 'Kanishk',
          },
          emailRedirectTo: undefined,
        }
      });

      console.log('Test user creation response:', { signUpData, signUpError });

      if (signUpError && !signUpError.message.includes('User already registered')) {
        console.error('Error creating test user:', signUpError);
        toast.error(`Error creating test user: ${signUpError.message}`);
      } else {
        console.log('Test user created successfully or already exists');
        toast.success('Test user account is ready! You can now try signing in.');
      }
    } catch (error) {
      console.error('Unexpected error creating test user:', error);
      toast.error('An unexpected error occurred while creating test user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('Creating user with:', { email, fullName });

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: undefined,
        }
      });

      console.log('User creation response:', { data, error });

      if (error) {
        console.error('User creation error:', error);
        if (error.message.includes('User already registered')) {
          toast.error('User already exists with this email');
        } else {
          toast.error(error.message);
        }
      } else {
        console.log('User created successfully');
        toast.success('User created successfully! They can now sign in.');
        setEmail('');
        setPassword('');
        setFullName('');
        setOpen(false);
      }
    } catch (error) {
      console.error('Unexpected error creating user:', error);
      toast.error('An error occurred while creating the user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={createTestUser}
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Setup Test Account'}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will be able to log in with these credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementDialog;
