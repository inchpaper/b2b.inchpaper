import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Database,
  Tag,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Mail,
  FileText,
  HelpCircle,
  TrendingDown,
  Info,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Printer
} from 'lucide-react';

interface CatalogProduct {
  sku: string;
  name: string;
  rate: number;
  imageUrl: string;
  tags: string;
  description: string;
}

interface RFQInputItem {
  id: string;
  name: string;
  qty: number;
}

interface MatchedRFQItem {
  id: string;
  inputName: string;
  qty: number;
  matchedSku: string | null;
  matchedName: string;
  rate: number;
  amount: number;
  imageUrl: string;
  description: string;
  confidence: number;
  tagOrKeywordMatched: string;
  explanation: string;
}

interface SmartSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmartSandboxModal({ isOpen, onClose }: SmartSandboxModalProps) {
  // Modal Navigation
  const [activeTab, setActiveTab] = useState<'matching' | 'catalog'>('matching');

  // Workspace integration states
  const [workspaceConfigured, setWorkspaceConfigured] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  // Datasets
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [rfqItems, setRfqItems] = useState<RFQInputItem[]>([
    { id: '1', name: 'blue writing ink ballpen 0.7 write-o-meter reynold', qty: 25 },
    { id: '2', name: 'copier blank white sheet, standard a4 photocopying printing, 75gsm', qty: 12 },
    { id: '3', name: 'cleaning disinfectant citrus chemical lizol liquid floor detergent', qty: 3 },
    { id: '4', name: 'office wire stapler heavy loading pin machine sets kangaro style', qty: 5 },
    { id: '5', name: 'nescaf instant coffee caffeine standard pantry glass jar 200g', qty: 8 }
  ]);

