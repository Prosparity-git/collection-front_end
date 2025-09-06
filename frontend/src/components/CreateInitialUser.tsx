
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { client } from '@/integrations/api/client';
import { toast } from 'sonner';

const CreateInitialUser = () => {
  const [loading, setLoading] = useState(false);

  const createInitialUser = async () => {
    setLoading(true);

    try {
      const { error } = await client.auth.admin.createUser({
        email: 'kanishk@prosparity.in',
        password: 'Kanishk@123',
        user_metadata: {
          full_name: 'Kanishk',
        },
        email_confirm: true,
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('User already exists with this email');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('User created successfully! You can now sign in.');
      }
    } catch (error) {
      toast.error('An error occurred while creating the user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center mb-6">
      <p className="text-sm text-gray-600 mb-4">
        Need to create the initial admin user?
      </p>
      <Button 
        onClick={createInitialUser} 
        disabled={loading}
        variant="outline"
        size="sm"
      >
        {loading ? 'Creating User...' : 'Create Admin User'}
      </Button>
    </div>
  );
};

export default CreateInitialUser;
