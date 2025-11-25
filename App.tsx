import React, { useState, useEffect } from 'react';
import { AppStep, DamageRecord, DriverData, InspectionReport } from './types';
import CameraInput from './components/CameraInput';
import SignaturePad from './components/SignaturePad';
import { useDatabase } from './hooks/useDatabase';
import { generateReportPDF } from './services/pdfService';
import {
  Truck,
  FileText,
  AlertTriangle,
  PenTool,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Plus,
  Save,
  AlertOctagon,
  UserCheck,
  Sun,
  Moon,
  Eye,
  Edit,
  Download,
  Menu,
  X,
  Home
} from 'lucide-react';

const INITIAL_REPORT: InspectionReport = {
  id: '',
  createdAt: Date.now(),
  employeeName: '',
  document: null,
  damages: [],
  driver: null,
  status: 'draft'
};

const DAMAGE_TYPES = [
  "Verpackung beschädigt",
  "Kratzer",
  "Delle / Beule",
  "Riss / Bruch",
  "Nässe / Feuchtigkeit",
  "Verschmutzung",
  "Aufgerissen",
  "Gekippt / Umgefallen",
  "Fehlmenge",
  "Korrosion / Rost"
];

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.DASHBOARD);
  const [report, setReport] = useState<InspectionReport>(INITIAL_REPORT);

  // Datenbank Hook
  const { reports, loading, error, saveReport, deleteReport, getReport, getReportsByStatus } = useDatabase();

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply Theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Auto-save Entwürfe in Datenbank
  useEffect(() => {
    if (report.id && currentStep !== AppStep.DASHBOARD) {
      const timeoutId = setTimeout(async () => {
        try {
          await saveReport(report);
          console.log('Entwurf automatisch gespeichert');
        } catch (error) {
          console.error('Auto-save fehlgeschlagen:', error);
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [report, currentStep, saveReport]);

  // Helper component for Theme Toggle
  const ThemeToggle = () => (
    <button 
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent dark:border-slate-700"
      aria-label="Design wechseln"
      title={isDarkMode ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"}
    >
      {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );

  // --- Actions ---

  const startNewReport = () => {
    setReport({
      ...INITIAL_REPORT,
      id: `REP-${Math.floor(Math.random() * 100000)}`, // Längere ID
      createdAt: Date.now()
    });
    setCurrentStep(AppStep.SCAN_DOCUMENT);
  };

  const viewReport = async (reportId: string) => {
    const loadedReport = await getReport(reportId);
    if (loadedReport) {
      setReport(loadedReport);
      setCurrentStep(AppStep.VIEW_REPORT);
    }
  };

  const editReport = async (reportId: string) => {
    const loadedReport = await getReport(reportId);
    if (loadedReport) {
      setReport(loadedReport);
      setCurrentStep(AppStep.SCAN_DOCUMENT);
    }
  };

  const handleDocumentCapture = (dataUrl: string) => {
    // Direktes Speichern des Bildes ohne KI-Analyse
    setReport(prev => ({
      ...prev,
      document: {
        imageUrl: dataUrl,
        rawText: "",
        deliveryNumber: "",
        date: new Date().toISOString().split('T')[0],
        sender: "",
        recipient: ""
      }
    }));
  };

  const handleDamageCapture = (dataUrl: string, damageId?: string) => {
    if (damageId) {
      // Foto zu existierendem Schaden hinzufügen
      setReport(prev => ({
        ...prev,
        damages: prev.damages.map(dmg =>
          dmg.id === damageId
            ? { ...dmg, imageUrls: [...dmg.imageUrls, dataUrl] }
            : dmg
        )
      }));
    } else {
      // Neuer Schaden mit Standardwerten und erstem Foto
      const newDamage: DamageRecord = {
        id: Date.now().toString(),
        imageUrls: [dataUrl],
        description: "",
        severity: "Mittel",
        categories: [],
        timestamp: Date.now()
      };
      setReport(prev => ({
        ...prev,
        damages: [...prev.damages, newDamage]
      }));
    }
  };

  const removeDamage = (id: string) => {
    setReport(prev => ({
      ...prev,
      damages: prev.damages.filter(d => d.id !== id)
    }));
  };

  const updateDamage = (id: string, field: keyof DamageRecord, value: any) => {
    setReport(prev => ({
      ...prev,
      damages: prev.damages.map(d => d.id === id ? { ...d, [field]: value } : d)
    }));
  };

  const toggleDamageCategory = (id: string, category: string) => {
    setReport(prev => ({
      ...prev,
      damages: prev.damages.map(d => {
        if (d.id !== id) return d;
        const currentCategories = d.categories || [];
        const exists = currentCategories.includes(category);
        return {
          ...d,
          categories: exists 
            ? currentCategories.filter(c => c !== category)
            : [...currentCategories, category]
        };
      })
    }));
  };

  const handleSignatureEnd = (dataUrl: string) => {
    setReport(prev => ({
      ...prev,
      driver: {
        ...(prev.driver || { name: '', licensePlate: '', company: '', underReserve: false }),
        signatureDataUrl: dataUrl
      } as DriverData
    }));
  };

  const submitReport = async () => {
    console.log("Submitting Report:", report);
    const submittedReport = { ...report, status: 'submitted' as const };

    try {
      await saveReport(submittedReport);
      alert("Bericht erfolgreich in der Datenbank gespeichert!");
      setReport(INITIAL_REPORT);
      setCurrentStep(AppStep.DASHBOARD);
    } catch (error) {
      alert("Fehler beim Speichern: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  // --- Step Rendering ---

  const renderDashboard = () => (
    <div className="relative flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* Theme Toggle Button - Positioned absolutely for dashboard centering aesthetics */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="flex-none text-center p-8 space-y-6">
        <div className="inline-block mb-4">
          <img
            src="/avocarbon_logo.png"
            alt="AvoCarbon Logo"
            className="w-40 h-40 object-contain mx-auto"
          />
        </div>
        <h1 className="text-5xl font-extrabold text-slate-800 dark:text-white tracking-tight">CargoGuard Pro</h1>
        <p className="text-slate-500 dark:text-slate-400 text-2xl">Professionelle Dokumentation</p>
      </div>

      <div className="flex-none px-8 pb-6">
        <button
          type="button"
          onClick={startNewReport}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-6 px-10 rounded-2xl shadow-xl flex items-center justify-center gap-4 transition-transform active:scale-95 text-2xl"
        >
          <Plus className="w-10 h-10" />
          <span>Neuen Bericht starten</span>
        </button>
      </div>

      {/* Berichte Liste */}
      <div className="flex-1 overflow-y-auto px-8 pb-24 no-scrollbar">
        {reports.length > 0 ? (
          <div className="space-y-4 pb-6">
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-4 sticky top-0 bg-slate-50 dark:bg-slate-950 py-2 z-10">
              Gespeicherte Berichte ({reports.length})
            </h2>
            {reports.map((r) => (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="font-bold text-xl text-slate-800 dark:text-white">{r.id}</div>
                    <div className="text-base text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(r.createdAt).toLocaleString('de-DE')}
                    </div>
                    <div className="text-base text-slate-600 dark:text-slate-300 mt-2">
                      Mitarbeiter: {r.employeeName || 'Unbekannt'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-4 py-2 rounded-full text-base font-bold ${
                        r.status === 'submitted'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}
                    >
                      {r.status === 'submitted' ? 'Abgeschlossen' : 'Entwurf'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-slate-800">
                  <div className="text-base text-slate-500 dark:text-slate-400 font-medium">
                    Schäden: {r.damages.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => viewReport(r.id)}
                      className="text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 p-3 rounded-lg transition-colors flex items-center gap-2"
                      title="Bericht öffnen"
                      aria-label="Bericht öffnen"
                    >
                      <Eye className="w-6 h-6" />
                    </button>
                    {r.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => editReport(r.id)}
                        className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-3 rounded-lg transition-colors flex items-center gap-2"
                        title="Weiter bearbeiten"
                        aria-label="Weiter bearbeiten"
                      >
                        <Edit className="w-6 h-6" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Möchten Sie diesen Bericht wirklich löschen?')) {
                          await deleteReport(r.id);
                        }
                      }}
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-3 rounded-lg transition-colors"
                      title="Bericht löschen"
                      aria-label="Bericht löschen"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-400 dark:text-slate-500 py-12 text-xl">
            Noch keine Berichte vorhanden
          </div>
        )}
      </div>

      <div className="flex-none text-sm text-slate-400 dark:text-slate-500 text-center p-6 leading-relaxed">
        Durch die Nutzung bestätigen Sie die Einhaltung der Vorschriften gemäß HGB/CMR.
      </div>
    </div>
  );

  const renderScanDocument = () => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex-none p-4 bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 z-10 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <FileText className="text-brand-600 dark:text-brand-400" /> 1. Lieferschein
        </h2>
        <ThemeToggle />
      </div>

      <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
        {!report.document?.imageUrl ? (
          <div className="flex flex-col h-full justify-center space-y-6">
            <div className="text-center space-y-2">
               <p className="text-slate-600 dark:text-slate-300 text-xl font-medium">Lieferschein fotografieren</p>
               <p className="text-slate-400 dark:text-slate-500 text-sm">Bitte gesamtes Dokument erfassen</p>
            </div>
            <CameraInput onCapture={handleDocumentCapture} label="Foto aufnehmen" className="h-64" />
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
             {/* Bildvorschau */}
             <div className="relative h-56 w-full bg-slate-800 rounded-xl overflow-hidden shadow-md">
                <img src={report.document.imageUrl} alt="Scan" className="w-full h-full object-contain" />
                <button 
                  onClick={() => setReport(prev => ({...prev, document: null}))}
                  className="absolute bottom-3 right-3 bg-red-600 active:bg-red-700 text-white p-3 rounded-full shadow-lg"
                  title="Lieferschein löschen"
                  aria-label="Lieferschein löschen"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
             </div>
             
             {/* Eingabefelder */}
             <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
               <h3 className="font-bold text-slate-800 dark:text-white text-lg border-b dark:border-slate-800 pb-2 mb-2">Daten eingeben</h3>
               
               <div className="space-y-4">
                 <div>
                   <label className="text-sm text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider ml-1">Lieferschein Nr. *</label>
                   <input 
                     type="text" 
                     placeholder="Nummer eingeben"
                     value={report.document.deliveryNumber} 
                     onChange={(e) => setReport(prev => ({...prev, document: {...prev.document!, deliveryNumber: e.target.value}}))}
                     className="w-full p-5 text-xl border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                   />
                 </div>
                 
                 <div>
                   <label className="text-sm text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider ml-1">Datum</label>
                   <input 
                     type="date" 
                     value={report.document.date} 
                     onChange={(e) => setReport(prev => ({...prev, document: {...prev.document!, date: e.target.value}}))}
                     className="w-full p-5 text-xl border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand-500 outline-none"
                     title="Lieferdatum auswählen"
                     placeholder="Datum auswählen"
                   />
                 </div>

                 <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider ml-1">Absender</label>
                      <input 
                        type="text" 
                        placeholder="Firma / Ort"
                        value={report.document.sender} 
                        onChange={(e) => setReport(prev => ({...prev, document: {...prev.document!, sender: e.target.value}}))}
                        className="w-full p-5 text-xl border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider ml-1">Empfänger</label>
                      <input 
                        type="text" 
                        placeholder="Firma / Ort"
                        value={report.document.recipient} 
                        onChange={(e) => setReport(prev => ({...prev, document: {...prev.document!, recipient: e.target.value}}))}
                        className="w-full p-5 text-xl border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                 </div>
               </div>
             </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex justify-between items-center z-50 safe-area-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
        <button
          type="button"
          onClick={() => setCurrentStep(AppStep.DASHBOARD)}
          className="text-slate-500 dark:text-slate-400 font-bold px-8 py-5 text-xl"
        >
          Abbruch
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(AppStep.DAMAGE_LOG)}
          disabled={!report.document}
          className="bg-brand-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white px-12 py-6 rounded-2xl font-bold text-2xl flex items-center gap-3 shadow-xl transition-all"
        >
          Weiter <ChevronRight className="w-10 h-10" />
        </button>
      </div>
    </div>
  );

  const renderDamageLog = () => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex-none p-4 bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 z-10 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <AlertTriangle className="text-orange-500" /> 2. Schäden
        </h2>
        <ThemeToggle />
      </div>

      <div className="flex-1 p-4 overflow-y-auto no-scrollbar pb-24">
        {/* Foto Button */}
        <div className="mb-6">
          <CameraInput
            onCapture={handleDamageCapture}
            label="Neuen Schaden fotografieren"
            className="mb-4"
          />
          {report.damages.length === 0 && (
            <p className="text-center text-slate-400 dark:text-slate-500 text-sm">Tippen Sie oben, um ein Foto hinzuzufügen.</p>
          )}
        </div>

        {/* Liste der Schäden */}
        <div className="space-y-6">
          {report.damages.map((dmg, idx) => (
            <div key={dmg.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Bildergalerie für mehrere Fotos */}
              <div className="relative bg-slate-100 dark:bg-slate-800">
                <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory">
                  {dmg.imageUrls.map((imgUrl, imgIdx) => (
                    <div key={imgIdx} className="relative min-w-full h-48 snap-center">
                      <img src={imgUrl} alt={`Schaden ${idx + 1} Foto ${imgIdx + 1}`} className="w-full h-full object-cover" />
                      {dmg.imageUrls.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-slate-900/70 text-white px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                          {imgIdx + 1}/{dmg.imageUrls.length}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="absolute top-2 left-2 bg-slate-900/70 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                  Schaden #{idx + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeDamage(dmg.id)}
                  className="absolute top-2 right-2 bg-red-600 active:bg-red-700 text-white p-2 rounded-full shadow-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                {/* Button um weitere Fotos hinzuzufügen */}
                <CameraInput
                  onCapture={(dataUrl) => handleDamageCapture(dataUrl, dmg.id)}
                  label="Weiteres Foto hinzufügen"
                  className="mb-2"
                />

                <div className="flex flex-col">
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Schweregrad</label>
                   <select 
                    value={dmg.severity}
                    onChange={(e) => updateDamage(dmg.id, 'severity', e.target.value)}
                    title="Schweregrad des Schadens auswählen"
                    className={`w-full p-3 text-base border-2 rounded-lg font-bold outline-none appearance-none ${
                      dmg.severity === 'Schwer' ? 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-900 dark:text-red-300' : 
                      dmg.severity === 'Mittel' ? 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-900 dark:text-orange-300' : 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-900 dark:text-green-300'
                    }`}
                   >
                     <option value="Gering">Gering</option>
                     <option value="Mittel">Mittel</option>
                     <option value="Schwer">Schwer</option>
                   </select>
                </div>
                 
                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Schadensart (Mehrfachauswahl)</label>
                   <div className="grid grid-cols-2 gap-2">
                     {DAMAGE_TYPES.map(type => {
                       const isSelected = dmg.categories.includes(type);
                       return (
                         <button
                           key={type}
                           onClick={() => toggleDamageCategory(dmg.id, type)}
                           className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                             isSelected 
                               ? 'bg-brand-100 border-brand-500 text-brand-700 dark:bg-brand-900/40 dark:border-brand-500 dark:text-brand-300 shadow-sm' 
                               : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                           }`}
                         >
                           {type}
                         </button>
                       );
                     })}
                   </div>
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Beschreibung (Optional)</label>
                   <textarea 
                    value={dmg.description}
                    onChange={(e) => updateDamage(dmg.id, 'description', e.target.value)}
                    placeholder="Weitere Details..."
                    className="w-full p-3 text-base border border-slate-300 dark:border-slate-700 rounded-lg min-h-[80px] bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                   />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex justify-between items-center z-50 safe-area-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
        <button
          type="button"
          onClick={() => setCurrentStep(AppStep.SCAN_DOCUMENT)}
          className="flex items-center text-slate-600 dark:text-slate-400 font-bold px-6 py-5 text-xl"
        >
          <ChevronLeft className="w-9 h-9 mr-2" /> Zurück
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(AppStep.DRIVER_SIGNATURE)}
          className="bg-brand-600 text-white px-12 py-6 rounded-2xl font-bold text-2xl flex items-center gap-3 shadow-xl"
        >
          Weiter <ChevronRight className="w-10 h-10" />
        </button>
      </div>
    </div>
  );

  const renderSignature = () => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex-none p-4 bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 z-10 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <PenTool className="text-brand-600 dark:text-brand-400" /> 3. Abschluss
        </h2>
        <ThemeToggle />
      </div>

      <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
        
        {/* Vorbehalt Section */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 p-5 rounded-xl shadow-sm mb-6">
          <label className="flex items-center gap-4 cursor-pointer">
             <div className="relative flex items-center">
               <input 
                 type="checkbox" 
                 checked={report.driver?.underReserve || false}
                 onChange={(e) => setReport(prev => ({...prev, driver: {...(prev.driver || {} as any), underReserve: e.target.checked}}))}
                 className="w-7 h-7 text-brand-600 rounded-lg focus:ring-brand-500 border-gray-300"
               />
             </div>
             <div className="flex-1">
                <div className="font-bold text-slate-800 dark:text-yellow-100 text-lg">Annahme unter Vorbehalt</div>
                <div className="text-slate-500 dark:text-yellow-200/70 text-xs leading-tight mt-0.5">Pauschaler Vermerk ohne Angabe von Gründen</div>
             </div>
          </label>
        </div>

        {/* Mitarbeiter WE Section */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 mb-6">
           <h3 className="font-bold text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2 flex items-center gap-2">
             <UserCheck className="w-5 h-5 text-brand-500" />
             Interner Prüfer
           </h3>
           <div>
              <label className="text-sm text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider ml-1">Mitarbeiter Wareneingang *</label>
              <input 
                type="text"
                value={report.employeeName}
                onChange={(e) => setReport(prev => ({...prev, employeeName: e.target.value}))}
                className="w-full p-5 text-xl border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Ihr Name"
              />
            </div>
        </div>

        {/* Fahrer Daten Section */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 mb-6">
          <h3 className="font-bold text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2 flex items-center gap-2">
             <Truck className="w-5 h-5 text-brand-500" />
             Fahrer
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider ml-1">Name des Fahrers *</label>
              <input 
                type="text"
                value={report.driver?.name || ''}
                onChange={(e) => setReport(prev => ({...prev, driver: {...(prev.driver || {} as any), name: e.target.value}}))}
                className="w-full p-5 text-xl border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Name eingeben"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <div>
                <label className="text-sm text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider ml-1">Kennzeichen *</label>
                <input 
                  type="text"
                  value={report.driver?.licensePlate || ''}
                  onChange={(e) => setReport(prev => ({...prev, driver: {...(prev.driver || {} as any), licensePlate: e.target.value}}))}
                  className="w-full p-5 text-xl border border-slate-300 dark:border-slate-700 rounded-lg uppercase font-mono bg-slate-50 dark:bg-slate-800 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="K-ZZ 123"
                />
              </div>
              <div>
                <label className="text-sm text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider ml-1">Firma / Spedition</label>
                <input 
                  type="text"
                  value={report.driver?.company || ''}
                  onChange={(e) => setReport(prev => ({...prev, driver: {...(prev.driver || {} as any), company: e.target.value}}))}
                  className="w-full p-5 text-xl border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="Spedition Müller"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Unterschrift des Fahrers *</label>
          <SignaturePad 
            onEnd={handleSignatureEnd} 
            onClear={() => setReport(prev => ({...prev, driver: {...prev.driver!, signatureDataUrl: ''}}))}
          />
          <p className="text-xs text-slate-400 mt-2 text-right">Bitte im Feld unterschreiben</p>
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-xl text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
          <strong>Bestätigung:</strong> Ich bestätige hiermit die Richtigkeit der Angaben. Die Ladungssicherung und der Zustand wurden überprüft.
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex justify-between items-center z-50 safe-area-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
        <button
          type="button"
          onClick={() => setCurrentStep(AppStep.DAMAGE_LOG)}
          className="flex items-center text-slate-600 dark:text-slate-400 font-bold px-6 py-5 text-xl"
        >
          <ChevronLeft className="w-9 h-9 mr-2" /> Zurück
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(AppStep.SUMMARY)}
          disabled={!report.driver?.signatureDataUrl || !report.driver?.name || !report.employeeName}
          className="bg-brand-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white px-12 py-6 rounded-2xl font-bold text-2xl flex items-center gap-3 shadow-xl"
        >
          Fertig <CheckCircle2 className="w-8 h-8" />
        </button>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex-none p-4 bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 z-10 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <CheckCircle2 className="text-brand-600 dark:text-brand-400" /> Zusammenfassung
        </h2>
        <ThemeToggle />
      </div>

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-32">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto mb-8 border dark:border-slate-800">
          <div className="bg-slate-800 dark:bg-slate-950 text-white p-6 border-b border-slate-700">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold">Protokoll</h2>
                <span className="bg-white/20 px-3 py-1 rounded text-sm font-mono">{report.id}</span>
            </div>
            <p className="text-slate-400 text-sm">{new Date(report.createdAt).toLocaleString('de-DE')}</p>
          </div>

          <div className="p-6 space-y-8">
            {/* Warning Banner if Under Reserve */}
            {report.driver?.underReserve && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg shadow-sm">
                <div className="flex items-start">
                  <AlertOctagon className="h-6 w-6 text-yellow-600 dark:text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-400 uppercase tracking-wide text-sm">Annahme unter Vorbehalt</h3>
                    <p className="mt-1 text-yellow-900 dark:text-yellow-200 font-medium">Pauschaler Vorbehalt vermerkt.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Lieferschein */}
            <section>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">Lieferschein</h3>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-y-4 text-slate-900 dark:text-white">
                    <div>
                        <span className="text-xs text-slate-400 block uppercase">Nummer</span>
                        <span className="font-semibold text-lg">{report.document?.deliveryNumber || '-'}</span>
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block uppercase">Datum</span>
                        <span className="font-semibold text-lg">{report.document?.date || '-'}</span>
                    </div>
                </div>
              </div>
            </section>

            {/* Schäden */}
            <section>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
                  Schäden <span className="text-slate-300 ml-1">({report.damages.length})</span>
              </h3>
              {report.damages.length === 0 ? (
                <div className="text-slate-400 italic py-2">Keine Schäden verzeichnet.</div>
              ) : (
                <div className="space-y-4">
                  {report.damages.map((dmg, i) => (
                    <div key={i} className="flex gap-4 border border-slate-200 dark:border-slate-700 p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                      <div className="flex gap-2 flex-shrink-0">
                        {dmg.imageUrls.slice(0, 3).map((imgUrl, idx) => (
                          <img key={idx} src={imgUrl} className="w-20 h-20 object-cover rounded-lg bg-slate-100 dark:bg-slate-900" alt={`Schaden ${i + 1} Foto ${idx + 1}`} />
                        ))}
                        {dmg.imageUrls.length > 3 && (
                          <div className="w-20 h-20 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-bold text-sm">
                            +{dmg.imageUrls.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${
                            dmg.severity === 'Schwer' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 
                            dmg.severity === 'Mittel' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                          }`}>{dmg.severity}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {dmg.categories && dmg.categories.length > 0 ? dmg.categories.join(", ") : "Keine Kategorie"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-3">{dmg.description || "Keine Beschreibung"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Unterschrift & Beteiligte */}
            <section className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 break-inside-avoid">
               <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4">Bestätigung & Beteiligte</h3>
               
               <div className="grid grid-cols-1 gap-2 mb-6 text-slate-900 dark:text-white">
                 <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                   <span className="text-slate-500 dark:text-slate-400">Wareneingang</span>
                   <span className="font-bold">{report.employeeName}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                   <span className="text-slate-500 dark:text-slate-400">Fahrer</span>
                   <span className="font-bold">{report.driver?.name}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                   <span className="text-slate-500 dark:text-slate-400">Kennzeichen</span>
                   <span className="font-bold font-mono">{report.driver?.licensePlate}</span>
                 </div>
               </div>

               {report.driver?.signatureDataUrl && (
                 <div className="mt-4">
                   <span className="text-xs text-slate-400 block mb-2 uppercase tracking-wider">Unterschrift Fahrer</span>
                   {/* Unterschrift bleibt dunkel auf hell/transparent für Kontrast, hier auf weissem Container */}
                   <div className="bg-white rounded p-2">
                      <img src={report.driver.signatureDataUrl} alt="Unterschrift" className="h-24 object-contain mix-blend-multiply w-full" />
                   </div>
                 </div>
               )}
            </section>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex flex-col gap-4 z-50 safe-area-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setCurrentStep(AppStep.DRIVER_SIGNATURE)}
            className="flex-1 bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-6 px-6 rounded-2xl transition-colors text-xl"
          >
            Bearbeiten
          </button>
          <button
            type="button"
            onClick={submitReport}
            className="flex-[2] bg-brand-600 active:bg-brand-700 text-white font-bold py-6 px-6 rounded-2xl flex justify-center items-center gap-3 shadow-xl transition-colors text-xl"
          >
            <Save className="w-8 h-8" />
            Speichern
          </button>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              await generateReportPDF(report);
              alert('PDF erfolgreich erstellt!');
            } catch (error) {
              alert('Fehler beim PDF-Export: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
            }
          }}
          className="w-full bg-green-600 active:bg-green-700 text-white font-bold py-6 px-6 rounded-2xl flex justify-center items-center gap-3 shadow-xl transition-colors text-xl"
        >
          <Download className="w-8 h-8" />
          Als PDF herunterladen
        </button>
      </div>
    </div>
  );

  const renderViewReport = () => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex-none p-4 bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 z-10 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <Eye className="text-brand-600 dark:text-brand-400" /> Bericht ansehen
        </h2>
        <ThemeToggle />
      </div>

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar pb-32">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto mb-8 border dark:border-slate-800">
          <div className="bg-slate-800 dark:bg-slate-950 text-white p-6 border-b border-slate-700">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold">Protokoll</h2>
                <span className={`px-4 py-2 rounded-full text-base font-bold ${
                  report.status === 'submitted'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {report.status === 'submitted' ? 'Abgeschlossen' : 'Entwurf'}
                </span>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-slate-400 text-sm">{new Date(report.createdAt).toLocaleString('de-DE')}</p>
              <span className="bg-white/20 px-3 py-1 rounded text-sm font-mono">{report.id}</span>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Warning Banner if Under Reserve */}
            {report.driver?.underReserve && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg shadow-sm">
                <div className="flex items-start">
                  <AlertOctagon className="h-6 w-6 text-yellow-600 dark:text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-400 uppercase tracking-wide text-sm">Annahme unter Vorbehalt</h3>
                    <p className="mt-1 text-yellow-900 dark:text-yellow-200 font-medium">Pauschaler Vorbehalt vermerkt.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Lieferschein */}
            <section>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">Lieferschein</h3>
              {report.document?.imageUrl && (
                <div className="mb-4">
                  <img src={report.document.imageUrl} className="w-full max-h-64 object-contain rounded-xl bg-slate-100 dark:bg-slate-800 p-2" alt="Lieferschein" />
                </div>
              )}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-y-4 text-slate-900 dark:text-white">
                    <div>
                        <span className="text-xs text-slate-400 block uppercase">Nummer</span>
                        <span className="font-semibold text-lg">{report.document?.deliveryNumber || '-'}</span>
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block uppercase">Datum</span>
                        <span className="font-semibold text-lg">{report.document?.date || '-'}</span>
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block uppercase">Absender</span>
                        <span className="font-semibold text-base">{report.document?.sender || '-'}</span>
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block uppercase">Empfänger</span>
                        <span className="font-semibold text-base">{report.document?.recipient || '-'}</span>
                    </div>
                </div>
              </div>
            </section>

            {/* Schäden */}
            <section>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
                  Schäden <span className="text-slate-300 ml-1">({report.damages.length})</span>
              </h3>
              {report.damages.length === 0 ? (
                <div className="text-slate-400 italic py-2">Keine Schäden verzeichnet.</div>
              ) : (
                <div className="space-y-4">
                  {report.damages.map((dmg, i) => (
                    <div key={i} className="border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                      {/* Bildergalerie */}
                      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                        {dmg.imageUrls.map((imgUrl, idx) => (
                          <img key={idx} src={imgUrl} className="w-32 h-32 object-cover rounded-lg bg-slate-100 dark:bg-slate-900 flex-shrink-0" alt={`Schaden ${i + 1} Foto ${idx + 1}`} />
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${
                            dmg.severity === 'Schwer' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                            dmg.severity === 'Mittel' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                          }`}>{dmg.severity}</span>
                        </div>
                        {dmg.categories && dmg.categories.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1">
                            {dmg.categories.map((cat, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-slate-800 dark:text-slate-200">{dmg.description || "Keine Beschreibung"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Unterschrift & Beteiligte */}
            <section className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 break-inside-avoid">
               <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4">Bestätigung & Beteiligte</h3>

               <div className="grid grid-cols-1 gap-2 mb-6 text-slate-900 dark:text-white">
                 <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                   <span className="text-slate-500 dark:text-slate-400">Wareneingang</span>
                   <span className="font-bold">{report.employeeName}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                   <span className="text-slate-500 dark:text-slate-400">Fahrer</span>
                   <span className="font-bold">{report.driver?.name}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                   <span className="text-slate-500 dark:text-slate-400">Kennzeichen</span>
                   <span className="font-bold font-mono">{report.driver?.licensePlate}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                   <span className="text-slate-500 dark:text-slate-400">Spedition</span>
                   <span className="font-bold">{report.driver?.company || '-'}</span>
                 </div>
               </div>

               {report.driver?.signatureDataUrl && (
                 <div className="mt-4">
                   <span className="text-xs text-slate-400 block mb-2 uppercase tracking-wider">Unterschrift Fahrer</span>
                   <div className="bg-white rounded p-2">
                      <img src={report.driver.signatureDataUrl} alt="Unterschrift" className="h-24 object-contain mix-blend-multiply w-full" />
                   </div>
                 </div>
               )}
            </section>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex flex-col gap-4 z-50 safe-area-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setCurrentStep(AppStep.DASHBOARD)}
            className="flex-1 bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-6 px-6 text-xl rounded-2xl transition-colors flex items-center justify-center gap-3"
          >
            <ChevronLeft className="w-9 h-9" />
            Zurück
          </button>
          {report.status === 'draft' && (
            <button
              type="button"
              onClick={() => editReport(report.id)}
              className="flex-[2] bg-brand-600 active:bg-brand-700 text-white font-bold py-6 px-6 text-xl rounded-2xl flex justify-center items-center gap-3 shadow-xl transition-colors"
            >
              <Edit className="w-8 h-8" />
              Weiter bearbeiten
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              await generateReportPDF(report);
              alert('PDF erfolgreich erstellt!');
            } catch (error) {
              alert('Fehler beim PDF-Export: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
            }
          }}
          className="w-full bg-green-600 active:bg-green-700 text-white font-bold py-6 px-6 rounded-2xl flex justify-center items-center gap-3 shadow-xl transition-colors text-xl"
        >
          <Download className="w-8 h-8" />
          Als PDF herunterladen
        </button>
      </div>
    </div>
  );

  // Ladebildschirm während Datenbank initialisiert
  if (loading) {
    return (
      <div className="h-full w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <img
            src="/avocarbon_logo.png"
            alt="AvoCarbon Logo"
            className="w-24 h-24 object-contain mx-auto animate-pulse"
          />
          <p className="text-slate-600 dark:text-slate-400 text-lg">Datenbank wird geladen...</p>
        </div>
      </div>
    );
  }

  // Fehlerbildschirm falls Datenbank nicht geladen werden kann
  if (error) {
    return (
      <div className="h-full w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <AlertOctagon className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Fehler beim Laden</h2>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl"
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {currentStep === AppStep.DASHBOARD && renderDashboard()}
      {currentStep === AppStep.VIEW_REPORT && renderViewReport()}
      {currentStep === AppStep.SCAN_DOCUMENT && renderScanDocument()}
      {currentStep === AppStep.DAMAGE_LOG && renderDamageLog()}
      {currentStep === AppStep.DRIVER_SIGNATURE && renderSignature()}
      {currentStep === AppStep.SUMMARY && renderSummary()}
    </div>
  );
};

export default App;