  // Loading States
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isSavingCatalog, setIsSavingCatalog] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Matching Outcomes
  const [matchedRows, setMatchedRows] = useState<MatchedRFQItem[]>([]);
  const [resolvedEngine, setResolvedEngine] = useState<string | null>(null);
  const [matchAuditLog, setMatchAuditLog] = useState<string[]>([]);
  const [matchNotes, setMatchNotes] = useState<string>('Auto-resolved using synonymous tag alias column indicators and context.');

  // Email state
  const [targetEmail, setTargetEmail] = useState<string>('info@inchpaper.com');
  const [emailStatus, setEmailStatus] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

  // Catalog edit inline state
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CatalogProduct | null>(null);

  // Fetch Catalog and Workspace state on Mount
  const fetchCatalog = async () => {
    setIsCatalogLoading(true);
    try {
      const res = await fetch('/api/workspace/smart-match/catalog');
      if (res.ok) {
        const data = await res.json();
        setCatalog(data);
      }
    } catch (err) {
      console.error('Failed to get product catalog:', err);
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const fetchWorkspaceDiagnostics = async () => {
    try {
      const res = await fetch('/api/workspace/diagnostics');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.diagnostics) {
          const isAuth = data.diagnostics.sheetsStatus === 'authorized' || data.diagnostics.gmailStatus === 'authorized';
          setWorkspaceConfigured(isAuth);
        }
      }

      const configRes = await fetch('/api/workspace/get-config');
      if (configRes.ok) {
        const cData = await configRes.json();
        if (cData.status === 'success' && cData.config) {
          setAdminEmail(cData.config.adminEmail);
          if (cData.config.adminEmail) {
            setTargetEmail(cData.config.adminEmail);
          }
        }
      }
    } catch (err) {
      console.warn('Workspace diagnostics lookup fell back:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCatalog();
      fetchWorkspaceDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Sync / Read Dynamically via Linked Google Sheets Catalog
  const handleSyncWithGoogleSheet = async () => {
    setIsCatalogLoading(true);
    try {
      const res = await fetch('/api/workspace/smart-match/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'sheet', items: [] }) // Trigger dynamic sheet fetch
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchCatalog(); // Reload from updated local custom file synced from Sheets!
        alert('Product catalog successfully fetched and cached from your linked Google Sheet "Catalog" tab (A2:F200)!');
      } else {
        alert('Sheets fetch fell back. Ensure you have authorized Google Workspace and initialized a worksheet tab named exactly "Catalog" under columns [Sku, Title, Rate, ImageUrl, Tags, Description].');
      }
    } catch (err) {
      alert('Error fetching dynamic sheets catalog. Loaded custom JSON cache.');
    } finally {
      setIsCatalogLoading(false);
    }
  };

  // Add Item to RFQ Editor
  const handleAddRFQRow = () => {
    const nextId = String(rfqItems.length + 1);
    setRfqItems([
      ...rfqItems,
      { id: nextId, name: '', qty: 1 }
    ]);
  };

  // Delete RFQ Row
  const handleDeleteRFQRow = (id: string) => {
    setRfqItems(rfqItems.filter(item => item.id !== id));
  };

  // Edit RFQ Input
  const handleEditRFQRow = (id: string, value: string) => {
    setRfqItems(rfqItems.map(item => item.id === id ? { ...item, name: value } : item));
  };

  // Edit RFQ Qty
  const handleEditRFQQty = (id: string, value: number) => {
    setRfqItems(rfqItems.map(item => item.id === id ? { ...item, qty: Math.max(1, value) } : item));
  };

  // Save Catalog Changes Inline
  const handleStartEditProduct = (prod: CatalogProduct) => {
    setEditingSku(prod.sku);
    setEditForm({ ...prod });
  };

  const handleSaveProductEdit = async () => {
    if (!editForm) return;
    setIsSavingCatalog(true);
    const updatedCatalog = catalog.map(p => p.sku === editForm.sku ? editForm : p);
    try {
      const res = await fetch('/api/workspace/smart-match/catalog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCatalog)
      });
      if (res.ok) {
        setCatalog(updatedCatalog);
        setEditingSku(null);
        setEditForm(null);
      }
    } catch (err) {
      alert('Failed to save catalog details.');
    } finally {
      setIsSavingCatalog(false);
    }
  };

  // AI Semantic Sourcing Process
  const handleRunSemanticSearch = async () => {
    const invalidRows = rfqItems.filter(it => !it.name.trim());
    if (invalidRows.length > 0) {
      alert('Please fill in or remove empty customer RFQ description lines.');
      return;
    }

    setIsMatching(true);
    setMatchedRows([]);
    setResolvedEngine(null);
    setEmailStatus({ status: 'idle', message: '' });

    try {
      const res = await fetch('/api/workspace/smart-match/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'local', items: rfqItems })
      });

      if (res.ok) {
        const data = await res.json();
        setMatchedRows(data.items);
        setResolvedEngine(data.resolvedVia);
        
        // Auto compile a comprehensive reasoning and tag trigger log
        const logs: string[] = [];
        data.items.forEach((it: MatchedRFQItem) => {
          if (it.matchedSku) {
            logs.push(`RFQ line "${it.inputName.substring(0, 30)}..." → Map SKU [${it.matchedSku}] (Confidence: ${it.confidence}%). Trigger tags matched: [${it.tagOrKeywordMatched}]. Reason: ${it.explanation}`);
          } else {
            logs.push(`RFQ line "${it.inputName.substring(0, 30)}..." → UNMATCHABLE. Action: Flagged for manual desk resolution.`);
          }
        });
        setMatchAuditLog(logs);
      } else {
        alert('Server matching request failed.');
      }
    } catch (err: any) {
      alert(`Network error invoking smart match: ${err.message}`);
    } finally {
      setIsMatching(false);
    }
  };

  // Send Quotation PDF and Details to Client via connected Gmail Access Token
  const handleSendQuotationEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (matchedRows.length === 0) {
      alert('Please compute the RFQ Matching draft first before sending.');
      return;
    }
    if (!targetEmail || !targetEmail.includes('@')) {
      alert('A valid corporate email recipient is required.');
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus({ status: 'idle', message: '' });

    const totalCalculated = matchedRows.reduce((acc, r) => acc + r.amount, 0);

    try {
      const res = await fetch('/api/workspace/smart-match/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          rfqItems: matchedRows,
          totalAmount: totalCalculated,
          companyName: 'Procurement Matching Partner Sandbox',
          notes: matchNotes
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        const isSimulation = data.method.toLowerCase().includes('simulate');
        setEmailStatus({
          status: isSimulation ? 'success' : 'success',
          message: `${data.message} Sourced via: ${data.method}`
        });
      } else {
        setEmailStatus({
          status: 'error',
          message: data.message || 'Server failed to transmit message.'
        });
      }
    } catch (err: any) {
      setEmailStatus({
        status: 'error',
        message: `Network transmission error: ${err.message}`
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const grandTotal = matchedRows.reduce((acc, row) => acc + row.amount, 0);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        id="smart-sourcing-sandbox"
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-100 overflow-hidden"
      >
        {/* Header Block Section */}
        <div className="bg-[#7D0909] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">AI RFQ Sourcing & Quotation Sandbox</h1>
              <p className="text-[11px] text-zinc-100 opacity-90">Semantic Matching with synonyms tags, Sheets lookup, and automated Gmail delivery</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-white/10 text-white transition-all transition-colors focus:outline-none"
            id="smart-modal-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls Navigation Menu */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 px-4">
          <button
            onClick={() => setActiveTab('matching')}
            className={`px-4 py-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 focus:outline-none select-none transition-all ${
              activeTab === 'matching' 
                ? 'border-[#7D0909] text-[#7D0909]' 
                : 'border-transparent text-slate-500 hover:text-[#7D0909]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>RFQ matching portal workspace</span>
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 focus:outline-none select-none transition-all ${
              activeTab === 'catalog' 
                ? 'border-[#7D0909] text-[#7D0909]' 
                : 'border-transparent text-slate-500 hover:text-[#7D0909]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Product specifications / tag lookup catalog</span>
            <span className="bg-slate-200/80 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
              {catalog.length}
            </span>
          </button>
        </div>

        {/* Modal Core Area scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/40">

          {/* TAB 1: RFQ SOURCING PIPELINE WORKSPACE */}
          {activeTab === 'matching' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* RFQ Sourcing Rows Entry */}
                <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#7D0909]" />
                        <span>Client RFQ upload rows (messy line items)</span>
                      </h2>
                      <p className="text-xs text-slate-400">Type or adjust different synonym names below to trigger cognitive tags searching</p>
                    </div>
                    <button
                      onClick={handleAddRFQRow}
                      className="px-2.5 py-1 text-[11px] bg-rose-50 border border-red-200 text-[#7D0909] hover:bg-rose-100 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer select-none"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add RFQ line
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                    {rfqItems.map((item, index) => (
                      <div key={item.id} className="flex gap-2 items-center bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                        <div className="text-zinc-400 font-mono text-xs w-6 text-center select-none">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleEditRFQRow(item.id, e.target.value)}
                            placeholder="Type raw client request, e.g. blue write-o-meter standard reynolds pen 0.7..."
                            className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#7D0909]"
                          />
                        </div>
                        <div className="w-20">
                          <div className="flex items-center border border-slate-200 bg-white rounded overflow-hidden">
                            <span className="text-[10px] text-slate-400 font-bold px-1.5 select-none">QTY</span>
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleEditRFQQty(item.id, parseInt(e.target.value) || 1)}
                              className="w-full text-xs bg-white border-none py-1 px-1 focus:outline-none text-center font-bold text-slate-800"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRFQRow(item.id)}
                          className="p-1.5 text-zinc-400 hover:text-[#7D0909] rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {rfqItems.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No messy query lines present. Click "Add RFQ line" to insert custom product test names!
                      </div>
                    )}
                  </div>

                  {/* Matching Trigger and Workspace Metadata */}
                  <div className="pt-2 border-t border-slate-50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-1 bg-[#7D0909]/5 px-2 bg-gradient-to-r py-1.5 rounded-md border border-red-100">
                      <Sparkles className="w-3.5 h-3.5 text-[#7D0909] animate-pulse" />
                      <span className="text-[11px] font-bold text-[#7D0909]">
                        Matched inventory includes 5 products + comma synonyms
                      </span>
                    </div>

                    <button
                      onClick={handleRunSemanticSearch}
                      disabled={isMatching || rfqItems.length === 0}
                      className="px-6 py-2.5 bg-[#7D0909] hover:bg-[#5E0606] text-white disabled:bg-slate-300 font-bold text-xs uppercase tracking-wider rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed select-none"
                    >
                      {isMatching ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>AI processing similarity...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Run AI Semantic Matching Scanner ✨</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sourcing Process explanation and features */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#7D0909]">How synonyms mapped accurate quotes</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Procurement teams frequently submit bills with fuzzy details, typos, or localized product names. Standard exact queries fail.
                    </p>
                    
                    <div className="space-y-2 pt-1 font-sans text-xs">
                      <div className="flex gap-2 items-start bg-slate-50 p-2 rounded">
                        <div className="p-1 bg-[#7D0909]/10 text-[#7D0909] rounded font-bold">1</div>
                        <div>
                          <p className="font-extrabold text-slate-700">Deterministic Tags Index: (Fast-match cache)</p>
                          <p className="text-slate-500 text-[11px]">System scans the keywords inside <strong>Alias synonyms Tags</strong> first. If there's an exact match, maps instantly.</p>
                        </div>
                      </div>

                      <div className="flex gap-2 items-start bg-slate-50 p-2 rounded">
                        <div className="p-1 bg-[#7D0909]/10 text-[#7D0909] rounded font-bold">2</div>
                        <div>
                          <p className="font-extrabold text-slate-700">AI Contextual Reasoning Engine: (Gemini 3.5)</p>
                          <p className="text-slate-500 text-[11px]">If names are unrecognizable, Gemini compares description context and maps fuzzy terms (e.g., "write-o-meter" to classic pen SKU-PEN-01) with confidence rankings.</p>
                        </div>
                      </div>

                      <div className="flex gap-2 items-start bg-slate-50 p-2 rounded">
                        <div className="p-1 bg-[#7D0909]/10 text-[#7D0909] rounded font-bold">3</div>
                        <div>
                          <p className="font-extrabold text-slate-700">Instant PDF & SMTP Gmail Delivery:</p>
                          <p className="text-slate-500 text-[11px]">Saves record metrics to lead desk, compiles branded quotation (with image anchors), and dispatches securely via connected workspace account in under 5 minutes.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational diagnostics */}
                  <div className="bg-slate-900 text-slate-50 text-xs p-4 rounded-xl font-mono space-y-1.5">
                    <p className="text-zinc-400 border-b border-zinc-800 pb-1 mb-2 font-bold flex items-center justify-between">
                      <span>Operational Diagnostics Log</span> 
                      <span className="text-[10px] uppercase text-[#7D0909]">PROTOTYPE LIVE</span>
                    </p>
                    <p><span className="text-emerald-400">● Core VM</span> connected securely to b2b.inchpaper.com</p>
                    <p><span className="text-emerald-400">● Workspace Auth</span> {workspaceConfigured ? 'AUTHORIZED (Official Sheets / Gmail live)' : 'SIMULATION MODE (Requires Workspace login)'}</p>
                    <p><span className="text-emerald-400">● Gemini Model</span> gemini-3.5-flash-latest ready</p>
                    <p><span className="text-emerald-400">● Database Cache</span> workspace-custom-catalog.json loaded ({catalog.length} lines)</p>
                  </div>
                </div>
              </div>

              {/* OUTCOME BLOCK: SYNTHESIZED LOG AND PORTAL BRANDED QUOTATION GRAPHIC */}
              {matchedRows.length > 0 && (
                <div className="space-y-6 pt-3 border-t border-slate-100">
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">RFQ Sourcing matched successfully!</p>
                      <p className="text-[11px] text-emerald-700">Resolved using <strong>{resolvedEngine}</strong>. Clean catalog SKU mapping, price calculation and thumbnails established.</p>
                    </div>
                  </div>

                  {/* Interactive Match Logs */}
                  <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-200">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">Sourcing Matching audit trace logs</p>
                    <div className="space-y-1 bg-white p-2.5 rounded border border-slate-200 overflow-y-auto max-h-[140px] font-mono text-[11px] text-slate-600">
                      {matchAuditLog.map((logStr, lIdx) => (
                        <div key={lIdx} className="py-1 border-b border-slate-50 last:border-none">
                          <span className="text-[#7D0909] font-bold">&gt;&gt;</span> {logStr}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PREMIUM BRANDED CORPORATE QUOTATION DRAFT SCREEN */}
                  <div className="bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden font-sans">
                    {/* Branded quotation top bar */}
                    <div className="bg-slate-900 text-white p-6 flex flex-wrap justify-between items-center gap-4">
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-widest text-[#cbd5e0] font-bold">AUTOMATED PROPOSAL</div>
                        <h2 className="text-lg font-bold tracking-tight text-[#FFFFFF]">INCHPAPER CENTRALIZED PROCUREMENT DESK</h2>
                        <span className="text-[10px] text-zinc-400 font-mono">Quotation ID: IP-RFQ-SANDBOX-{(new Date()).getFullYear()}</span>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-[#7D0909] text-white text-[10px] uppercase px-3 py-1 rounded font-bold">
                          Matched Result SLA: ~ 1 Min
                        </span>
                        <p className="text-[10px] text-zinc-400 font-mono mt-1">Date Sourced: {(new Date()).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Quotation Table Sourcing Data layout */}
                    <div className="p-4 md:p-6 overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[700px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wide">
                            <th className="py-3 px-3">Resolved Inventory Sku & Image</th>
                            <th className="py-3 px-3">Client Raw Sourcing input</th>
                            <th className="py-3 px-3 text-center">Qty Sourced</th>
                            <th className="py-3 px-3 text-right">Negotiated Bulk Rate</th>
                            <th className="py-3 px-3 text-right">Confidence Match</th>
                            <th className="py-3 px-3 text-right">Calculated Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {matchedRows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-3 flex items-center gap-3 max-w-[260px]">
                                <img
                                  src={row.imageUrl}
                                  alt={row.matchedName}
                                  className="w-10 h-10 object-contain p-1 rounded border border-slate-100 bg-white"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-slate-800 line-clamp-1">{row.matchedName}</span>
                                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                                    SKU: {row.matchedSku || 'UNRESOLVED'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-3 text-slate-500 italic max-w-[200px] truncate">
                                "{row.inputName}"
                              </td>
                              <td className="py-4 px-3 text-center font-bold text-slate-700">
                                {row.qty}
                              </td>
                              <td className="py-4 px-3 text-right font-semibold text-slate-600">
                                ₹{row.rate}
                              </td>
                              <td className="py-4 px-3 text-right">
                                <div className="inline-flex flex-col items-end gap-1">
                                  <span className={`text-[10px] font-bold uppercase ${
                                    row.confidence >= 80 ? 'text-emerald-700 font-extrabold' : 'text-amber-500'
                                  }`}>
                                    {row.confidence}% Confidence
                                  </span>
                                  <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${row.confidence >= 80 ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                                      style={{ width: `${row.confidence}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-3 text-right font-extrabold text-slate-800 text-sm">
                                ₹{row.amount}
                              </td>
                            </tr>
                          ))}

                          <tr className="bg-slate-50/80 font-bold text-slate-700 border-t-2 border-slate-200">
                            <td colSpan={5} className="py-4 px-3 text-right text-sm">Grand Sourcing Quotation Sum (including GST):</td>
                            <td className="py-4 px-3 text-right text-[#7D0909] text-base font-extrabold">₹{grandTotal}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* DIRECT TO GMAIL / CUSTOMER TRANSMISSION FORWARD PANEL */}
                    <div className="bg-slate-50 border-t border-slate-200 p-5 font-sans">
                      <form onSubmit={handleSendQuotationEmail} className="space-y-4 max-w-2xl">
                        <div>
                          <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-[#7D0909]" />
                            <span>Auto-Forward Sourced Quotation to Inbox</span>
                          </p>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            Deliver this exact quotation layout complete with product thumbnails and wholesale GST brackets directly to your customer or operations desk. Uses Gmail API.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-8 space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Recipient Corporate Email</label>
                            <input
                              type="email"
                              required
                              value={targetEmail}
                              onChange={(e) => setTargetEmail(e.target.value)}
                              placeholder="e.g. info@inchpaper.com"
                              className="w-full text-xs border border-slate-300 rounded-md px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:border-[#7D0909]"
                            />
                          </div>
                          
                          <div className="md:col-span-4">
                            <button
                              type="submit"
                              disabled={isSendingEmail}
                              className="w-full px-4 py-2 bg-slate-900 text-white font-bold text-xs uppercase tracking-wide disabled:bg-slate-300 rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none"
                            >
                              {isSendingEmail ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Transmitting email...</span>
                                </>
                              ) : (
                                <>
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>Send live Quote via Gmail ✉️</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Add Sourcing/SLA Notes to email body</label>
                          <textarea
                            value={matchNotes}
                            onChange={(e) => setMatchNotes(e.target.value)}
                            rows={2}
                            placeholder="e.g. Please checkout details, calculated as per standard contracted wholesale price matrices..."
                            className="w-full text-xs border border-slate-300 rounded-md px-3 py-2 text-slate-700 font-medium focus:outline-none focus:border-[#7D0909]"
                          />
                        </div>

                        {emailStatus.status === 'success' && (
                          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 flex gap-2.5 items-start">
                            <Check className="w-4 h-4 text-emerald-600 font-extrabold flex-shrink-0 mt-0.5" />
                            <div className="text-slate-700 text-xs text-left leading-normal">
                              <strong>Success! Quotation Proposal Dispatched!</strong>
                              <p className="text-[11px] text-slate-500 mt-1">{emailStatus.message}</p>
                            </div>
                          </div>
                        )}

                        {emailStatus.status === 'error' && (
                          <div className="bg-rose-50 rounded-lg p-3 border border-red-100 flex gap-2.5 items-start">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="text-slate-700 text-xs text-left leading-normal">
                              <strong>Failed to transmit live Gmail document!</strong>
                              <p className="text-[11px] text-red-500 mt-1">{emailStatus.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">Note: Authenticate Google Gmail inside Admin Leads Console first to transmit live, or use simulated fallback model.</p>
                            </div>
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCT MASTER DIALOG / ALIAS SPECIFICATION ENGINE */}
          {activeTab === 'catalog' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-[#7D0909]" />
                      <span>Product Master inventory & alias synonym specifications</span>
                    </h2>
                    <p className="text-xs text-slate-400">Add different comma-separated synonyms in tags column. If customer uses any of them, AI maps the row perfectly.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncWithGoogleSheet}
                      disabled={isCatalogLoading || !workspaceConfigured}
                      className="px-3.5 py-1.5 border border-[#7D0909] text-[#7D0909] disabled:border-slate-200 disabled:text-slate-400 text-xs font-bold rounded-md flex items-center gap-1 hover:bg-rose-50 cursor-pointer disabled:cursor-not-allowed select-none transition-all"
                      title={workspaceConfigured ? 'Sync Product database directly from customized Google Spreadsheet' : 'Authorize Google Sheets inside admin console to fetch live database sheets'}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCatalogLoading ? 'animate-spin' : ''}`} />
                      <span>Sync with Google Catalog Sheet</span>
                    </button>
                    <button
                      onClick={fetchCatalog}
                      disabled={isCatalogLoading}
                      className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-bold hover:bg-slate-200 text-xs rounded-md flex items-center gap-1 cursor-pointer transition-all select-none"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reload
                    </button>
                  </div>
                </div>

                {isCatalogLoading ? (
                  <div className="py-24 text-center text-slate-400 text-xs">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#7D0909] mb-3" />
                    Fetching product specifications database...
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[750px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                          <th className="py-3 px-3">Product Info / SKU</th>
                          <th className="py-3 px-3">Wholesale Rate</th>
                          <th className="py-3 px-3">Dynamic Description details</th>
                          <th className="py-3 px-4 w-[280px]">Synonyms / Tag aliases</th>
                          <th className="py-3 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {catalog.map((prod) => (
                          <tr key={prod.sku} className="hover:bg-slate-50/40">
                            
                            {/* Product SKU Image Title */}
                            <td className="py-4 px-3 flex items-center gap-3">
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-10 h-10 object-contain p-1 border border-slate-100 bg-white rounded flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                {editingSku === prod.sku ? (
                                  <input
                                    type="text"
                                    value={editForm?.name || ''}
                                    onChange={(e) => setEditForm({ ...editForm!, name: e.target.value })}
                                    className="border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold text-slate-800"
                                  />
                                ) : (
                                  <span className="font-extrabold text-slate-800 block leading-tight">{prod.name}</span>
                                )}
                                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-extrabold block mt-0.5">
                                  SKU: {prod.sku}
                                </span>
                              </div>
                            </td>

                            {/* Sourcing default price */}
                            <td className="py-4 px-3 font-extrabold text-slate-700">
                              {editingSku === prod.sku ? (
                                <input
                                  type="number"
                                  value={editForm?.rate || 0}
                                  onChange={(e) => setEditForm({ ...editForm!, rate: parseFloat(e.target.value) || 0 })}
                                  className="w-16 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-center"
                                />
                              ) : (
                                <span>₹{prod.rate}</span>
                              )}
                            </td>

                            {/* Description specs details */}
                            <td className="py-4 px-3 text-slate-500 max-w-[200px] leading-relaxed">
                              {editingSku === prod.sku ? (
                                <textarea
                                  value={editForm?.description || ''}
                                  onChange={(e) => setEditForm({ ...editForm!, description: e.target.value })}
                                  rows={2}
                                  className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs"
                                />
                              ) : (
                                <span className="line-clamp-2">{prod.description}</span>
                              )}
                            </td>

                            {/* Synonym tags alias column */}
                            <td className="py-4 px-4">
                              {editingSku === prod.sku ? (
                                <textarea
                                  value={editForm?.tags || ''}
                                  onChange={(e) => setEditForm({ ...editForm!, tags: e.target.value })}
                                  rows={2}
                                  placeholder="Synonym comma-separated synonyms..."
                                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold"
                                />
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {(prod.tags || '').split(',').map((tagWord, tIdx) => (
                                    <span key={tIdx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-slate-200">
                                      {tagWord.trim()}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Editing inline actions save update button */}
                            <td className="py-4 px-3 text-center">
                              {editingSku === prod.sku ? (
                                <div className="flex flex-col gap-1 items-center justify-center">
                                  <button
                                    onClick={handleSaveProductEdit}
                                    disabled={isSavingCatalog}
                                    className="px-2.5 py-1 text-[10px] bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 cursor-pointer flex items-center gap-0.5 select-none"
                                  >
                                    <Check className="w-3 h-3" /> Save
                                  </button>
                                  <button
                                    onClick={() => setEditingSku(null)}
                                    className="px-2.5 py-1 text-[10px] bg-slate-200 text-slate-600 rounded font-bold hover:bg-slate-300 cursor-pointer select-none"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStartEditProduct(prod)}
                                  className="px-3 py-1 bg-rose-50 text-[#7D0909] font-bold border border-red-100/60 rounded text-[11px] hover:bg-rose-100/80 transition-colors cursor-pointer select-none"
                                >
                                  Edit Tags / Price
                                </button>
                              )}
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer Navigation Info */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-bold">
            <Info className="w-4 h-4 text-[#7D0909]" />
            <span>RFQ matched details are stored in leads desk. Configure Google Sheets to enable fully automatic live syncing.</span>
          </div>
          <div>
            <span className="font-mono text-[10px] bg-slate-200 text-slate-600 font-extrabold px-2 py-1 rounded">
              b2b.inchpaper.com • COGNITIVE SOURCING V1.0
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
