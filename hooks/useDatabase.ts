import { useState, useEffect, useCallback } from 'react';
import { InspectionReport } from '../types';
import { getDatabase, DatabaseService } from '../services/database';

export function useDatabase() {
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<DatabaseService | null>(null);

  // Datenbank initialisieren und Berichte laden
  useEffect(() => {
    const initDb = async () => {
      try {
        const database = await getDatabase();
        setDb(database);
        const allReports = await database.getAllReports();
        setReports(allReports);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Datenbank');
        setLoading(false);
      }
    };

    initDb();
  }, []);

  // Bericht speichern oder aktualisieren
  const saveReport = useCallback(async (report: InspectionReport): Promise<void> => {
    if (!db) {
      setError('Datenbank nicht bereit');
      return;
    }

    try {
      const existingReport = await db.getReport(report.id);

      if (existingReport) {
        await db.updateReport(report);
      } else {
        await db.createReport(report);
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
  }, [db]);

  // Bericht löschen
  const deleteReport = useCallback(async (id: string): Promise<void> => {
    if (!db) {
      setError('Datenbank nicht bereit');
      return;
    }

    try {
      await db.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
      throw err;
    }
  }, [db]);

  // Einzelnen Bericht laden
  const getReport = useCallback(async (id: string): Promise<InspectionReport | null> => {
    if (!db) {
      setError('Datenbank nicht bereit');
      return null;
    }

    try {
      return await db.getReport(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
      return null;
    }
  }, [db]);

  // Berichte nach Status filtern
  const getReportsByStatus = useCallback(async (status: 'draft' | 'submitted'): Promise<InspectionReport[]> => {
    if (!db) {
      setError('Datenbank nicht bereit');
      return [];
    }

    try {
      return await db.getReportsByStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Filtern');
      return [];
    }
  }, [db]);

  // Alle Berichte neu laden
  const refreshReports = useCallback(async (): Promise<void> => {
    if (!db) {
      setError('Datenbank nicht bereit');
      return;
    }

    try {
      const allReports = await db.getAllReports();
      setReports(allReports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren');
    }
  }, [db]);

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
