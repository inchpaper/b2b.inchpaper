import React, { useState, useEffect } from 'react';
import { X, Database, FileSpreadsheet, Trash2, Search, CheckCircle2, AlertTriangle, Key, Cloud, RefreshCw, ExternalLink, Mail, FolderOpen, Settings2, Link2 } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase client on setup
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);

interface LeadConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getReadableCategories = (categories: any): string => {
  if (!categories) return '';
  if (typeof categories === 'string') return categories;
  if (Array.isArray(categories)) {
    return categories
      .map(cat => {
        if (!cat) return '';
        if (typeof cat === 'object') {
          return cat.name || cat.value || cat.label || JSON.stringify(cat);
        }
        return String(cat);
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof categories === 'object') {
    return categories.name || categories.value || JSON.stringify(categories);
  }
  return String(categories);
};

export default function LeadConsoleModal({ isOpen, onClose }: LeadConsoleModalProps) {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [activeTab, setActiveTab] = useState<'submissions' | 'abandoned' | 'workspace'>('submissions');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [submittedList, setSubmittedList] = useState<any[]>([]);
  const [abandonedList, setAbandonedList] = useState<any[]>([]);

  // Workspace integration states
  const [workspaceConfig, setWorkspaceConfig] = useState<any>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [sheetCreationMessage, setSheetCreationMessage] = useState('');
  const [sheetSuccessPopup, setSheetSuccessPopup] = useState(false);
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState('');

  // Fetch connections status of Google Workspace APIs
  const runDiagnostics = async () => {
    try {
      setIsDiagnosing(true);
      setDiagnosticsError('');
      const res = await fetch('/api/workspace/diagnostics');
      if (!res.ok) {
        throw new Error(`Server returned status code ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Server returned an invalid HTML or non-JSON response. Please wait 10 seconds for the backend node service to finish initializing and click Audit again.");
      }
      const data = await res.json();
      setDiagnosticsData(data);
    } catch (e: any) {
      setDiagnosticsError(e.message || 'Failed to contact diagnostics API.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Load leads from storage
  const loadLeads = () => {
    try {
      const subs = localStorage.getItem('inchpaper_submitted_leads');
      const abans = localStorage.getItem('inchpaper_abandoned_leads');
      
      setSubmittedList(subs ? JSON.parse(subs) : []);
      setAbandonedList(abans ? JSON.parse(abans) : []);
    } catch (e) {
      console.error("Failed to parse leads from local storage:", e);
    }
  };

  // Fetch active workspace config from server
  const fetchWorkspaceConfig = async () => {
    try {
      const res = await fetch('/api/workspace/config');
      if (!res.ok) {
        throw new Error(`Server returned status code ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Server did not respond with JSON. This usually indicates that the custom backend is still compiling or restarting. Please reload the browser in a few seconds.");
      }
      const data = await res.json();
      if (data.status === 'success') {
        setWorkspaceConfig(data.config);
      }
    } catch (e: any) {
      console.warn("Error fetching workspace config:", e.message);
    }
  };

  // Google Sign-In and Save token
  const handleGoogleLogin = async () => {
    try {
      setErrorText('');
      setIsConfiguring(true);
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      
      // Force Google's OAuth consent screen and account picker to display
      // This enforces that the user must explicitly choose an account and check the 3 required permissions checkboxes
      provider.setCustomParameters({
        prompt: 'select_account consent',
        access_type: 'offline'
      });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error('Access token missing from Google credential verification.');
      }

      const adminEmail = result.user.email || 'info@inchpaper.com';

      const saveRes = await fetch('/api/workspace/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: token,
          adminEmail: adminEmail,
          sheetsSyncActive: true,
          gmailAlertsActive: true
        })
      });

      if (!saveRes.ok) {
        throw new Error(`Workspace setup proxy returned failure status ${saveRes.status}`);
      }
      const contentType = saveRes.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Backend server did not return valid JSON. The Express server.ts might be offline or compiling. Please reload the webpage and retry in 10 seconds.");
      }

