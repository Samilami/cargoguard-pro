import localforage from 'localforage';
import { InspectionReport } from '../types';

// IndexedDB Konfiguration
const reportsStore = localforage.createInstance({
  name: 'CargoGuard',
  storeName: 'inspection_reports'
});

class DatabaseService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // IndexedDB ist sofort verfügbar, keine Initialisierung nötig
      this.initialized = true;
      console.log('Datenbank erfolgreich initialisiert (IndexedDB)');
    } catch (error) {
      console.error('Fehler bei der Datenbankinitialisierung:', error);
      throw new Error('Datenbank konnte nicht initialisiert werden');
    }
  }

  // Bericht erstellen oder aktualisieren
  async saveReport(report: InspectionReport): Promise<void> {
    try {
      await reportsStore.setItem(report.id, report);
      console.log('Bericht gespeichert:', report.id);
    } catch (error) {
      console.error('Fehler beim Speichern des Berichts:', error);
      throw new Error('Bericht konnte nicht gespeichert werden');
    }
  }

  // Bericht erstellen (Alias für saveReport)
  async createReport(report: InspectionReport): Promise<void> {
    return this.saveReport(report);
  }

  // Bericht aktualisieren (Alias für saveReport)
  async updateReport(report: InspectionReport): Promise<void> {
    return this.saveReport(report);
  }

  // Einzelnen Bericht abrufen
  async getReport(id: string): Promise<InspectionReport | null> {
    try {
      const report = await reportsStore.getItem<InspectionReport>(id);
      return report;
    } catch (error) {
      console.error('Fehler beim Laden des Berichts:', error);
      return null;
    }
  }

  // Alle Berichte abrufen
  async getAllReports(): Promise<InspectionReport[]> {
    try {
      const reports: InspectionReport[] = [];
      await reportsStore.iterate<InspectionReport, void>((value) => {
        reports.push(value);
      });

      // Nach Erstellungsdatum sortieren (neueste zuerst)
      return reports.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Fehler beim Laden der Berichte:', error);
      return [];
    }
  }

  // Berichte nach Status filtern
  async getReportsByStatus(status: 'draft' | 'submitted'): Promise<InspectionReport[]> {
    try {
      const allReports = await this.getAllReports();
      return allReports.filter(r => r.status === status);
    } catch (error) {
      console.error('Fehler beim Filtern der Berichte:', error);
      return [];
    }
  }

  // Bericht löschen
  async deleteReport(id: string): Promise<void> {
    try {
      await reportsStore.removeItem(id);
      console.log('Bericht gelöscht:', id);
    } catch (error) {
      console.error('Fehler beim Löschen des Berichts:', error);
      throw new Error('Bericht konnte nicht gelöscht werden');
    }
  }

  // Alle Berichte löschen
  async clearAllReports(): Promise<void> {
    try {
      await reportsStore.clear();
      console.log('Alle Berichte gelöscht');
    } catch (error) {
      console.error('Fehler beim Löschen aller Berichte:', error);
      throw new Error('Berichte konnten nicht gelöscht werden');
    }
  }

  // Anzahl der Berichte
  async getReportsCount(): Promise<number> {
    try {
      return await reportsStore.length();
    } catch (error) {
      console.error('Fehler beim Zählen der Berichte:', error);
      return 0;
    }
  }

  // Datenbank exportieren (als JSON)
  async exportDatabase(): Promise<string> {
    try {
      const reports = await this.getAllReports();
      return JSON.stringify(reports, null, 2);
    } catch (error) {
      console.error('Fehler beim Exportieren:', error);
      throw new Error('Datenbank konnte nicht exportiert werden');
    }
  }

  // Datenbank importieren (aus JSON)
  async importDatabase(jsonData: string): Promise<number> {
    try {
      const reports: InspectionReport[] = JSON.parse(jsonData);
      let imported = 0;

      for (const report of reports) {
        await this.saveReport(report);
        imported++;
      }

      console.log(`${imported} Berichte importiert`);
      return imported;
    } catch (error) {
      console.error('Fehler beim Importieren:', error);
      throw new Error('Datenbank konnte nicht importiert werden');
    }
  }
}

// Singleton-Instanz
let dbInstance: DatabaseService | null = null;

export const getDatabase = async (): Promise<DatabaseService> => {
  if (!dbInstance) {
    dbInstance = new DatabaseService();
    await dbInstance.initialize();
  }
  return dbInstance;
};

export { DatabaseService };
