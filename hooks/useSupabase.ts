import { useState, useEffect, useCallback } from 'react';
import { InspectionReport } from '../types';
import { supabase } from '../lib/supabase';

// Typ für die Datenbank-Zeile (snake_case)
interface DbInspectionReport {
  id: string;
  created_at: number;
  employee_name: string;
  document: any;
  damages: any[];
  driver: any;
  status: 'draft' | 'submitted';
}

// Konvertierung von camelCase zu snake_case für Datenbank
function toDbFormat(report: InspectionReport): DbInspectionReport {
  return {
    id: report.id,
    created_at: report.createdAt,
    employee_name: report.employeeName,
    document: report.document,
    damages: report.damages,
    driver: report.driver,
    status: report.status
  };
}

// Konvertierung von snake_case zu camelCase für App
function fromDbFormat(dbReport: DbInspectionReport): InspectionReport {
  return {
    id: dbReport.id,
    createdAt: dbReport.created_at,
    employeeName: dbReport.employee_name,
    document: dbReport.document,
    damages: dbReport.damages,
    driver: dbReport.driver,
    status: dbReport.status
  };
}

export function useSupabase() {
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Alle Berichte beim Start laden
  useEffect(() => {
    const loadReports = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('inspection_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          setReports(data.map(fromDbFormat));
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Berichte');
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // Bericht speichern oder aktualisieren
  const saveReport = useCallback(async (report: InspectionReport): Promise<void> => {
    try {
      const dbReport = toDbFormat(report);

      // Prüfen ob Bericht bereits existiert
      const { data: existing } = await supabase
        .from('inspection_reports')
        .select('id')
        .eq('id', report.id)
        .single();

      if (existing) {
        // Update
        const { error: updateError } = await supabase
          .from('inspection_reports')
          .update(dbReport)
          .eq('id', report.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('inspection_reports')
          .insert([dbReport]);

        if (insertError) {
          throw insertError;
        }
      }

      // State aktualisieren
      setReports(prev => {
        const index = prev.findIndex(r => r.id === report.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = report;
          return updated;
        }
        return [report, ...prev];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
      throw err;
    }
  }, []);

  // Bericht löschen
  const deleteReport = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('inspection_reports')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
      throw err;
    }
  }, []);

  // Einzelnen Bericht laden
  const getReport = useCallback(async (id: string): Promise<InspectionReport | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('inspection_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return data ? fromDbFormat(data) : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
      return null;
    }
  }, []);

  // Berichte nach Status filtern
  const getReportsByStatus = useCallback(async (status: 'draft' | 'submitted'): Promise<InspectionReport[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('inspection_reports')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data ? data.map(fromDbFormat) : [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Filtern');
      return [];
    }
  }, []);

  // Alle Berichte neu laden
  const refreshReports = useCallback(async (): Promise<void> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('inspection_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setReports(data.map(fromDbFormat));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren');
    }
  }, []);

  return {
    reports,
    loading,
    error,
    saveReport,
    deleteReport,
    getReport,
    getReportsByStatus,
    refreshReports
  };
}