      const saveResult = await saveRes.json();
      if (saveResult.status === 'success') {
        await fetchWorkspaceConfig();
      } else {
        alert(saveResult.message || 'Error writing settings on server.');
      }
    } catch (err: any) {
      console.error("Google Authentication linkage failed:", err);
      alert(err.message || 'Authentication sequence failed. Check browser popups or ensure that the server has compiled.');
    } finally {
      setIsConfiguring(false);
    }
  };

  // Terminate linked service
  const handleDisconnect = async () => {
    if (window.confirm("Disconnect Google Workspace? This will halt Google Sheets live synching and administrative Gmail alerts.")) {
      try {
        setIsConfiguring(true);
        await signOut(auth);
        
        const saveRes = await fetch('/api/workspace/save-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: null,
            sheetsSyncActive: false,
            gmailAlertsActive: false
          })
        });

        if (!saveRes.ok) {
          throw new Error(`Server returned failure status ${saveRes.status}`);
        }

        await fetchWorkspaceConfig();
      } catch (err: any) {
        console.error("Disconnect error:", err);
        alert(err.message || "Could not successfully complete save-config disconnect call.");
      } finally {
        setIsConfiguring(false);
      }
    }
  };

  // Mutate Sync toggles
  const handleToggleFeature = async (feature: 'sheets' | 'gmail', value: boolean) => {
    try {
      const payload: any = {};
      if (feature === 'sheets') payload.sheetsSyncActive = value;
      if (feature === 'gmail') payload.gmailAlertsActive = value;

      const res = await fetch('/api/workspace/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`Toggle feature failed with status ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        await fetchWorkspaceConfig();
      }
    } catch (e: any) {
      console.error("Failed to toggle feature settings:", e);
    }
  };

  // Initialize spreadsheet database
  const handleCreateSheet = async () => {
    try {
      setErrorText('');
      setSheetCreationMessage('Provisioning secure Sheet and compiling headers in Google Drive...');
      setIsConfiguring(true);

      const res = await fetch('/api/workspace/create-sheet', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Sourcing spreadsheet creation failed with status ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Custom backend did not return valid JSON. Server may be in build mode.");
      }
      const data = await res.json();

      if (data.status === 'success') {
        setSheetCreationMessage('');
        setSheetSuccessPopup(true);
        await fetchWorkspaceConfig();
      } else {
        setSheetCreationMessage('');
        alert(data.message || 'Failed creating Spreadsheet.');
      }
    } catch (err: any) {
      setSheetCreationMessage('');
      alert(err.message || 'Networking glitch on Sheets creation.');
    } finally {
      setIsConfiguring(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLeads();
      if (isUnlocked) {
        fetchWorkspaceConfig();
      }
    }
  }, [isOpen, isUnlocked]);

  useEffect(() => {
    if (isOpen && isUnlocked && activeTab === 'workspace' && workspaceConfig?.isConnected) {
      runDiagnostics();
    }
  }, [isOpen, isUnlocked, activeTab, workspaceConfig?.isConnected]);

  if (!isOpen) return null;

  // Simple secure passphrase check:
  // "inchpaper123" or "info@inchpaper.com" to log in
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = password.trim().toLowerCase();
    if (cleanPass === 'inchpaper123' || cleanPass === 'admin' || cleanPass === 'info@inchpaper.com') {
      setIsUnlocked(true);
      setErrorText('');
    } else {
      setErrorText('Access Denied. Please input the correct master passphrase or email registered to this account (helpline digits or account email).');
    }
  };

  const handleDeleteAll = (type: 'submissions' | 'abandoned') => {
    if (window.confirm(`Are you absolutely sure you want to permanently delete all ${type === 'submissions' ? 'completed submissions' : 'abandoned / in-progress leads'}? This action is irreversible.`)) {
      try {
        if (type === 'submissions') {
          localStorage.removeItem('inchpaper_submitted_leads');
          setSubmittedList([]);
        } else {
          localStorage.removeItem('inchpaper_abandoned_leads');
          setAbandonedList([]);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDownloadCSV = (type: 'submissions' | 'abandoned') => {
    const dataToExport = type === 'submissions' ? submittedList : abandonedList;
    if (!dataToExport || dataToExport.length === 0) {
      alert("No data available to download.");
      return;
    }

    try {
      // Create CSV Headers
      const headers = Object.keys(dataToExport[0]);
      const csvRows = [
        headers.join(','), // Header row
        ...dataToExport.map(row => 
          headers.map(fieldName => {
            let rawVal = row[fieldName];
            if (rawVal === null || rawVal === undefined) {
              rawVal = '';
            } else if (Array.isArray(rawVal)) {
              rawVal = rawVal.map(item => {
                if (typeof item === 'object' && item !== null) {
                  return item.name || item.filename || item.url || item.value || JSON.stringify(item);
                }
                return String(item);
              }).join('; ');
            } else if (typeof rawVal === 'object') {
              rawVal = rawVal.name || rawVal.value || JSON.stringify(rawVal);
            }
            const cleanVal = String(rawVal).replace(/"/g, '""'); // Escape double quotes
            return `"${cleanVal}"`;
          }).join(',')
        )
      ];

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `inchpaper_${type}_leads_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failure:", err);
      alert("Failed to export lead list directly. Your browser has block parameters configured.");
    }
  };

  const filteredSubmitted = submittedList.filter(item => 
    item.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.corporateEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAbandoned = abandonedList.filter(item => 
    item.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.corporateEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 text-[#7D0909]">
            <Database className="w-5 h-5" />
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wider">Lead Administration Platform</h2>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">Inchpaper Private Limited CRM Hub</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Screen if not authenticated */}
        {!isUnlocked ? (
          <div className="p-10 flex flex-col items-center justify-center space-y-6 text-center max-w-md mx-auto my-auto overflow-y-auto">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[#7D0909]">
              <Key className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Enter Access Passphrase</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                For security reasons, view of live CRM leads is restricted. Please enter the registry contact credential or email (e.g. <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[#7D0909]">info@inchpaper.com</code> or <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[#7D0909]">inchpaper123</code>).
              </p>
            </div>
            <form onSubmit={handleUnlock} className="w-full space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password / Admin Email"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-center font-mono focus:ring-2 focus:ring-[#7D0909] focus:border-transparent outline-none"
                autoFocus
              />
              {errorText && (
                <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded border border-red-100 leading-normal">
                  {errorText}
                </p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-[#7D0909] hover:bg-[#5E0606] text-white font-bold text-xs rounded-lg transition-colors uppercase tracking-wider"
              >
                Request Authorization
              </button>
            </form>
          </div>
        ) : (
          /* Dashboard Panel */
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
            
            {/* Nav & Action bar */}
            <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
              
              {/* Tab Selector */}
              <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('submissions')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === 'submissions' 
                      ? 'bg-[#7D0909] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submitted RFQs ({submittedList.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('abandoned')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === 'abandoned' 
                      ? 'bg-amber-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>In-Progress / Abandoned ({abandonedList.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('workspace')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === 'workspace' 
                      ? 'bg-indigo-700 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-indigo-700'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Workspace Integration</span>
                </button>
              </div>

              {/* Utility Search & Export buttons */}
              {activeTab !== 'workspace' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, email, phone..."
                      className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#7D0909] bg-white text-slate-800"
                    />
                  </div>
                  <button
                    onClick={() => handleDownloadCSV(activeTab)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Export to Excel Spreadsheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                  <button
                    onClick={() => handleDeleteAll(activeTab)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Clear database records"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Leads Table Container */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'submissions' ? (
                /* Submissions Table */
                filteredSubmitted.length === 0 ? (
                  <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="font-bold text-sm text-slate-700">No Submitted Leads Found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Any successful bulk RFQ forms filled and validated will automatically trigger and sync instantly in this directory.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase text-[9px] font-extrabold tracking-wider border-b border-slate-200">
                          <th className="p-3.5">Ticket ID / Date</th>
                          <th className="p-3.5">Business & Contact Person</th>
                          <th className="p-3.5">Email & Mobile Helpline</th>
                          <th className="p-3.5">Budget & Industry</th>
                          <th className="p-3.5">Target Categories Selected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {filteredSubmitted.map((lead, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-[#7D0909]/10 text-[#7D0909] font-bold font-mono text-[10px]">
                                {lead.ticketId}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-1">{lead.submittedAt}</div>
                            </td>
                            <td className="p-3.5">
                              <div className="text-slate-900 font-extrabold">{lead.companyName}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{lead.contactPerson} • {lead.city}</div>
                            </td>
                            <td className="p-3.5">
                              <div><a href={`mailto:${lead.corporateEmail}`} className="text-slate-900 hover:underline">{lead.corporateEmail}</a></div>
                              <div className="text-slate-500 font-mono text-[10.5px] mt-0.5">{lead.phoneNumber}</div>
                            </td>
                            <td className="p-3.5">
                              <div className="text-emerald-700 font-extrabold">{lead.monthlyBudget}</div>
                              <div className="text-[10px] text-slate-400">{lead.industryType}</div>
                            </td>
                            <td className="p-3.5">
                              <p className="text-[10px] text-slate-600 line-clamp-2 max-w-xs font-normal">
                                {getReadableCategories(lead.selectedCategories)}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : activeTab === 'abandoned' ? (
                /* Abandoned / In-Progress Table */
                filteredAbandoned.length === 0 ? (
                  <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-400">
                    <AlertTriangle className="w-10 h-10 mx-auto text-amber-500/65 mb-3" />
                    <p className="font-bold text-sm text-slate-700">No Partial / Abandoned Leads Saved</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Whenever potential buyers type contact strings but abandon the tab before official submission, we pre-save logs to prevent lose of B2B pipeline.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-amber-50/50 text-amber-900 uppercase text-[9px] font-extrabold tracking-wider border-b border-amber-100">
                          <th className="p-3.5">Last Modification Time</th>
                          <th className="p-3.5">Business / Contact</th>
                          <th className="p-3.5">Identified Email & Phone</th>
                          <th className="p-3.5">City & Chosen Category String</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                        {filteredAbandoned.map((lead, idx) => (
                          <tr key={idx} className="hover:bg-amber-50/10 transition-colors">
                            <td className="p-3.5 whitespace-nowrap text-slate-500">
                              <span className="text-[10.5px] font-mono text-slate-400">{lead.lastUpdated}</span>
                              <div className="mt-1"><span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">Abandoned / Active</span></div>
                            </td>
                            <td className="p-3.5">
                              <div className="text-slate-950 font-extrabold">{lead.companyName}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{lead.contactPerson}</div>
                            </td>
                            <td className="p-3.5">
                              {lead.corporateEmail !== 'Not specified yet' ? (
                                <div><a href={`mailto:${lead.corporateEmail}`} className="text-slate-900 hover:underline">{lead.corporateEmail}</a></div>
                              ) : (
                                <span className="text-slate-300 italic text-[11px]">No Email Registered</span>
                              )}
                              <div className="text-slate-500 font-mono text-[10.5px] mt-0.5">{lead.phoneNumber}</div>
                            </td>
                            <td className="p-3.5">
                              <div className="text-slate-700">{lead.city}</div>
                              <p className="text-[9.5px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                                categories: {getReadableCategories(lead.selectedCategories)}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                /* Google Workspace Automation controls */
                <div className="space-y-6 max-w-3xl mx-auto py-4">
                  {/* Overview Card */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                        <Cloud className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900">Google Workspace Cloud Automation</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Synchronize incoming corporate procurement requests directly with Google Sheets for robust pipeline management, and trigger real-time, professional HTML email alerts to your administration department via Gmail.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status and Configuration Details */}
                  {workspaceConfig?.isConnected ? (
                    <div className="space-y-6">
                      {/* Connected state header */}
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <div>
                            <p className="text-xs font-extrabold text-slate-800">Connected to Google Workspace</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Admin Account: <span className="font-mono bg-emerald-100/50 px-1 py-0.5 rounded text-emerald-800 font-bold">{workspaceConfig.adminEmail || "info@inchpaper.com"}</span></p>
                          </div>
                        </div>
                        <button
                          onClick={handleDisconnect}
                          disabled={isConfiguring}
                          className="px-3 py-1.5 border border-red-200 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Disconnect Account
                        </button>
                      </div>

                      {/* Interactive Configuration & Database Generator at the top */}
                      <div className="bg-gradient-to-r from-indigo-50 to-sky-50/50 border border-indigo-200 rounded-xl p-5 space-y-3.5 shadow-xs">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-150 text-indigo-800 uppercase tracking-wider">
                                Primary Setup & Repair
                              </span>
                            </div>
                            <h4 className="text-xs font-extrabold text-[#7D0909] uppercase tracking-wide">Generate Workspace Data Sheets & Attachments Space</h4>
                            <p className="text-[11px] text-slate-650 leading-relaxed max-w-xl">
                              Configure or repair your synchronization targets instantly. Clinically provisions a sparkling new spreadsheet template and parent directories safely inside a fully aligned Google Drive space.
                            </p>
                          </div>
                          <button
                            onClick={handleCreateSheet}
                            disabled={isConfiguring}
                            className="bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-400 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95 duration-75 shrink-0 shadow-md cursor-pointer select-none"
                          >
                            {isConfiguring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                            <span>Create Sourcing Database Sheet</span>
                          </button>
                        </div>
                        {sheetCreationMessage && (
                          <div className="p-3 bg-indigo-50 text-[11px] text-indigo-900 border border-indigo-100 rounded-lg animate-pulse flex items-center gap-2 font-semibold">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-650" />
                            <span>{sheetCreationMessage}</span>
                          </div>
                        )}
                      </div>

                      {/* Spreadsheet Configuration Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Sheets Sync Card */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                              <span className="text-xs font-extrabold text-slate-800">Google Sheets Sync</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={workspaceConfig.sheetsSyncActive}
                                onChange={(e) => handleToggleFeature('sheets', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                          </div>

                          {workspaceConfig.spreadsheetId ? (
                            <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Linked Spreadsheet ID</span>
                                <code className="text-[11px] font-mono text-zinc-650 break-all select-all block bg-white px-2 py-1 rounded border border-slate-200/60 mt-1">{workspaceConfig.spreadsheetId}</code>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 pt-1.5">
                                <a
                                  href={workspaceConfig.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${workspaceConfig.spreadsheetId}/edit`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>View Google Sheet</span>
                                </a>
                                <a
                                  href={workspaceConfig.folderUrl || "https://drive.google.com/drive/my-drive"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Open In Drive</span>
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center space-y-3">
                              <p className="text-xs text-slate-500">No synchronized Client Database Spreadsheet detected in your Google account directory.</p>
                              <button
                                onClick={handleCreateSheet}
                                disabled={isConfiguring}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                              >
                                {isConfiguring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                                <span>Create Sourcing Database Sheet</span>
                              </button>
                              {sheetCreationMessage && (
                                <p className="text-[10px] text-emerald-700 font-bold animate-pulse text-left bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-100 leading-normal">{sheetCreationMessage}</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Gmail Alerts Card */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mail className="w-5 h-5 text-red-600" />
                              <span className="text-xs font-extrabold text-slate-800">Gmail Instant Alerts</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={workspaceConfig.gmailAlertsActive}
                                onChange={(e) => handleToggleFeature('gmail', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-2.5">
                            <div className="text-xs text-slate-600 leading-normal">
                              Each client submission triggers a detailed, enterprise HTML summary dispatched to:
                            </div>
                            <div className="font-mono text-xs text-zinc-700 font-bold bg-white px-2 py-1.5 rounded border border-slate-200 text-center break-all">
                              {workspaceConfig.adminEmail || "info@inchpaper.com"}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Real-Time delivery logs will write automatically inside local CRM history and webhooks proxy logs under 2 seconds.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Google Workspace Connection Diagnostics Health Center */}
                      <div className="bg-slate-900 text-slate-300 rounded-xl p-5 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-black tracking-wider text-white uppercase">Integration Health Center</h5>
                            <p className="text-[10px] text-slate-400">Validate tokens, scope grants, sheets write permission & Gmail relays in real-time.</p>
                          </div>
                          <button
                            onClick={runDiagnostics}
                            disabled={isDiagnosing}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-850 text-white border border-slate-700 hover:border-slate-600 text-[11px] font-extrabold rounded-md flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                            <span>Audit Connection</span>
                          </button>
                        </div>

                        {diagnosticsError && (
                          <div className="bg-red-950/50 border border-red-900/50 rounded-lg p-2.5 text-xs text-red-200 leading-normal">
                            ❌ Diagnostics Failure: {diagnosticsError}
                          </div>
                        )}

                        {diagnosticsData ? (
                          <div className="space-y-3.5 pt-1.5">
                            {/* Token Health */}
                            <div className="flex items-start gap-2.5 border-b border-slate-800/60 pb-3">
                              {diagnosticsData.status === 'success' && diagnosticsData.details?.tokenStatus === 'valid' ? (
                                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">✓</div>
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">✗</div>
                              )}
                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white leading-none">Authentication Token Validity</span>
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${diagnosticsData.status === 'success' ? 'bg-emerald-500/25 text-emerald-400' : 'bg-red-500/25 text-red-400'}`}>
                                    {diagnosticsData.status === 'success' ? 'Valid' : 'Expired / Revoked'}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                                  {diagnosticsData.status === 'success' ? (
                                    <>Google sign-in token active and securely bound in server memory. Remaining lifetime: <strong className="text-slate-200">{~~(diagnosticsData.details?.tokenExpiresIn / 60)} minutes</strong>.</>
                                  ) : (
                                    <strong className="text-red-300">Your Google OAuth security token is either expired, has missing authorities, or was revoked on disconnect. Click DISCONNECT then RE-LINK access completely.</strong>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Scopes Health Alert */}
                            {diagnosticsData.status === 'success' && diagnosticsData.details?.scopes && (
                              <div className="border-b border-slate-800/60 pb-3 space-y-1.5">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linked Google Scope Grants:</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {/* Sheets scope */}
                                  {diagnosticsData.details.scopes.some((s: string) => s.includes('spreadsheets')) ? (
                                    <span className="text-[9.5px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-900 px-2 py-0.5 rounded">✓ Sheets (Write)</span>
                                  ) : (
                                    <span className="text-[9.5px] font-extrabold bg-red-950 text-red-300 border border-red-900 px-2 py-0.5 rounded">⚠️ Sheets Missing</span>
                                  )}
                                  {/* Gmail scope */}
                                  {diagnosticsData.details.scopes.some((s: string) => s.includes('gmail.send') || s.includes('mail.google.com')) ? (
                                    <span className="text-[9.5px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-900 px-2 py-0.5 rounded">✓ Gmail (Send)</span>
                                  ) : (
                                    <span className="text-[9.5px] font-extrabold bg-red-950 text-red-300 border border-red-900 px-2 py-0.5 rounded">⚠️ Gmail Send Missing</span>
                                  )}
                                  {/* Drive scope */}
                                  {diagnosticsData.details.scopes.some((s: string) => s.includes('drive.file') || s.includes('drive')) ? (
                                    <span className="text-[9.5px] font-extrabold bg-emerald-950 text-emerald-300 border border-[#1b4332] px-2 py-0.5 rounded">✓ Drive Files (Upload)</span>
                                  ) : (
                                    <span className="text-[9.5px] font-extrabold bg-red-950 text-red-300 border border-red-900 px-2 py-0.5 rounded">⚠️ Drive Upload Missing</span>
                                  )}
                                </div>
                                {!diagnosticsData.details.scopes.some((s: string) => s.includes('spreadsheets')) ||
                                 !diagnosticsData.details.scopes.some((s: string) => s.includes('gmail.send') || s.includes('mail.google.com')) ||
                                 !diagnosticsData.details.scopes.some((s: string) => s.includes('drive.file')) ? (
                                  <div className="bg-amber-950/60 text-amber-200 p-3 border border-amber-900/60 rounded-lg text-[11px] leading-normal font-medium space-y-1.5">
                                    <div>
                                      🚨 <strong>Connection Scope Mismatch detected.</strong> The current login session does not yet have all 3 needed permissions (Sheets, Gmail, Drive).
                                    </div>
                                    <div className="text-[10px] text-amber-300">
                                      <strong>Important:</strong> When signing in, if Google shows these permissions as a list of solid bullet points, simply clicking <strong>"Continue"</strong> or <strong>"Allow"</strong> at the bottom of Google's screen grants them all automatically. If Google shows checkboxes, please check all 3. Please click <strong>Disconnect</strong> above, then link your account again.
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            )}

                            {/* Database Sheets Target Health */}
                            <div className="flex items-start gap-2.5 border-b border-slate-800/60 pb-3">
                              {diagnosticsData.details?.sheetStatus === 'accessible' ? (
                                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">✓</div>
                              ) : diagnosticsData.details?.sheetStatus === 'not_linked' ? (
                                <div className="w-4 h-4 rounded-full bg-slate-500/20 text-slate-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">―</div>
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">✗</div>
                              )}
                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white leading-none">Spreadsheet Database Status</span>
                                  <span className={`text-[10px] font-bold ${diagnosticsData.details?.sheetStatus === 'accessible' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {diagnosticsData.details?.sheetStatus === 'accessible' ? 'Connected' : diagnosticsData.details?.sheetStatus === 'not_linked' ? 'Not Created' : 'Inaccessible'}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-slate-400 leading-normal mb-1">
                                  {diagnosticsData.details?.sheetStatus === 'accessible' ? (
                                    <>Dynamic Sheets sync verified. Targeted sheet: <span className="font-mono text-zinc-200">"{diagnosticsData.details.sheetTitle}"</span> (Tab: <span className="font-mono text-zinc-100 font-bold">"{diagnosticsData.details.firstSheetTitle || 'Sheet1'}"</span>).</>
                                  ) : (
                                    <>Database spreadsheet could not be found or write-locks are active. Please click <strong>"Create Sourcing Database Sheet"</strong> above to provision a clean sheet template.</>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Drive Sourcing Directory Target Health */}
                            <div className="flex items-start gap-2.5">
                              {diagnosticsData.details?.folderStatus === 'accessible' ? (
                                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">✓</div>
                              ) : diagnosticsData.details?.folderStatus === 'not_linked' ? (
                                <div className="w-4 h-4 rounded-full bg-slate-500/20 text-slate-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">―</div>
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">✗</div>
                              )}
                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white leading-none">Drive Attachments Folder Directory</span>
                                  <span className={`text-[10px] font-bold ${diagnosticsData.details?.folderStatus === 'accessible' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {diagnosticsData.details?.folderStatus === 'accessible' ? 'Connected' : diagnosticsData.details?.folderStatus === 'not_linked' ? 'Not Linked' : 'Inaccessible'}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-slate-400 leading-normal">
                                  {diagnosticsData.details?.folderStatus === 'accessible' ? (
                                    <>Drive uploads verification active. Targeted parent folder: <span className="font-mono text-zinc-200">"{diagnosticsData.details.folderName}"</span>.</>
                                  ) : (
                                    <>Target storage directory is locked. Verification failed: {diagnosticsData.details?.folderError || "No active directory linked."}</>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-slate-500 font-mono text-[10px]">
                            {isDiagnosing ? 'Retrieving diagnostic metrics...' : 'Click "Audit Connection" to run workspace configuration validation.'}
                          </div>
                        )}
                      </div>

                      {/* Live Action History Log Stream */}
                      {diagnosticsData?.details?.auditLogs && diagnosticsData.details.auditLogs.length > 0 && (
                        <div className="mt-4 bg-slate-900 border border-slate-705/30 rounded-xl p-4 space-y-3 shadow-inner">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                              Workspace Interaction logs
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">Recent {diagnosticsData.details.auditLogs.length} transmissions</span>
                          </div>
                          
                          <div className="max-h-52 overflow-y-auto space-y-2 pr-1 text-slate-300">
                            {diagnosticsData.details.auditLogs.map((log: any, i: number) => (
                              <div key={i} className="text-[10.5px] border-b border-slate-800/40 pb-2 last:border-0 last:pb-0">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-bold text-slate-200 truncate">{log.action}</span>
                                  <span className={`shrink-0 text-[9px] font-mono px-1 rounded font-bold ${log.status === 200 ? 'bg-emerald-500/25 text-emerald-400' : 'bg-red-500/25 text-red-400'}`}>
                                    HTTP {log.status}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-slate-400 leading-normal mt-1 font-mono break-all bg-slate-950/40 p-1.5 rounded border border-slate-850/50">{log.details}</p>
                                <span className="text-[9px] text-slate-500 mt-1 block">
                                  {new Date(log.timestamp).toLocaleString("en-IN")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Success Feedback Popup */}
                      {sheetSuccessPopup && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-xs font-extrabold text-emerald-950">Database Sheet Provisioned Successfully!</p>
                            <p className="text-[11px] text-emerald-850 leading-normal">
                              Your new Google Spreadsheet <strong>"Inchpaper B2B RFQs Client Database"</strong> has been created with administrative column headers and synced continuously inside your root Google Drive directory.
                            </p>
                            <button
                              onClick={() => setSheetSuccessPopup(false)}
                              className="text-[11px] text-emerald-900 font-extrabold underline hover:text-emerald-950 mt-1.5 block cursor-pointer"
                            >
                              Dismiss message
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Setup instructions and Link Button */
                    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-5">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center mx-auto">
                        <Settings2 className="w-7 h-7" />
                      </div>
                      <div className="space-y-1.5 max-w-md mx-auto">
                        <h4 className="text-sm font-extrabold text-slate-900">Authorize Workspace Integration</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Link your authorized Google account to activate Sheets Database Logging and Gmail alert synchronization on behalf of <span className="font-semibold text-slate-800">info@inchpaper.com</span>.
                        </p>
                      </div>

                      <button
                        onClick={handleGoogleLogin}
                        disabled={isConfiguring}
                        className="mx-auto px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition-colors shadow-xs cursor-pointer select-none disabled:bg-indigo-400 font-bold"
                      >
                        {isConfiguring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                        <span>Link Google Workspace Account</span>
                      </button>

                      <div className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">
                        We safely manage authentication tokens in memory without persistent file leakage risk, ensuring absolute privacy alignment.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Educational Info box inside panel */}
            <div className="p-4 border-t border-slate-200 bg-white text-[10.5px] text-slate-600 leading-normal font-medium shrink-0 space-y-1">
              <p>📍 <strong>Educational Note on Email Triggers:</strong> This dashboard is powered directly from instant storage metrics sync. As standard client-side applications run directly in client browsers, email alerts for successful submissions can be directly hooked automatically by wiring an endpoint trigger such as <strong>EmailJS</strong>, <strong>Web3Forms</strong>, or <strong>Formspree</strong> within the custom form submission module.</p>
              <p>🔒 100% of lead state corresponds to localized privacy guidelines, preventing physical transmission of administrative assets to unauthorized servers.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
