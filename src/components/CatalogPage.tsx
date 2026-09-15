import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  PhoneCall, 
  MessageSquare, 
  Settings, 
  Gift, 
  HelpCircle,
  X,
  Send,
  CheckCircle2
} from 'lucide-react';
import { CorporateCatalogItem } from '../types';
import CatalogAdminModal from './CatalogAdminModal';

interface CatalogPageProps {
  onBackToHome: () => void;
  brandLogo: string;
  heroBannerImage: string;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenLeadConsole?: () => void;
  onOpenRFQ?: () => void;
}

export default function CatalogPage({ 
  onBackToHome, 
  brandLogo, 
  heroBannerImage,
  onOpenPrivacy,
  onOpenTerms,
  onOpenLeadConsole,
  onOpenRFQ
}: CatalogPageProps) {
  const [catalogs, setCatalogs] = useState<CorporateCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Support Advisor Modal State
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportCompany, setSupportCompany] = useState('');
  const [supportContact, setSupportContact] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  // Load catalogs from backend API
  const fetchCatalogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/catalogs');
      const data = await res.json();
      if (res.ok && data.catalogs) {
        setCatalogs(data.catalogs);
      } else {
        setError(data.message || 'Failed to load catalogs');
      }
    } catch (err: any) {
      console.error('Error fetching catalogs:', err);
      setError(err.message || 'Unable to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const categories = ['all', ...Array.from(new Set(catalogs.map(c => c.category).filter(Boolean)))];

  const filteredCatalogs = activeFilter === 'all'
    ? catalogs
    : catalogs.filter(c => c.category === activeFilter);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingSupport(true);
    try {
      const payload = {
        companyName: supportCompany || 'Corporate Catalog Inquirer',
        contactPerson: supportContact || 'Anonymous Inquirer',
        corporateEmail: supportEmail || 'info@inchpaper.com',
        phoneNumber: supportPhone || '+91 77038 60982',
        city: 'India',
        categories: ['Corporate Gifting & Catalogs', 'Account Support Setup'],
        status: 'submitted',
        notes: `Catalog Page Account Support Query: ${supportMessage}`
      };

      await fetch('/api/rfq-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setSupportSubmitted(true);
    } catch (err) {
      console.error('Support submission error:', err);
      setSupportSubmitted(true);
    } finally {
      setIsSendingSupport(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-800 flex flex-col font-sans selection:bg-[#7D0909] selection:text-white">
      
      {/* 1. TOP HEADER & NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Left: Back to Home + Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-stone-100 hover:bg-stone-200 transition-colors border border-stone-200/80 cursor-pointer"
              aria-label="Back to Inchpaper Wholesale Procurement Portal"
            >
              <ArrowLeft className="w-4 h-4 text-[#7D0909]" />
              <span className="hidden sm:inline">Wholesale Portal</span>
              <span className="sm:hidden">Home</span>
            </button>

            <div className="flex items-center gap-3">
              <img
                src={brandLogo}
                alt="Inchpaper B2B Logo"
                className="h-10 sm:h-12 w-auto object-contain cursor-pointer"
                onClick={onBackToHome}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/inchpaper logo (10).png";
                }}
              />
              <div className="hidden lg:flex flex-col">
                <span className="text-xs font-black tracking-widest text-[#7D0909] uppercase">Corporate Gifting Desk</span>
                <span className="text-[11px] text-stone-500 font-medium">B2B Curated Wholesale Library</span>
              </div>
            </div>
          </div>

          {/* Right: Direct Phone Call, WhatsApp & Admin Management */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Phone Call (Directs to native dialer on iPhone / Android / smartphones) */}
            <a
              href="tel:+917703860982"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-stone-100 text-slate-800 hover:bg-stone-200 border border-stone-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title="Call Helpline"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#7D0909]" />
              <span className="hidden sm:inline">+91 77038 60982</span>
              <span className="sm:hidden">Call</span>
            </a>

            {/* WhatsApp Link */}
            <a
              href="https://wa.me/917703860982"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Chat on WhatsApp</span>
              <span className="md:hidden">WhatsApp</span>
            </a>

            {/* Admin Management Modal Trigger */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-rose-50/70 hover:bg-rose-100 text-[#7D0909] text-xs font-bold rounded-xl border border-red-200/80 transition-colors cursor-pointer"
              title="Add or edit catalogs (Admin)"
            >
              <Settings className="w-3.5 h-3.5 text-[#7D0909]" />
              <span className="hidden sm:inline">Manage Catalogs</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO BANNER JUST BELOW THE HEADER */}
      <section className="w-full bg-[#FAF7F2] py-4 sm:py-6 px-3 sm:px-6 lg:px-8 border-b border-stone-200/80" id="catalog-hero-banner">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-xs border border-stone-200/90 bg-white">
            <img
              src={heroBannerImage}
              alt="Inchpaper Corporate Gifting Solutions Provider - Thoughtful Gifts for a Brighter Tomorrow"
              className="w-full h-auto block object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/inchpaper-corporate-gifting-solutions-provider-1.png";
              }}
            />
          </div>
        </div>
      </section>

      {/* 3. HEADLINE: "Customized Curated Gifts" IN BOLD */}
      <section className="pt-8 sm:pt-12 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Customized Curated Gifts
          </h1>

          {/* Category Filter Pills (if multiple categories exist) */}
          {categories.length > 2 && (
            <div className="flex flex-wrap justify-center sm:justify-end gap-2">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFilter(cat as string)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer ${
                    activeFilter === cat
                      ? 'bg-[#7D0909] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat === 'all' ? 'All Collections' : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. SECTION OF CATALOGS — 2 PER ROW GRID WITH BREATHING HOVER ANIMATION */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 max-w-7xl mx-auto w-full flex-1">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#7D0909] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-stone-600">Loading corporate catalogs...</p>
          </div>
        ) : error ? (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-md mx-auto space-y-3">
            <p className="text-sm text-rose-800 font-semibold">{error}</p>
            <button
              onClick={fetchCatalogs}
              className="px-4 py-2 bg-[#7D0909] text-white text-xs font-bold rounded-xl"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredCatalogs.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-white rounded-2xl border border-stone-200 p-8">
            <Gift className="w-12 h-12 text-stone-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No Catalogs Available</h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              No catalogs currently match this filter. As an administrator, you can add new catalogs using the button below.
            </p>
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="px-5 py-2.5 bg-[#7D0909] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#5E0606]"
            >
              Add First Catalog
            </button>
          </div>
        ) : (
          /* EXACTLY 2 IN ONE ROW (grid-cols-1 md:grid-cols-2) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {filteredCatalogs.map((catalog) => (
              <div
                key={catalog.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 hover:border-[#7D0909]/40 shadow-sm hover:shadow-xl transition-all duration-300 p-5 sm:p-7 flex flex-col justify-between group"
              >
                {/* Catalog Card Top Section */}
                <div className="space-y-4">
                  
                  {/* Clickable Catalog Image with BREATHING ANIMATION on hover */}
                  <a
                    href={catalog.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative aspect-[16/10] overflow-hidden rounded-xl sm:rounded-2xl bg-stone-100 border border-stone-100 cursor-pointer"
                    aria-label={`Open shared drive link for ${catalog.title}`}
                  >
                    <img
                      src={catalog.imageUrl}
                      alt={catalog.title}
                      className="w-full h-full object-cover object-center group-hover-breathing will-change-transform transform-gpu transition-all"
                      loading="lazy"
                    />

                    {/* Gradient shade for subtle depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 opacity-50 group-hover:opacity-30 transition-opacity" />

                    {/* Badges */}
                    {catalog.badge && (
                      <div className="absolute top-3.5 right-3.5 z-10">
                        <span className="bg-[#7D0909] text-white text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-md">
                          {catalog.badge}
                        </span>
                      </div>
                    )}

                    {catalog.category && (
                      <div className="absolute top-3.5 left-3.5 z-10">
                        <span className="bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-xs uppercase tracking-wide">
                          {catalog.category}
                        </span>
                      </div>
                    )}
                  </a>

                  {/* Catalog Information */}
                  <div className="pt-2 space-y-2">
                    <a
                      href={catalog.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group-hover:text-[#7D0909] transition-colors"
                    >
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                        {catalog.title}
                      </h2>
                    </a>

                    {catalog.description && (
                      <p className="text-sm text-stone-600 leading-relaxed line-clamp-2 sm:line-clamp-3">
                        {catalog.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* PROMINENT MAROON BUTTON BELOW THE IMAGE (NO FOLDER ICON, EDITABLE TEXT) */}
                <div className="pt-6 mt-4 border-t border-stone-100">
                  <a
                    href={catalog.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 bg-[#7D0909] hover:bg-[#5E0606] active:bg-[#450404] text-white text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer text-center"
                    id={`catalog-btn-${catalog.id}`}
                  >
                    <span className="truncate">{catalog.buttonText || catalog.title}</span>
                    <ExternalLink className="w-4 h-4 text-white/80 shrink-0 ml-1" />
                  </a>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. BESPOKE SAMPLES & CONCIERGE BANNER */}
      <section className="bg-stone-100 border-t border-stone-200/90 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold text-[#7D0909] uppercase tracking-wider">Custom Corporate Gifting &amp; Bulk Branding</span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Need physical samples or bespoke customized kits?
            </h3>
            <p className="text-sm text-stone-600 max-w-xl">
              Our dedicated corporate account team provides sample boxes, logo mockups, and bulk credit pricing for enterprise teams and events.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <a
              href="https://wa.me/917703860982"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>
            
            <a
              href="tel:+917703860982"
              className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors border border-stone-200 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-stone-600" />
              <span>+91 77038 60982</span>
            </a>
          </div>
        </div>
      </section>

      {/* 6. SECTION JUST ABOVE FOOTER: "SIMPLIFY ENTERPRISE SOURCING WITH INCHPAPER" (SCREENSHOT 1) */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b-8 border-[#7D0909] relative overflow-hidden" id="optimize-procurement-section">
        {/* Background ambient accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7D0909]/5 rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <span className="bg-[#7D0909] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded inline-block">
            Start Procurement Optimization
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Simplify Enterprise Sourcing with Inchpaper
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Centralize your workplace supplies, control monthly multi-branch consumption budgets, and extract maximum yield under structured B2B trade covenants.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={onOpenRFQ || onBackToHome}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#7D0909] hover:bg-[#5E0606] text-white font-bold rounded text-xs tracking-wider uppercase transition-colors shadow-lg cursor-pointer"
            >
              Request Custom Wholesale Proposal
            </button>

            <a
              href="https://wa.me/917703860982?text=Hello%20Inchpaper%20Corporate%20Gifting%20Desk,%20we%20want%20to%20receive%20a%20wholesale%20proposal."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 border border-emerald-600 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message Enterprise Sourcing Desk</span>
            </a>

            <button
              onClick={() => {
                setIsSupportOpen(true);
                setSupportSubmitted(false);
                setSupportMessage('');
              }}
              className="w-full sm:w-auto px-6 py-3.5 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded text-xs cursor-pointer"
            >
              Request Account Support Setup
            </button>
          </div>

          <div className="pt-6 text-[11px] text-slate-400 flex justify-center items-center gap-4">
            <span>✓ Average SLA Turn: 4 Hours</span>
            <span>•</span>
            <span>✓ Absolute HSN compliance matching</span>
          </div>
        </div>
      </section>

      {/* 7. COMPREHENSIVE ENTERPRISE FOOTER (SAME AS b2b.inchpaper.com) */}
      <footer className="bg-slate-50 border-t border-slate-200 text-black py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo Header Banner inside Footer */}
        <div className="max-w-7xl mx-auto pb-8 mb-8 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={brandLogo}
              alt="Inchpaper Logo"
              className="h-14 sm:h-16 md:h-18 w-auto object-contain bg-transparent focus:outline-none cursor-pointer"
              onClick={onBackToHome}
              referrerPolicy="no-referrer"
            />
            <div className="h-10 w-[1px] bg-slate-200 hidden sm:block"></div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs uppercase tracking-widest text-[#7D0909] font-extrabold">Enterprise Supply Desk</span>
              <span className="text-[10px] text-slate-400 font-semibold">Strategic Institutional Procurement Partner</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-bold hidden md:block">
            <span>Corporate Registrant &amp; Fulfillment Desk</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          
          {/* Col 1: Brand description & corporate credentials */}
          <div className="space-y-3">
            <p className="font-extrabold text-[#7D0909] uppercase tracking-wider text-xs">About Inchpaper</p>
            <p className="text-xs text-black leading-relaxed font-semibold">
              Inchpaper is India&apos;s strategic institutional procurement partner. We replace supplier fragmentation with enterprise-grade physical fulfillment contracts and centralized purchase automation panels.
            </p>
            <div className="text-xs text-black leading-relaxed pt-1 space-y-3">
              <div className="space-y-1">
                <p className="font-bold text-black text-xs">Inchpaper Private Limited</p>
                <p className="text-black text-xs font-normal">37/4, 2nd Floor, Inderpuri, Jacobpura</p>
                <p className="text-black text-xs font-normal">Gurgaon 122001, Haryana, India</p>
              </div>
              
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <p className="text-xs"><span className="font-bold text-black">Email:</span> <a href="mailto:info@inchpaper.com" className="text-black hover:text-[#7D0909] font-normal underline">info@inchpaper.com</a></p>
                <p className="text-xs"><span className="font-bold text-black">Helpline:</span> <a href="tel:+917703860982" className="text-black hover:text-[#7D0909] font-normal">+91 77038 60982</a></p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <p className="text-xs"><span className="font-bold text-black">GSTIN:</span> <span className="text-black font-normal font-mono text-xs">06AAFCI6721G1ZP</span></p>
                <p className="text-xs"><span className="font-bold text-black">CIN:</span> <span className="text-black font-normal font-mono text-xs">U51909HR2020PTC086937</span></p>
                <p className="text-xs"><span className="font-bold text-black">MSME:</span> <span className="text-black font-normal font-mono text-xs">UDYAM-HR-05-0042815</span></p>

                {/* Website Carbon Badge */}
                <div className="codepen_wrapper pt-3 mt-2 border-t border-slate-100">
                  <div id="wcb" className="carbonbadge inline-block p-2.5 rounded-lg border border-slate-100 bg-slate-50/80 max-w-xs text-left">
                    <div id="wcb_p" className="text-[11px] text-slate-700 font-bold flex flex-wrap items-center gap-1">
                      <span id="wcb_g" className="text-emerald-700 font-extrabold">
                        🌱 0.02g of CO<sub>2</sub>/view
                      </span>
                      <span className="text-slate-300">|</span>
                      <span id="wcb_a" className="text-[#7D0909] font-extrabold">
                        Website Carbon
                      </span>
                    </div>
                    <span id="wcb_2" className="text-[10px] text-slate-500 font-semibold block mt-1">
                      &nbsp;Cleaner than 98% of pages tested
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Procurement Solutions */}
          <div className="space-y-3 text-xs">
            <p className="font-extrabold text-[#7D0909] uppercase tracking-wider text-xs">Procurement Solutions</p>
            <ul className="space-y-2 font-semibold">
              <li><button onClick={onBackToHome} className="text-black hover:text-[#7D0909] transition-colors cursor-pointer text-left">Unified Sourcing Advantage</button></li>
              <li><button onClick={onBackToHome} className="text-black hover:text-[#7D0909] transition-colors cursor-pointer text-left">Academic Sourcing Desk</button></li>
              <li><button onClick={onBackToHome} className="text-black hover:text-[#7D0909] transition-colors cursor-pointer text-left">Hospital Sanitation SLA</button></li>
              <li><button onClick={onBackToHome} className="text-black hover:text-[#7D0909] transition-colors cursor-pointer text-left">Annual Cost Calculations</button></li>
            </ul>
          </div>

          {/* Col 3: Accounts Terms */}
          <div className="space-y-3 text-xs">
            <p className="font-extrabold text-[#7D0909] uppercase tracking-wider text-xs">Corporate Account Terms</p>
            <ul className="space-y-2 font-semibold">
              <li><span className="text-black hover:text-[#7D0909] cursor-pointer transition-colors" onClick={() => alert("Trade Credit cycles (Net 30/45) require valid physical verification and corporate business proof.")}>Rolling Credit Frameworks</span></li>
              <li><span className="text-black hover:text-[#7D0909] cursor-pointer transition-colors" onClick={() => alert("All Inchpaper invoicing corresponds to Section 16 of the GST laws. 100% tax claims are processed via continuous GSTR filing.")}>Tax Claim & ITC Guarantees</span></li>
              <li><span className="text-black hover:text-[#7D0909] cursor-pointer transition-colors" onClick={() => alert("Standard corporate SLAs guarantee 48-hour delivery on locking in inventory levels.")}>Centralized Delivery SLA</span></li>
              <li><span className="text-black hover:text-[#7D0909] cursor-pointer transition-colors" onClick={() => alert("For deep supplier consolidation needs above 20 Lakhs, please write directly to info@inchpaper.com details.")}>Institutional Procurement Policy</span></li>
            </ul>
          </div>

          {/* Col 4: GST Compliance Desk */}
          <div className="space-y-3 text-xs">
            <p className="font-extrabold text-[#7D0909] uppercase tracking-wider text-xs">GST Compliance Desk</p>
            <p className="text-[11px] text-black leading-relaxed font-semibold">
              Every shipment is itemized with official Government HSN categories, verified shipping bills, physical packaging records, and immediate digital invoice reporting.
            </p>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                System Uptime Status: Live
              </p>
              <p className="text-[9px] text-slate-500 mt-1">GSTR Automatic Uploads Synchronized</p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-700">
          <p>© 2026 Inchpaper Private Limited. All Business Rights Reserved.</p>
          <div className="flex gap-4 items-center flex-wrap">
            <button onClick={onOpenPrivacy} className="hover:text-[#7D0909] font-bold transition-colors cursor-pointer">Privacy Policy</button>
            <span>•</span>
            <button onClick={onOpenTerms} className="hover:text-[#7D0909] font-bold transition-colors cursor-pointer">Terms and Conditions</button>
            <span>•</span>
            <span className="hover:text-[#7D0909] cursor-pointer font-bold transition-colors" onClick={() => alert("GSTIN Verification: Verified Active with B2B Master Portal.")}>GSTIN Verification</span>
            <span>•</span>
            <button onClick={onOpenLeadConsole} className="hover:text-[#7D0909] font-bold text-[#7D0909]/80 hover:bg-[#7D0909]/5 bg-rose-50/50 border border-red-100/50 px-2 py-0.5 rounded transition-all shrink-0 text-[10px] cursor-pointer" title="CRM Lead Console">🔒 Lead Console</button>
          </div>
        </div>
      </footer>

      {/* 8. FLOATING ACTION PANELS: ADVISOR MODAL & WHATSAPP */}
      <div className="fixed bottom-14 sm:bottom-6 right-4 sm:right-6 z-40 space-y-2 flex flex-col items-end">
        {/* Procurement Advisor Support Modal Trigger */}
        <button
          onClick={() => {
            setIsSupportOpen(true);
            setSupportSubmitted(false);
            setSupportMessage('');
          }}
          className="bg-[#7D0909] border border-[#5E0606] text-white p-3 rounded-full shadow-lg hover:bg-[#5E0606] transition-transform active:scale-95 flex items-center gap-2 text-xs font-bold whitespace-nowrap cursor-pointer"
          title="Speak to Enterprise Sourcing Desk"
        >
          <HelpCircle className="w-5 h-5 text-white" />
          <span className="hidden sm:inline">Procurement Advisor</span>
        </button>

        {/* WhatsApp Core Support Direct Action */}
        <a
          href="https://wa.me/917703860982"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 text-white p-3.5 rounded-full shadow-xl hover:bg-emerald-700 transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
          title="Urgent WhatsApp Assist"
        >
          <MessageSquare className="w-6 h-6 fill-white text-emerald-600" />
        </a>
      </div>

      {/* 9. STATIC BOTTOM BAR ON MOBILE (SCREENSHOT 2: CALL HELPLINE & INITIATE RFQ) */}
      <div className="sticky bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 p-2.5 flex sm:hidden justify-around items-center gap-1.5 text-xs">
        <a
          href="tel:+917703860982"
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 w-1/2 rounded text-center block transition-colors cursor-pointer"
        >
          📞 Call Helpline
        </a>
        <button
          onClick={onOpenRFQ || onBackToHome}
          className="bg-[#7D0909] hover:bg-[#5E0606] text-white font-bold py-2 w-1/2 rounded text-center block transition-colors cursor-pointer"
        >
          🚀 Initiate RFQ Form
        </button>
      </div>

      {/* INTERACTIVE POPUP SUPPORT ADVISOR DIALOG */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl relative">
            <button
              onClick={() => setIsSupportOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {!supportSubmitted ? (
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#7D0909]/10 text-[#7D0909] flex items-center justify-center font-bold">
                    🤵
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Inchpaper Enterprise Advisor</h3>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Account Support Setup</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Connect immediately with our primary procurement specialist for bespoke corporate gifting, custom branding, or institutional credit quoting.
                </p>

                <div className="space-y-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Company Name *"
                    value={supportCompany}
                    onChange={(e) => setSupportCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#7D0909]"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Contact Person *"
                    value={supportContact}
                    onChange={(e) => setSupportContact(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#7D0909]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number *"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#7D0909]"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Work Email *"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#7D0909]"
                    />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your gifting requirements (items, quantities, budget)..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#7D0909] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingSupport}
                  className="w-full py-2.5 bg-[#7D0909] hover:bg-[#5E0606] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingSupport ? 'Routing to Desk...' : 'Submit Support Request'}</span>
                </button>
              </form>
            ) : (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base text-slate-900">Request Dispatched to Sourcing Desk</h4>
                <p className="text-xs text-slate-600">
                  Our corporate procurement desk has received your account inquiry. A dedicated manager will contact you within 4 hours.
                </p>
                <button
                  onClick={() => setIsSupportOpen(false)}
                  className="px-5 py-2 bg-[#7D0909] text-white text-xs font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN MANAGEMENT MODAL */}
      <CatalogAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        catalogs={catalogs}
        onCatalogsUpdated={(updated) => {
          setCatalogs(updated);
        }}
      />

    </div>
  );
}
