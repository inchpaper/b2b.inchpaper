import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Edit2, Trash2, ExternalLink, Image as ImageIcon, Link as LinkIcon, CheckCircle2, AlertCircle, Eye, RefreshCw, Key, ShieldCheck, Upload, Sparkles, HelpCircle } from 'lucide-react';
import { CorporateCatalogItem } from '../types';
import { formatCatalogImageUrl, getGoogleDriveFallbackUrl, isGoogleDriveLink, extractGoogleDriveFileId } from '../utils/imageUrl';

interface CatalogAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogs: CorporateCatalogItem[];
  onCatalogsUpdated: (updated: CorporateCatalogItem[]) => void;
}

const PRESET_IMAGES = [
  { label: 'Executive Luxury Box', url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80' },
  { label: 'Eco Sustainable Stationery', url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80' },
  { label: 'Employee Welcome Kit', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80' },
  { label: 'Festive & Celebration Hamper', url: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?w=800&auto=format&fit=crop&q=80' },
  { label: 'Premium Drinkware & Bottles', url: 'https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=800&auto=format&fit=crop&q=80' },
  { label: 'Branded Tech & Gadgets', url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80' },
];

export default function CatalogAdminModal({
  isOpen,
  onClose,
  catalogs,
  onCatalogsUpdated
}: CatalogAdminModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('inchpaper_admin_auth') === 'true';
  });
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Editing state
  const [editingCatalog, setEditingCatalog] = useState<Partial<CorporateCatalogItem> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && editingCatalog) {
        setEditingCatalog({ ...editingCatalog, imageUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (val: string) => {
    if (!editingCatalog) return;
    const formatted = formatCatalogImageUrl(val);
    setEditingCatalog({ ...editingCatalog, imageUrl: formatted });
  };

  if (!isOpen) return null;

  const handleVerifyPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyInput.trim()) {
      setAuthError('Please enter your administrator passkey');
      return;
    }
    setIsVerifying(true);
    setAuthError('');
    try {
      const res = await fetch('/api/workspace/verify-passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passkeyInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        sessionStorage.setItem('inchpaper_admin_auth', 'true');
        sessionStorage.setItem('inchpaper_admin_pass', passkeyInput.trim());
      } else {
        setAuthError(data.message || 'Invalid passkey. Access denied.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Network error verifying passkey');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStartAdd = () => {
    setEditingCatalog({
      id: `cat-${Date.now()}`,
      title: '',
      buttonText: 'View Catalog PDF',
      imageUrl: PRESET_IMAGES[0].url,
      driveLink: 'https://drive.google.com/drive/folders/',
      category: 'Corporate Gifts',
      description: 'Explore our latest collection with high-resolution specifications and pricing details.',
      badge: 'New Collection'
    });
    setIsNew(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');
  };

  const handleStartEdit = (cat: CorporateCatalogItem) => {
    setEditingCatalog({ ...cat });
    setIsNew(false);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');
  };

  const handleSaveCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatalog?.title || !editingCatalog?.buttonText || !editingCatalog?.driveLink) {
      setSaveErrorMsg('Please fill in Title, Button Text, and Shared Drive Link.');
      return;
    }

    setIsSaving(true);
    setSaveErrorMsg('');
    setSaveSuccessMsg('');

    try {
      const storedPass = sessionStorage.getItem('inchpaper_admin_pass') || 'sm@shivmadh@sm';
      const res = await fetch('/api/catalogs/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalog: editingCatalog,
          password: storedPass
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        onCatalogsUpdated(data.catalogs);
        setSaveSuccessMsg('Catalog successfully saved and live on website!');
        setTimeout(() => {
          setEditingCatalog(null);
          setSaveSuccessMsg('');
        }, 1200);
      } else {
        setSaveErrorMsg(data.message || 'Failed to save catalog');
      }
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Error communicating with server');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCatalog = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this catalog from the page?')) {
      return;
    }

    try {
      const storedPass = sessionStorage.getItem('inchpaper_admin_pass') || 'sm@shivmadh@sm';
      const res = await fetch(`/api/catalogs/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: storedPass })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        onCatalogsUpdated(data.catalogs);
        if (editingCatalog?.id === id) {
          setEditingCatalog(null);
        }
      } else {
        alert(data.message || 'Failed to delete catalog');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting catalog');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#7D0909]/10 flex items-center justify-center text-[#7D0909]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Corporate Catalogs Backend Manager</h2>
              <p className="text-xs text-slate-500">Update catalog images, titles, button text &amp; shared drive links</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-stone-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-50/30">
          {!isAuthenticated ? (
            /* Authentication Screen */
            <div className="max-w-md mx-auto py-8 text-center space-y-5">
              <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                <Key className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Admin Authentication Required</h3>
                <p className="text-xs text-slate-600">Enter your Inchpaper administrator passkey to manage public catalog entries.</p>
              </div>

              <form onSubmit={handleVerifyPasskey} className="space-y-3">
                <input
                  type="password"
                  placeholder="Enter administrator passkey..."
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7D0909] text-center tracking-widest font-mono"
                  autoFocus
                />
                {authError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {authError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 bg-[#7D0909] hover:bg-[#5E0606] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isVerifying ? 'Verifying...' : 'Unlock Catalog Manager'}
                </button>
              </form>
            </div>
          ) : editingCatalog ? (
            /* Catalog Edit / Add Form */
            <form onSubmit={handleSaveCatalog} className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-[#7D0909]/10 text-[#7D0909] rounded-md">
                    {isNew ? 'New Catalog' : 'Editing Catalog'}
                  </span>
                  <h3 className="font-bold text-slate-800 text-base">
                    {editingCatalog.title || 'Untitled Catalog'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCatalog(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
                >
                  Cancel &amp; Back to List
                </button>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {saveSuccessMsg}
                </div>
              )}

              {saveErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  {saveErrorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Form Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Catalog Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCatalog.title || ''}
                      onChange={(e) => setEditingCatalog({ ...editingCatalog, title: e.target.value })}
                      placeholder="e.g. Executive & Luxury Corporate Gifts"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7D0909]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Text on Clickable Button Below Image *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingCatalog.buttonText || ''}
                      onChange={(e) => setEditingCatalog({ ...editingCatalog, buttonText: e.target.value })}
                      placeholder="e.g. Open Executive Gifts Catalog"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7D0909]"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">This exact text is displayed on the prominent action button under the catalog picture.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Shared Drive Link (Google Drive / Cloud Folder) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        required
                        value={editingCatalog.driveLink || ''}
                        onChange={(e) => setEditingCatalog({ ...editingCatalog, driveLink: e.target.value })}
                        placeholder="https://drive.google.com/drive/folders/..."
                        className="flex-1 px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#7D0909]"
                      />
                      {editingCatalog.driveLink && (
                        <a
                          href={editingCatalog.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-xl flex items-center gap-1 text-xs font-semibold transition-colors"
                          title="Test Link in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Test
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Category Tag
                      </label>
                      <input
                        type="text"
                        value={editingCatalog.category || ''}
                        onChange={(e) => setEditingCatalog({ ...editingCatalog, category: e.target.value })}
                        placeholder="Executive / Eco / Festive"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7D0909]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Card Badge (optional)
                      </label>
                      <input
                        type="text"
                        value={editingCatalog.badge || ''}
                        onChange={(e) => setEditingCatalog({ ...editingCatalog, badge: e.target.value })}
                        placeholder="Signature Series / Eco"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7D0909]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Short Description
                    </label>
                    <textarea
                      rows={2}
                      value={editingCatalog.description || ''}
                      onChange={(e) => setEditingCatalog({ ...editingCatalog, description: e.target.value })}
                      placeholder="Brief overview of the items inside this catalog..."
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7D0909]"
                    />
                  </div>
                </div>

                {/* Right Column: Image Selection & Live Card Preview */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Catalog Cover Image *
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold rounded-lg border border-stone-300 transition-colors cursor-pointer"
                        title="Choose an image from your computer or phone"
                      >
                        <Upload className="w-3.5 h-3.5 text-stone-600" />
                        <span>Upload from Computer</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        value={editingCatalog.imageUrl || ''}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        placeholder="Paste Google Drive link, image URL, or click Upload above..."
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#7D0909]"
                      />

                      {/* Google Drive Status Notification */}
                      {isGoogleDriveLink(editingCatalog.imageUrl) && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Google Drive Link Detected!</strong> Automatically converted to direct high-speed CDN embed.
                          </span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 leading-normal">
                        💡 <strong>Google Drive Tip:</strong> You can paste your Google Drive share link directly. Make sure the file's sharing permission is set to <em>"Anyone with the link can view"</em>.
                      </p>
                    </div>
                    
                    {/* Quick Preset Picker */}
                    <div className="mt-3">
                      <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Or pick from curated studio presets:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {PRESET_IMAGES.map((preset, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setEditingCatalog({ ...editingCatalog, imageUrl: preset.url })}
                            className={`p-1.5 text-left text-[11px] rounded-lg border transition-all truncate cursor-pointer ${
                              editingCatalog.imageUrl === preset.url
                                ? 'border-[#7D0909] bg-[#7D0909]/5 font-semibold text-[#7D0909]'
                                : 'border-stone-200 bg-white text-slate-600 hover:border-stone-300'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Preview Card */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      Live Card Preview (How it looks on page)
                    </label>
                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm p-3.5">
                      <div className="relative aspect-[16/10] bg-stone-100 rounded-xl overflow-hidden mb-3">
                        <img
                          src={formatCatalogImageUrl(editingCatalog.imageUrl) || PRESET_IMAGES[0].url}
                          alt="Catalog preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const fallback = getGoogleDriveFallbackUrl(editingCatalog.imageUrl);
                            if (fallback && target.src !== fallback) {
                              target.src = fallback;
                            } else {
                              target.src = PRESET_IMAGES[0].url;
                            }
                          }}
                        />
                        {editingCatalog.badge && (
                          <span className="absolute top-2.5 right-2.5 bg-[#7D0909] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            {editingCatalog.badge}
                          </span>
                        )}
                        {editingCatalog.category && (
                          <span className="absolute top-2.5 left-2.5 bg-white/90 text-slate-800 text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs uppercase">
                            {editingCatalog.category}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                        {editingCatalog.title || 'Your Catalog Title'}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {editingCatalog.description || 'Description of catalog products...'}
                      </p>
                      <div className="w-full py-2.5 px-4 bg-[#7D0909] text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs">
                        <span>{editingCatalog.buttonText || 'Open Catalog'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingCatalog(null)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-stone-200/60 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#7D0909] hover:bg-[#5E0606] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save & Publish Catalog'}
                </button>
              </div>
            </form>
          ) : (
            /* Catalogs List View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Current Live Catalogs ({catalogs.length})</h3>
                  <p className="text-xs text-slate-500">Each catalog is displayed 2 per row on the public /catalog page.</p>
                </div>
                <button
                  onClick={handleStartAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7D0909] hover:bg-[#5E0606] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Catalog
                </button>
              </div>

              <div className="space-y-3">
                {catalogs.map((cat, idx) => (
                  <div
                    key={cat.id || idx}
                    className="p-4 bg-white rounded-xl border border-stone-200 hover:border-stone-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                        <img
                          src={cat.imageUrl}
                          alt={cat.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{cat.title}</span>
                          {cat.badge && (
                            <span className="text-[10px] bg-stone-100 text-stone-700 font-semibold px-2 py-0.5 rounded">
                              {cat.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="font-medium text-[#7D0909]">Button: "{cat.buttonText}"</span>
                          <span className="text-stone-300">•</span>
                          <a
                            href={cat.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Drive Link
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCatalog(cat.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete catalog"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-100/70 border-t border-stone-200 flex items-center justify-between text-xs text-slate-500">
          <span>Changes are saved permanently to <code className="font-mono text-slate-700">workspace-corporate-catalogs.json</code></span>
          <button
            onClick={onClose}
            className="font-semibold text-slate-700 hover:text-black"
          >
            Close Manager
          </button>
        </div>

      </div>
    </div>
  );
}
