import { useState, useEffect, useCallback } from "react";
import { ContactsService, ApplicationContactsResponse } from "@/integrations/api/services/contactsService";

export const useApplicationContacts = (applicationId: string) => {
  const [contacts, setContacts] = useState<ApplicationContactsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!applicationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching contacts for application:', applicationId);
      const contactsData = await ContactsService.getApplicationContacts(applicationId);
      console.log('✅ Contacts loaded:', contactsData);
      setContacts(contactsData);
    } catch (err) {
      console.error('❌ Error fetching contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const refreshContacts = useCallback(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    loading,
    error,
    refreshContacts
  };
};
