
import { useState, useEffect, useMemo } from "react";
import { client } from "@/integrations/api/client";

interface FilteredOptionsProps {
  teamLeads: string[];
  selectedTeamLead: string[];
}

export function useFilteredOptions({ teamLeads, selectedTeamLead }: FilteredOptionsProps) {
  const [dealersByTeamLead, setDealersByTeamLead] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  
  // Fetch dealers associated with team leads
  useEffect(() => {
    const fetchDealersByTeamLead = async () => {
      if (!teamLeads.length) return;
      
      setLoading(true);
      try {
        const { data, error } = await client
          .from('applications')
          .select('team_lead, dealer_name')
          .in('team_lead', teamLeads);

        if (error) {
          console.error('Error fetching dealer-team lead relationships:', error);
          return;
        }

        // Build mapping of team lead to dealers
        const mapping: Record<string, Set<string>> = {};
        data?.forEach(item => {
          if (!item.team_lead || !item.dealer_name) return;
          
          if (!mapping[item.team_lead]) {
            mapping[item.team_lead] = new Set();
          }
          mapping[item.team_lead].add(item.dealer_name);
        });

        // Convert sets to arrays
        const result: Record<string, string[]> = {};
        Object.entries(mapping).forEach(([teamLead, dealersSet]) => {
          result[teamLead] = Array.from(dealersSet);
        });

        setDealersByTeamLead(result);
      } catch (error) {
        console.error('Error in fetching dealer-team lead relationships:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealersByTeamLead();
  }, [teamLeads]);

  // Filter dealers based on selected team leads
  const filteredDealers = useMemo(() => {
    if (!selectedTeamLead.length) {
      // Return all dealers when no team lead is selected
      return Object.values(dealersByTeamLead).flat();
    }
    
    // Return dealers associated with selected team leads
    const selectedDealers = selectedTeamLead
      .flatMap(teamLead => dealersByTeamLead[teamLead] || [])
      // Remove duplicates
      .filter((dealer, index, self) => self.indexOf(dealer) === index);
    
    return selectedDealers;
  }, [dealersByTeamLead, selectedTeamLead]);

  return {
    dealersByTeamLead,
    filteredDealers,
    loading
  };
}
