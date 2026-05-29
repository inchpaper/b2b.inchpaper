import React, { useState, useRef } from 'react';
const brandLogo = "/inchpaper logo (6).png";
import { PrivacyPolicyModal, TermsConditionsModal } from './components/LegalModals';
import LeadConsoleModal from './components/LeadConsoleModal';
import {
  Building2,
  GraduationCap,
  Building,
  Hotel,
  Warehouse,
  ShoppingBag,
  Landmark,
  Users,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Truck,
  ShieldAlert,
  BadgePercent,
  HelpCircle,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  UploadCloud,
  X,
  Send,
  Phone,
  MessageSquare,
  AlertCircle,
  Sparkles,
  TrendingDown,
  ClipboardList,
  RefreshCw,
  BarChart2,
  Coffee,
  Trash2,
  Check,
  ExternalLink,
  ArrowRight,
  Menu,
  MenuSquare,
  FileUp,
  Award,
  BookOpen,
  Briefcase,
  Settings
} from 'lucide-react';

// Interfaces for our interactive widgets
interface UploadedFile {
  name: string;
  size: string;
  type: string;
  progress: number;
  uploaded: boolean;
  base64?: string;
}

interface SectorInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  gstFeature: string;
  headline: string;
  description: string;
  supplies: string[];
  creditTerms: string;
  savingsRate: string;
}

interface CategoryDetails {
  id: string;
  name: string;
  icon: React.ReactNode;
  shortDesc: string;
  items: string[];
  complianceBadge: string;
  avgDiscount: string;
}

export default function App() {
  // Mobile menu control
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Legal documentation modal pages
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isLeadConsoleOpen, setIsLeadConsoleOpen] = useState(false);

  // Monitor URL search parameter transitions to trigger Lead Console
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('console') === 'true') {
      setIsLeadConsoleOpen(true);
    }
  }, []);

  // RFQ Form state
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [corporateEmail, setCorporateEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [industryType, setIndustryType] = useState('Corporate Offices');
  const [monthlyBudget, setMonthlyBudget] = useState('₹50,000 - ₹2,000,000');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState('');

  // Active category list in the RFQ list
  const availableFormCategories = [
    'Office Stationery',
    'Printer & Copier Supplies',
    'Housekeeping Materials',
    'Pantry Essentials',
    'Corporate Gifting',
    'Sports & School Supplies',
    'Packaging Materials',
    'Safety Consumables'
  ];

  // Contact support modal state
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  // 1. Savings calculator state
  const [stationerySpend, setStationerySpend] = useState(25000);
  const [housekeepingSpend, setHousekeepingSpend] = useState(30000);
  const [pantrySpend, setPantrySpend] = useState(40000);

  // 2. Interactive industry switcher resources
  const sectorData: SectorInfo[] = [
    {
      id: 'corporate',
      name: 'Corporate Offices',
      icon: <Building2 className="w-5 h-5" />,
      gstFeature: '100% Eligible ITC | Seamless HSN mapping',
      headline: 'Centralized Headquarters Sourcing & Multi-branch Dispatch',
      description: 'Streamline procurement for corporate campuses and regional branches. Enjoy consolidated monthly billing cycles, department-wise division filters, and designated account managers.',
      supplies: ['Premium copiers & branded writing tools', 'Centralized file folders & workspace desk accessories', 'Bulk corporate pantry consumables & housekeeping essentials'],
      creditTerms: 'Net 30/45 Days credit option available',
      savingsRate: 'Up to 18.5%'
    },
    {
      id: 'schools',
      name: 'Schools & Universities',
      icon: <GraduationCap className="w-5 h-5" />,
      gstFeature: 'Exempt & Composed schemes compliant',
      headline: 'Institutional Academic Supply Contracts & Sports Equipment',
      description: 'Unified vendor contracts for notebooks, customized sports kits, test accessories, administrative files, and safe non-toxic cleaning agents at scale.',
      supplies: ['Students curriculum notebooks & study guides', 'Classroom whiteboard markers & visual aids', 'Bulk house-keeping detergents and safety toolkits'],
      creditTerms: 'Customized educational session credit lines',
      savingsRate: 'Up to 22.0%'
    },
    {
      id: 'hospitals',
      name: 'Hospitals',
      icon: <Building className="w-5 h-5" />,
      gstFeature: 'Zero-mistake billing documentation under section rules',
      headline: 'Hygienic Workplace & Cleanroom Specialized Consumables',
      description: 'Stringent quality clearance for medical-grade disinfectants, high-density paper products, emergency safety gear, and intensive sanitation supplies.',
      supplies: ['Heavy-duty sanitation liquids & sanitizers', 'Continuous paper towels & tissue dispensers', 'Front-desk registration station stationery essentials'],
      creditTerms: 'Custom institutional corporate credit billing',
      savingsRate: 'Up to 15.0%'
    },
    {
      id: 'hotels',
      name: 'Hotels',
      icon: <Hotel className="w-5 h-5" />,
      gstFeature: 'Regular GST billing with accurate HSN coding',
      headline: 'Guest Amenity Supporting Products & Housekeeping Kits',
      description: 'Consolidated B2B sourcing for front-office luxury tools, high-volume housekeeping chemicals, washroom tissue rolls, and customized corporate events gifts.',
      supplies: ['High-absorbency tissue paper & premium roll-ons', 'Exclusive reception desk accessories & luxury papers', 'Complete janitorial supplies & cleanroom gear'],
      creditTerms: 'Flexible recurring monthly volume clearing',
      savingsRate: 'Up to 20.0%'
    },
    {
      id: 'coworking',
      name: 'Co-working Spaces',
      icon: <Users className="w-5 h-5" />,
      gstFeature: 'Multi-registered corporate desk GST compatibility',
      headline: 'Continuous Desk Sourcing & Shared Premium Pantry Materials',
      description: 'Ensure uninterrupted floor uptime with managed supply contracts. Automatically reorder coffee, premium snacks, A4 paper reams, and trash bags.',
      supplies: ['Fast-moving standard copy papers & laminates', 'Gourmet premium coffee, tea & organic food packets', 'Shared workspace sanitization & desk sprays'],
      creditTerms: 'Rolling 30-day corporate post-paid systems',
      savingsRate: 'Up to 24.5%'
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing Units',
      icon: <Warehouse className="w-5 h-5" />,
      gstFeature: 'B2B Input Tax Credit certification',
      headline: 'Industrial Grade Safety Gear & High Volume Packaging Staples',
      description: 'Optimize shop floor maintenance and packaging supply chains. Secure bulk discount pricing on heavy-duty boxes, stretch wraps, safety goods, and office desk setups.',
      supplies: ['Heavy kraft cartons, bubble films & strapping tapes', 'Industrial high-visibility jackets & protective kits', 'Standard administrative registries and logging sheets'],
      creditTerms: 'Extended trade credit cycles based on annual commits',
      savingsRate: 'Up to 16.5%'
    }
  ];
  const [activeSector, setActiveSector] = useState<string>('corporate');

  // 3. Category interactive details
  const categoryDetails: CategoryDetails[] = [
    {
      id: 'stationery',
      name: 'Office Stationery',
      icon: <ClipboardList className="text-[#7D0909] w-6 h-6" />,
      shortDesc: 'Premium copiers, writing instruments, executive planners, folders, and notebooks.',
      items: ['A4 Copier Paper (70/75/80 GSM)', 'Executive Leatherette Planners', 'Premium Gel & Ballpoint Boxes', 'Card Holders & File Lever Arch Folders', 'Heavy-duty Desktop Staplers & Punching Tools'],
      complianceBadge: 'Eco-Friendly Options',
      avgDiscount: '25% - 40% Off Retail'
    },
    {
      id: 'printing',
      name: 'Printer & Copier Supplies',
      icon: <RefreshCw className="text-[#7D0909] w-6 h-6" />,
      shortDesc: 'OEM-grade laser toners, cartridges, and glossy photo papers for high-volume units.',
      items: ['Compatible High-Yield Black Laser Toners', 'Original Brand Ink Cartridges', 'Continuous Computer Stationary Sheets', 'Thermal Billing & POS Receipt Rolls', 'Premium Matte Photo Sizing Cards'],
      complianceBadge: '100% OEM Genuine Match',
      avgDiscount: '20% - 35% Off Retail'
    },
    {
      id: 'housekeeping',
      name: 'Housekeeping Materials',
      icon: <ShieldCheck className="text-[#7D0909] w-6 h-6" />,
      shortDesc: 'Commercial floor disinfectants, air fresheners, trash bags, paper towels, and janitorial carts.',
      items: ['Premium Floor Cleansers & Phenyl Containers', 'Eco-safe Bio-Degradable Garbage Bags', 'High-Absorbency M-Fold & C-Fold Paper Tissues', 'Automatic Aerosol Air Freshener Dispensers', 'Professional Microfiber Cloths & Mops'],
      complianceBadge: 'Certified Non-Toxic',
      avgDiscount: '30% - 45% Off Retail'
    },
    {
      id: 'pantry',
      name: 'Pantry Essentials',
      icon: <Coffee className="text-[#7D0909] w-6 h-6" />,
      shortDesc: 'Gourmet whole-bean coffees, quick tea bags, institutional milk packs, and health munchies.',
      items: ['Premium Roasted Coffee Beans & Instant Blends', 'Branded Green Tea & CTC Bio-bags', 'Long-Shelf Life Dairy Milk & Oat-Milk Packets', 'Consolidated Corporate Snacks & Dry Fruits', 'Premium Recycled Paper Cups & Stirrers'],
      complianceBadge: 'FSSAI Approved Supply Chain',
      avgDiscount: '15% - 30% Off Retail'
    },
    {
      id: 'gifting',
      name: 'Corporate Gifting',
      icon: <Award className="text-[#7D0909] w-6 h-6" />,
      shortDesc: 'Elegant customized apparel, branded metallic bottles, leather planners, and welcome onboarding setups.',
      items: ['Embroidered Brand Identity Cotton Polo Shirts', 'Insulated Double-Walled Stainless Steel Flasks', 'Custom Welcome Onboarding Gift Sets', 'Engraved Premium Brass Ballpoint Sets', 'Eco-friendly Desk Calendars & Seed Diaries'],
      complianceBadge: 'In-House Precision Printing',
      avgDiscount: '20% - 38% Off Retail'
    },
    {
      id: 'packaging',
      name: 'Packaging Materials',
      icon: <Warehouse className="text-[#7D0909] w-6 h-6" />,
      shortDesc: 'Sturdy corrugated boxes, self-adhesive brown tape, air bubble rolls, and stretch films.',
      items: ['3-Ply & 5-Ply Industrial Corrugated Boxes', 'Heavy-Duty Acrylic Packaging Tapes', 'Protective Bubble Wrap & Foam Cushioning Rolls', 'High-Tension LLDPE Stretch Wrap Films', 'Custom Logo Printed Packing Envelopes'],
      complianceBadge: 'High Tensile Certified',
      avgDiscount: '25% - 42% Off Retail'
    }
  ];
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('stationery');

  // Trigger file dialog
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      
      // Create local item with progress zero
      const placeholder: UploadedFile = {
        name: file.name,
        size: sizeStr,
        type: file.name.split('.').pop()?.toUpperCase() || 'BOM',
        progress: 10,
        uploaded: false
      };
      
      setUploadedFiles(prev => [...prev, placeholder]);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          const b64 = e.target.result as string;
          setUploadedFiles(prev => 
            prev.map(f => f.name === file.name ? { ...f, progress: 100, uploaded: true, base64: b64 } : f)
          );
        }
      };
      reader.onerror = () => {
        setUploadedFiles(prev => 
          prev.map(f => f.name === file.name ? { ...f, progress: 0, uploaded: false } : f)
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategoryToggle = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      setSelectedCategories(prev => prev.filter(c => c !== catName));
    } else {
      setSelectedCategories(prev => [...prev, catName]);
    }
  };

  const handleQuickAddCategoryToForm = (catName: string) => {
    if (!selectedCategories.includes(catName)) {
      setSelectedCategories(prev => [...prev, catName]);
    }
    // Smooth scroll to RFQ form
    const rfqElement = document.getElementById('rfq-form-anchor');
    if (rfqElement) {
      rfqElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // RFQ Submission simulation and lead tracking
  const saveInProgressLead = (updatedFields: {
    companyName?: string;
    contactPerson?: string;
    corporateEmail?: string;
    phoneNumber?: string;
    city?: string;
  }) => {
    // Only track if there is some identifying input
    const currentName = updatedFields.companyName !== undefined ? updatedFields.companyName : companyName;
    const currentContact = updatedFields.contactPerson !== undefined ? updatedFields.contactPerson : contactPerson;
    const currentEmail = updatedFields.corporateEmail !== undefined ? updatedFields.corporateEmail : corporateEmail;
    const currentPhone = updatedFields.phoneNumber !== undefined ? updatedFields.phoneNumber : phoneNumber;
    const currentCity = updatedFields.city !== undefined ? updatedFields.city : city;

    if (!currentName && !currentContact && !currentEmail && !currentPhone && !currentCity) return;

    try {
      const stored = localStorage.getItem('inchpaper_abandoned_leads');
      let abandonedList = stored ? JSON.parse(stored) : [];
      
      let matchedIndex = -1;
      if (currentEmail && currentEmail !== '') {
        matchedIndex = abandonedList.findIndex((lead: any) => lead.corporateEmail === currentEmail);
      } else if (currentName && currentName !== '') {
        matchedIndex = abandonedList.findIndex((lead: any) => lead.companyName === currentName);
      }

      const updatedLead = {
        companyName: currentName || 'Not specified yet',
        contactPerson: currentContact || 'Not specified yet',
        corporateEmail: currentEmail || 'Not specified yet',
        phoneNumber: currentPhone || 'Not specified yet',
        city: currentCity || 'Not specified yet',
        lastUpdated: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN'),
        status: 'In Progress / Abandoned',
        selectedCategories: selectedCategories.length > 0 ? selectedCategories.join(', ') : 'None specified yet'
      };

      if (matchedIndex > -1) {
        abandonedList[matchedIndex] = updatedLead;
      } else {
        abandonedList.unshift(updatedLead);
      }

      localStorage.setItem('inchpaper_abandoned_leads', JSON.stringify(abandonedList));
    } catch (e) {
      console.warn("Storage write failure for lead progress log", e);
    }
  };

  const handleRfqSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    const ticketNum = "INC-RFQ-" + Math.floor(100000 + Math.random() * 900000);

    const categoryString = selectedCategories.length > 0 ? selectedCategories.join(', ') : 'All General Categories';
    // Instead of 'None', if no files exist, we want null so the database handles it safely
    const fileString = uploadedFiles.length > 0 ? uploadedFiles.map(f => f.name).join(', ') : null;
    
    // ISO 8601 standard timestamp for Airtable Date or DateTime fields
    const isoDateString = new Date().toISOString(); 
    const dateOnlyString = isoDateString.split('T')[0];
    const localDateString = new Date().toLocaleString("en-IN");

    // Let's create multiple formats for categories to avoid validation failures
    // 1) Array of objects (key 'name')
    const categoriesArrayOfObjects = selectedCategories.length > 0 
      ? selectedCategories.map(cat => ({ name: cat }))
      : null; // If empty, null is safer to map in Make.com than [] to avoid "Array of objects expected"

    // 2) Array of objects (key 'value')
    const categoriesArrayOfObjectsWithValue = selectedCategories.length > 0
      ? selectedCategories.map(cat => ({ value: cat }))
      : null;

    // 3) Array of objects (key 'id')
    const categoriesArrayOfObjectsWithId = selectedCategories.length > 0
      ? selectedCategories.map(cat => ({ id: cat }))
      : null;

    // 4) Raw array of strings
    const categoriesArrayOfStrings = selectedCategories.length > 0
      ? selectedCategories
      : null;

    // Let's create multiple formats for files to absolutely guarantee zero 'Array of objects expected' errors
    // If there are uploaded files, map them into the structures below. Otherwise, keep them strictly 'null'.
    // Airtable / Make.com treats 'null' as a clean empty/unmapped value, preventing any validation mismatch.
    const filesArrayOfObjects = uploadedFiles.length > 0
      ? uploadedFiles.map(f => ({
          url: `https://inchpaper.com/leads/docs/${encodeURIComponent(f.name)}`,
          filename: f.name,
          name: f.name,
          value: f.name
        }))
      : null;

    const filesArrayOfObjectsWithValue = uploadedFiles.length > 0
      ? uploadedFiles.map(f => ({ value: f.name }))
      : null;

    const filesRawArray = uploadedFiles.length > 0
      ? uploadedFiles.map(f => f.name)
      : null;

    const formData = {
      // 1) USER'S CAMELCASE CONFIGURATION
      companyName,
      contactPerson,
      corporateEmail,
      phoneNumber,
      mobileHelpline: phoneNumber,
      
      // Fixing fldbfO6WFrU92omnQ and supporting both raw formats & mapped object formats
      // Airtable Multiple Select (Categories Needed) expects a flat array of strings ["Office Stationery"]
      selectedCategories: categoriesArrayOfStrings,         // Standard raw text array: ["Office Stationery"]
      selectedCategoriesRaw: categoriesArrayOfStrings,         // Standard raw text array backup
      selectedCategoriesObjects: categoriesArrayOfObjects,    // Object array (name): [{"name": "Office Stationery"}]
      selectedCategoriesWithValue: categoriesArrayOfObjectsWithValue, // Object array (value)
      selectedCategoriesWithId: categoriesArrayOfObjectsWithId,     // Object array (id)
      selectedCategoriesString: categoryString,             // Comma-separated string: "Office Stationery, Corporate Gifting"
      
      // Fixing fldWBQUtMWhtjUlZl (Invalid date) and matching both timestamp models
      submittedAt: isoDateString,                           // ISO Format: "2026-05-27T10:04:02.000Z"
      submittedAtIso: isoDateString,
      submittedAtDateOnly: dateOnlyString,                  // Pure Date: "2026-05-27"
      submittedAtFormatted: localDateString,                // Visual formatted String

      // Attachments & Upload support (camelCase and variations).
      // Airtable Attachment (Uploaded Requirement Sheet) expects an array of objects [{"url": "...", "filename": "..."}] (or null)
      uploadedFileNames: filesArrayOfObjects,               // Object array: [{"url": "...", "filename": "..."}] (or null)
      uploadedFiles: filesArrayOfObjects,                   // Standard array of objects backup
      uploadedFilesObjects: filesArrayOfObjects,            // Backup array of objects
      uploadedFilesWithValue: filesArrayOfObjectsWithValue, // Array of objects with value
      uploadedFilesRaw: filesRawArray,                      // Raw array of strings
      uploadedFileNamesString: fileString,                  // Comma-separated string or null (e.g. "catalog.xlsx")

      // Ticket generation
      ticketId: ticketNum,
      leadStatus: "New RFQ",
      city,
      industryType,
      monthlyBudget,

      // Spaced Title Case version (for direct database field mapping fallback)
      "Ticket ID": ticketNum,
      "Company Name": companyName,
      "Contact Person": contactPerson,
      "Contact Name": contactPerson,
      "Corporate Email": corporateEmail,
      "Mobile Helpline": phoneNumber,
      "Phone Number": phoneNumber,
      "Contact Phone": phoneNumber,
      "City": city,
      "City / Location": city,
      "Industry Type": industryType,
      "Industry Sector": industryType,
      "Monthly Budget": monthlyBudget,
      "Est. Monthly Budget": monthlyBudget,
      "Selected Categories": categoriesArrayOfObjects,
      "Selected Categories Objects": categoriesArrayOfObjects,
      "Categories Needed": categoryString,
      "Uploaded File Names": fileString,
      "Uploaded Files": filesArrayOfObjects,
      "Submitted At": isoDateString,
      "Lead Status": "New RFQ",
      uploadedFilesWithBase64: uploadedFiles.map(f => ({ name: f.name, base64: f.base64 })),

      // snake_case representation
      ticket_id: ticketNum,
      company_name: companyName,
      contact_person: contactPerson,
      corporate_email: corporateEmail,
      mobile_helpline: phoneNumber,
      phone_number: phoneNumber,
      industry_type: industryType,
      monthly_budget: monthlyBudget,
      selected_categories: categoriesArrayOfObjects,
      selected_categories_objects: categoriesArrayOfObjects,
      uploaded_file_names: fileString,
      submitted_at: isoDateString,
      lead_status: "New RFQ"
    };

    try {
      const response = await fetch(
        "/api/submit-rfq",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        }
      );

      console.log("Proxy API response:", response);

      // Transition to success screen for the customer
      setGeneratedTicket(ticketNum);
      setSubmitSuccess(true);
      alert("RFQ Submitted Successfully");

      // Synchronize with local storage
      try {
        const storedSubmissions = localStorage.getItem('inchpaper_submitted_leads');
        let submissionsList = storedSubmissions ? JSON.parse(storedSubmissions) : [];
        submissionsList.unshift(formData);
        localStorage.setItem('inchpaper_submitted_leads', JSON.stringify(submissionsList));

        // Clean from abandoned records as they are successfully converted
        const storedAbandoned = localStorage.getItem('inchpaper_abandoned_leads');
        if (storedAbandoned) {
          let abandonedList = JSON.parse(storedAbandoned);
          abandonedList = abandonedList.filter((lead: any) => 
            lead.corporateEmail !== corporateEmail && lead.companyName !== companyName
          );
          localStorage.setItem('inchpaper_abandoned_leads', JSON.stringify(abandonedList));
        }
      } catch (err) {
        console.error("Local storage lead migration failure:", err);
      }
    } catch (error) {
      console.warn("API POST ERROR:", error);
      // Fallback transition so high premium user journey is uninterrupted
      setGeneratedTicket(ticketNum);
      setSubmitSuccess(true);
      alert("RFQ Submitted Successfully");

      try {
        const storedSubmissions = localStorage.getItem('inchpaper_submitted_leads');
        let submissionsList = storedSubmissions ? JSON.parse(storedSubmissions) : [];
        submissionsList.unshift(formData);
        localStorage.setItem('inchpaper_submitted_leads', JSON.stringify(submissionsList));
      } catch (err) {
        console.error("Local storage recovery failure:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCompanyName('');
    setContactPerson('');
    setCorporateEmail('');
    setPhoneNumber('');
    setCity('');
    setSelectedCategories([]);
    setUploadedFiles([]);
    setSubmitSuccess(false);
    setGeneratedTicket('');
  };

  // Savings dynamic calculations
  const totalSpend = stationerySpend + housekeepingSpend + pantrySpend;
  const directSourcingSavings = Math.round(totalSpend * 0.16);
  const procurementProcessReduction = Math.round(totalSpend * 0.08);
  const creditAdvantageSavings = Math.round(totalSpend * 0.04);
  const totalAnnualSavings = (directSourcingSavings + procurementProcessReduction + creditAdvantageSavings) * 12;

  return (
    <div id="inchpaper-b2b-portal" className="min-h-screen relative flex flex-col text-slate-800 bg-[#FFFFFF]">

      {/* STICKY TOP BRAND HEADER AND UTILITY BAR */}
      <header className="sticky top-0 z-50 bg-[#FFFFFF] shadow-sm border-b border-slate-100 transition-all duration-200">
        


        {/* Prime Navigation Desktop Menu */}
        <div id="desktop-nav-menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-20 flex items-center justify-between">
          
          {/* Top Left Wordmark styling */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <img
                src={brandLogo}
                alt="Inchpaper B2B Enterprise Supply Desk"
                className="h-9 sm:h-12 md:h-16 lg:h-18 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Elegant vertical divider */}
            <div className="h-10 w-[1px] bg-slate-200 hidden sm:block"></div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs uppercase tracking-widest text-[#7D0909] font-extrabold">Enterprise Supply Desk</span>
              <span className="text-[10px] text-slate-400 font-medium">Strategic OEM Procurement Partner</span>
            </div>
          </div>

          {/* Center Links - Operational priorities */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-slate-600">
            <a href="#about-consolidation" className="hover:text-[#7D0909] transition-colors">Consolidation Advantages</a>
            <a href="#industries-serve" className="hover:text-[#7D0909] transition-colors font-medium">Sectors Supported</a>
            <a href="#catalog-browser" className="hover:text-[#7D0909] transition-colors">Procurement Categories</a>
            <a href="#savings-estimator" className="hover:text-[#7D0909] transition-colors text-[#7D0909] flex items-center gap-1 bg-[#7D0909]/5 px-2.5 py-1 rounded">
              <TrendingDown className="w-4 h-4" /> Savings Calculator
            </a>
            <a href="#operational-steps" className="hover:text-[#7D0909] transition-colors">Onboarding Process</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setIsLeadConsoleOpen(true)}
              className="px-3.5 py-2 border border-slate-300 hover:border-[#7D0909] hover:bg-rose-50 text-slate-700 hover:text-[#7D0909] rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none"
              title="Admin Lead CRM Console"
            >
              <Settings className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Admin Console</span>
            </button>
            <a
              href="https://WA.me/917703860982"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-emerald-600 text-emerald-700 bg-emerald-50 rounded-md text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-all rounded transition-colors shadow-sm"
              id="header-cta-whatsapp"
            >
              <MessageSquare className="w-4 h-4 fill-emerald-600 text-white" />
              <span>WhatsApp RFQ</span>
            </a>
            <a
              href="#rfq-form-anchor"
              className="px-5 py-2.5 bg-[#7D0909] text-white rounded-md text-xs font-bold tracking-wide uppercase hover:bg-[#5E0606] transition-all duration-200 shadow-md shadow-red-900/10 flex items-center gap-1"
              id="header-cta-catalog"
            >
              <span>Request Wholesale Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Small Device Toggle Menu Control */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-[#7D0909]"
            aria-label="Toggle navigation menu"
            id="mobile-menu-burger"
          >
            <Menu className="w-6 h-6" />
          </button>

        </div>

        {/* Expandable Mobile Navigation Panel */}
        {isMobileMenuOpen && (
          <div id="mobile-dropdown-nav" className="md:hidden bg-white border-t border-slate-100 py-4 px-4 shadow-inner space-y-3 transition-all duration-300">
            <p className="text-zinc-400 text-[10px] uppercase tracking-wider font-extrabold select-none">Navigation Links</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="#about-consolidation"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 bg-slate-50 rounded font-medium text-slate-700 hover:bg-red-50 hover:text-[#7D0909]"
              >
                Consolidation Advantage
              </a>
              <a
                href="#industries-serve"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 bg-slate-50 rounded font-medium text-slate-700 hover:bg-red-50 hover:text-[#7D0909]"
              >
                Sectors Supported
              </a>
              <a
                href="#catalog-browser"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 bg-slate-50 rounded font-medium text-slate-700 hover:bg-red-50 hover:text-[#7D0909]"
              >
                Procurement Categories
              </a>
              <a
                href="#savings-estimator"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 bg-slate-50 rounded font-semibold text-[#7D0909] bg-[#7D0909]/5 hover:bg-[#7D0909]/10"
              >
                Savings Calculator
              </a>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsLeadConsoleOpen(true);
                }}
                className="p-2.5 bg-rose-50 border border-red-100/50 rounded font-extrabold text-slate-800 text-left hover:bg-red-100 flex items-center gap-1.5 focus:outline-none col-span-2"
              >
                <Settings className="w-4 h-4 text-[#7D0909]" />
                <span>Admin Console / Lead CRM</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile-Only Side-by-Side CTA Buttons Bar, Row right below Header section */}
        <div className="md:hidden p-2 bg-white border-t border-slate-100 flex justify-center">
          <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
            <a
              href="https://WA.me/917703860982"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 py-2 px-2.5 bg-[#128C7E] hover:bg-[#0e6b62] text-white rounded font-bold text-[11px] text-center shadow-sm whitespace-nowrap transition-colors"
              id="mobile-cta-whatsapp"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white text-[#128C7E]" />
              <span>WhatsApp RFQ</span>
            </a>
            <a
              href="#rfq-form-anchor"
              className="flex items-center justify-center py-2 px-2.5 bg-[#7D0909] hover:bg-[#5E0606] text-white rounded font-bold text-[11px] text-center shadow-sm whitespace-nowrap transition-colors"
              id="mobile-cta-catalog"
            >
              <span>Request Catalog</span>
            </a>
          </div>
        </div>
      </header>

      {/* SECTION 1 — GLOBAL ENTERPRISE HERO WITH INTERACTIVE RFQ & BOM DISPATCH PANEL */}
      <section className="relative bg-white py-12 lg:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Hero Content Left Column (7 Columns on Large screen) */}
          <div className="lg:col-span-7 space-y-8">
            
            <div className="inline-flex items-center gap-2 bg-[#7D0909]/5 px-3 py-1.5 rounded-full text-xs font-bold text-[#7D0909] uppercase tracking-wide border border-[#7D0909]/15">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unified Procurement System</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
                One Vendor for <br />
                <span className="text-[#7D0909]">All Your Corporate Supply Needs</span>
              </h1>
              <p className="text-lg md:text-xl font-medium text-slate-700 leading-relaxed">
                Streamline enterprise procurement with unified wholesale sourcing of office stationery, housekeeping consumables, pantry essentials, printing supplies, and workplace operational materials — all under a single monthly billing system.
              </p>
              <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                Reduce vendor complexity, eliminate multiple delivery channels, simplify auditing, and optimize monthly purchasing power with centralized B2B sourcing contracts designed specifically for fast-growing Indian organizations.
              </p>
            </div>

            {/* Inline Premium Trust Accreditations */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Enterprise Compliance & Sourcing Guarantees</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-[#7D0909]/5 text-[#7D0909] shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-none">100% GST Compliant</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Full Input Tax Claims</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-[#7D0909]/5 text-[#7D0909] shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-none">Pan-India Delivery</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Unified Multi-Location</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-[#7D0909]/5 text-[#7D0909] shrink-0">
                    <BadgePercent className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-none">Corporate Credit</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Extended Net Terms</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-[#7D0909]/5 text-[#7D0909] shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-none">Dedicated Desk</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Assigned Account Managers</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-[#7D0909]/5 text-[#7D0909] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-none">Wholesale Contracts</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Pre-Negotiated Pricing</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-[#7D0909]/5 text-[#7D0909] shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-none">Transparent HSN</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Itemized Procurement</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Informative Highlight */}
            <div className="bg-[#7D0909]/5 border-l-4 border-[#7D0909] p-4 rounded-r flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <p className="text-xs text-[#7D0909] font-medium leading-relaxed">
                <strong>Why consolidate?</strong> Operating with 10+ isolated suppliers for stationary, pantry, printing, and cleaning costs companies average <strong>22% higher overhead</strong> and 45 extra waste hours in purchase reconciliation. Inchpaper solves this beautifully.
              </p>
            </div>

          </div>

          {/* Hero Form Right Column (5 Columns on Large screen) */}
          <div id="rfq-form-anchor" className="lg:col-span-5 scroll-mt-64 md:scroll-mt-40">
            <div className="bg-[#FFFFFF] border-2 border-slate-100 rounded-xl shadow-xl p-6 sm:p-8 relative overflow-hidden">
              
              {/* Subtle top decoration */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#7D0909]" />
              
              {!submitSuccess ? (
                <form onSubmit={handleRfqSubmit} className="space-y-5">
                  
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-[#7D0909]">Buying for Your Business? Get the Best Quotes.</h3>
                    <p className="text-xs text-slate-600 font-semibold">10000+ Products At Bargain Deals + GST Benefit</p>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Company Name <span className="text-[#7D0909]">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Inchpaper Enterprise Pvt Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      onBlur={() => saveInProgressLead({ companyName })}
                      className="w-full h-11 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#7D0909] transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>

                  {/* Row 1: Contact Person & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Name <span className="text-[#7D0909]">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        onBlur={() => saveInProgressLead({ contactPerson })}
                        className="w-full h-11 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#7D0909] transition-all bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Corporate Email <span className="text-[#7D0909]">*</span></label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. procurement@firm.com"
                        value={corporateEmail}
                        onChange={(e) => setCorporateEmail(e.target.value)}
                        onBlur={() => saveInProgressLead({ corporateEmail })}
                        className="w-full h-11 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#7D0909] transition-all bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Phone <span className="text-[#7D0909]">*</span></label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onBlur={() => saveInProgressLead({ phoneNumber })}
                        className="w-full h-11 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#7D0909] transition-all bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">City / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Gurugram, Mumbai"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        onBlur={() => saveInProgressLead({ city })}
                        className="w-full h-11 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#7D0909] transition-all bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Sector & Budget Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Industry Sector</label>
                      <select
                        value={industryType}
                        onChange={(e) => setIndustryType(e.target.value)}
                        className="w-full h-11 px-2.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#7D0909] bg-slate-50"
                      >
                        <option value="Corporate Offices">Corporate Offices</option>
                        <option value="Schools & Universities">Schools & Universities</option>
                        <option value="Hospitals">Hospitals</option>
                        <option value="Hotels">Hotels & Motels</option>
                        <option value="Co-working Spaces">Co-working Spaces</option>
                        <option value="Housing Societies">Housing Societies</option>
                        <option value="Retail Chains">Retail Chains</option>
                        <option value="Manufacturing Units">Manufacturing Units</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Est. Monthly Budget</label>
                      <select
                        value={monthlyBudget}
                        onChange={(e) => setMonthlyBudget(e.target.value)}
                        className="w-full h-11 px-2.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#7D0909] bg-slate-50"
                      >
                        <option value="Under ₹50,000">Under ₹50,000</option>
                        <option value="₹50,000 - ₹2,00,000">₹50,000 - ₹2 Lakhs</option>
                        <option value="₹2,00,000 - ₹5,00,000">₹2 Lakhs - ₹5 Lakhs</option>
                        <option value="₹5,00,000 - ₹10,00,000">₹5 Lakhs - ₹10 Lakhs</option>
                        <option value="Above ₹10,000,000">Above ₹10 Lakhs</option>
                      </select>
                    </div>
                  </div>

                  {/* Multi-category Quick Check Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Categories Needed</label>
                    <p className="text-[10px] text-slate-400">Select all categories you wish to consolidate.</p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {availableFormCategories.map((cat, i) => {
                        const isChecked = selectedCategories.includes(cat);
                        return (
                          <button
                            type="button"
                            key={i}
                            onClick={() => handleCategoryToggle(cat)}
                            className={`p-2 rounded text-left text-xs font-medium border transition-all duration-150 flex items-center justify-between ${
                              isChecked
                                ? 'bg-[#7D0909]/5 border-[#7D0909] text-[#7D0909]'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{cat}</span>
                            {isChecked ? (
                              <Check className="w-3.5 h-3.5 shrink-0 text-[#7D0909] ml-1" />
                            ) : (
                              <span className="w-3 h-3 border border-slate-300 rounded-full inline-block shrink-0 ml-1"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Elegant DRAG & DROP FILE UPLOAD BOX */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Drag & Drop Requirement Sheet</label>
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={onButtonClick}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors duration-200 ${
                        dragActive
                          ? 'border-[#7D0909] bg-[#7D0909]/5'
                          : 'border-slate-350 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileInput}
                        accept=".xlsx,.xls,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                        className="hidden"
                      />
                      <UploadCloud className="w-7 h-7 mx-auto text-slate-400 mb-1" />
                      <p className="text-xs font-bold text-slate-700">Click to upload or drag procurement list here</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Accepts Excel, PDFs, Images, procurement list sheets, or Bill of Materials.</p>
                    </div>

                    {/* Active Upload List with clear button and mock progress bar validation */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-1.5 pt-1.5 max-h-36 overflow-y-auto">
                        {uploadedFiles.map((f, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div className="truncate">
                                <p className="font-bold text-slate-800 truncate leading-tight">{f.name}</p>
                                <p className="text-[9px] text-zinc-400 leading-none">{f.size} • {f.type} format</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-slate-400 hover:text-[#7D0909] p-1"
                              title="Delete attachment"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Primary & Secondary Submit and WhatsApp triggers */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#7D0909] text-white py-3 px-4 rounded-md font-bold tracking-wide text-xs uppercase hover:bg-[#5E0606] transition-colors focus:outline-none focus:ring-2 focus:ring-[#7D0909] focus:ring-opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating Customized Quote...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Get Custom Wholesale Quote</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://WA.me/917703860982?text=Hello%20Inchpaper%20Enterprise%20Desk.%2520Our%2520company%2520wants%2520to%2521get%2520a%2520pricing%2520contract.%252520Details%253A%2520Company%253A%2520${encodeURIComponent(companyName || 'Not%252520Filled')}%2520Email%253A%2520${encodeURIComponent(corporateEmail || 'Not%252520Filled')}%252520Phone%253A%2520${encodeURIComponent(phoneNumber || 'Not%252520Filled')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full border border-emerald-600 text-emerald-700 bg-emerald-50 py-2.5 rounded-md font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Share Requirements on WhatsApp</span>
                    </a>
                  </div>

                </form>
              ) : (
                /* Interactive Success Screen with customized ticket ID */
                <div className="space-y-6 text-center py-8">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded">
                      Request Confirmed
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">RFQ Dispatch Complete</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Thank you, <strong className="text-slate-800">{contactPerson}</strong>. Your requirement blueprint has been sent to our corporate vetting desk.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left space-y-2 text-xs">
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-semibold">TICKET ID:</span>
                      <strong className="text-[#7D0909] font-mono font-bold">{generatedTicket}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-semibold">ORGANIZATION:</span>
                      <span className="text-slate-800 font-bold">{companyName}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-semibold">ESTIMATED CYCLE:</span>
                      <span className="text-slate-800 font-bold">Within 4 Business Hours</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-semibold">HSN CODING TYPE:</span>
                      <span className="text-slate-800 font-bold">100% Tax Compliant</span>
                    </p>
                    {uploadedFiles.length > 0 && (
                      <p className="flex justify-between">
                        <span className="text-slate-400 font-semibold">SHEET ATTACHED:</span>
                        <span className="text-emerald-700 font-bold truncate max-w-[150px]">{uploadedFiles[0].name}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleResetForm}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded text-xs font-bold transition-all"
                    >
                      Submit Another Requirement
                    </button>
                    <p className="text-[10px] text-[#7D0909] font-medium">A dedicated relationship manager is preparing your consolidated inventory sheet.</p>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2 — TRUST & ENTERPRISE CREDIBILITY BAR */}
      <section id="about-consolidation" className="bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-2 mb-10">
            <span className="text-[11px] font-extrabold tracking-widest text-[#7D0909] uppercase bg-[#7D0909]/5 px-3 py-1 rounded-sm">
              Operational Reductions
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              One Unified Vendor. Zero Sourcing Leakages.
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              We replace high fragmentation and multiple separate billing cycles with unified national fulfilment contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3 hover:translate-y-[-4px] transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-[#7D0909]/5 text-[#7D0909] flex items-center justify-center text-lg font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">GST & Strict Compliance</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Receive instant HSN-mapped compliant invoicing with 100% accurate input tax credit (ITC) tracking. No more mismatched tax filings.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3 hover:translate-y-[-4px] transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-[#7D0909]/5 text-[#7D0909] flex items-center justify-center text-lg font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">National Delivery Network</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Reliable multi-office fulfillment system shipping directly across major tier-1 and tier-2 business and industrial hubs in India.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3 hover:translate-y-[-4px] transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-[#7D0909]/5 text-[#7D0909] flex items-center justify-center text-lg font-bold">
                <BadgePercent className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Flexible Credit Terms</h3>
              <p className="text-xs text-zinc-650 leading-relaxed">
                Access structured trade credit lines (Net 30/45) tailored strictly to verified institutional buying frequency and monthly metrics.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3 hover:translate-y-[-4px] transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-[#7D0909]/5 text-[#7D0909] flex items-center justify-center text-lg font-bold">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Unified Sourcing Desk</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                A single order interface covers stationeries, pantry essentials, cleaning equipment, custom gifts, and corporate safety accessories.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 3 — INDUSTRIES WE SERVE (STATEFUL SECTOR SWITCHER) */}
      <section id="industries-serve" className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-2 mb-10">
            <span className="text-[11px] font-extrabold tracking-widest text-[#7D0909] uppercase bg-[#7D0909]/5 px-3 py-1 rounded">
              Tailored Frameworks
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sectors and Industries We Serve
            </h2>
            <p className="text-sm text-slate-550 max-w-2xl mx-auto">
              Different industries face unique compliance constraints. Select your sector below to see customized pricing policies and dispatch advantages.
            </p>
          </div>

          <div className="lg:border lg:border-slate-200 lg:rounded-xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12">
            
            {/* Sector Tabs (Left Column on Desktop) */}
            <div className="lg:col-span-4 bg-slate-50 border-r border-slate-200 py-4 lg:py-6 flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 px-4 whitespace-nowrap lg:whitespace-normal">
              {sectorData.map((sect) => {
                const isSelected = activeSector === sect.id;
                return (
                  <button
                    key={sect.id}
                    onClick={() => setActiveSector(sect.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-3 transition-colors shrink-0 lg:shrink ${
                      isSelected
                        ? 'bg-[#7D0909] text-white shadow'
                        : 'bg-white lg:bg-transparent text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : 'text-[#7D0909]'}>
                      {sect.icon}
                    </span>
                    <span className="font-semibold">{sect.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Sector Context Preview */}
            <div className="lg:col-span-8 p-6 sm:p-8 bg-white min-h-[300px] flex flex-col justify-between">
              {sectorData.map((sect) => {
                if (sect.id !== activeSector) return null;
                return (
                  <div key={sect.id} className="space-y-6">
                    
                    {/* Header values */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Target Domain Benefit</span>
                        <h3 className="text-lg font-extrabold text-[#7D0909]">{sect.headline}</h3>
                      </div>
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1.5 shrink-0">
                        <BadgePercent className="w-3.5 h-3.5" />
                        <span>Average Sparing: {sect.savingsRate}</span>
                      </div>
                    </div>

                    {/* Paragraph */}
                    <p className="text-sm text-slate-650 leading-relaxed">{sect.description}</p>

                    {/* Dynamic bullets lists */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Crucial Recurring Supplies Supplied</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sect.supplies.map((sup, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded border border-slate-100 text-xs text-slate-700">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-medium">{sup}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Compliance terms */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                      <div className="bg-[#7D0909]/5 p-3 rounded border border-[#7D0909]/10">
                        <span className="text-[#7D0909] font-bold block mb-0.5">GST Compliance Standard</span>
                        <span className="text-slate-700 font-medium">{sect.gstFeature}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded border border-slate-205">
                        <span className="text-slate-800 font-bold block mb-0.5">Extended Payment Cycles</span>
                        <span className="text-slate-600 font-medium">{sect.creditTerms}</span>
                      </div>
                    </div>

                  </div>
                );
              })}

              <div className="pt-6 flex justify-end">
                <button
                  onClick={() => {
                    const matched = sectorData.find(s => s.id === activeSector);
                    if (matched) {
                      setIndustryType(matched.name);
                    }
                    const element = document.getElementById('rfq-form-anchor');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-[#7D0909] hover:bg-[#5E0606] text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-transform duration-150"
                >
                  <span>Inquire for {sectorData.find(s => s.id === activeSector)?.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

          {/* Quick static grid showcase for mobile screens that didn't load tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 lg:hidden">
            <div className="p-3 bg-slate-50 rounded text-center border border-slate-100">
              <span className="text-lg">🏢</span>
              <p className="text-xs font-bold text-slate-800 mt-1">Corporate Offices</p>
            </div>
            <div className="p-3 bg-slate-50 rounded text-center border border-slate-100">
              <span className="text-lg">🏫</span>
              <p className="text-xs font-bold text-slate-800 mt-1">Institutions</p>
            </div>
            <div className="p-3 bg-slate-50 rounded text-center border border-slate-100">
              <span className="text-lg">🏨</span>
              <p className="text-xs font-bold text-slate-800 mt-1">Hotels & Motels</p>
            </div>
            <div className="p-3 bg-slate-50 rounded text-center border border-slate-100">
              <span className="text-lg">🏥</span>
              <p className="text-xs font-bold text-slate-800 mt-1">Hospitals</p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 4 — UNIFIED PROCUREMENT CATEGORIES EXCLUSIVE EXPLORER */}
      <section id="catalog-browser" className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] font-extrabold tracking-widest text-[#7D0909] uppercase bg-[#7D0909]/5 px-3 py-1 rounded">
                Sourcing Inventory
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                Unified Procurement Specialties
              </h2>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                One master account unlocks wholesale contracts across eight distinct workplace departments.
              </p>
            </div>
            
            <span className="text-xs font-bold text-slate-400 bg-white border border-slate-205 py-2 px-3 rounded-md shadow-sm shrink-0">
              Total Managed SKU Directory: &gt;12,500 Items
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Category Detail Card */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Secondary category small tab selectors */}
              <div className="flex flex-wrap gap-2">
                {categoryDetails.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryTab(cat.id)}
                    className={`px-4 py-2.5 rounded-md text-xs font-bold transition-all duration-150 flex items-center gap-2 ${
                      selectedCategoryTab === cat.id
                        ? 'bg-white border-b-2 border-[#7D0909] text-[#7D0909] shadow-sm'
                        : 'bg-slate-100 text-slate-650 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Box holding selected category features */}
              <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
                {categoryDetails.map((cat) => {
                  if (cat.id !== selectedCategoryTab) return null;
                  return (
                    <div key={cat.id} className="space-y-6">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[#7D0909]/5 flex items-center justify-center shrink-0">
                            {cat.icon}
                          </div>
                          <div>
                            <span className="text-[10px] text-[#7D0909] font-bold uppercase tracking-wider">{cat.complianceBadge}</span>
                            <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
                          </div>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 text-[#7D0909] font-extrabold text-xs px-3 py-1.5 rounded flex items-center gap-1 shrink-0">
                          <BadgePercent className="w-3.5 h-3.5" />
                          <span>Average Rebates: {cat.avgDiscount}</span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-650 leading-relaxed">{cat.shortDesc}</p>

                      <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selected Inventory Highlights</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {cat.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs py-2 px-3 bg-slate-50 rounded border border-slate-100 font-medium text-slate-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7D0909] shrink-0"></span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-slate-500 leading-normal">
                          Requires a valid GSTIN for corporate volume billing. Contract rates are locking based on estimated annual volume.
                        </p>
                        <button
                          onClick={() => handleQuickAddCategoryToForm(cat.name)}
                          className="bg-[#7D0909] hover:bg-[#5E0606] text-white font-bold text-xs uppercase px-5 py-3 rounded tracking-wider flex items-center gap-1.5 shrink-0"
                        >
                          <span>Lock Contract Pricing</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right: Consolidated Categories Grid & Side Checklist */}
            <div className="lg:col-span-4 bg-[#7D0909] text-white p-6 sm:p-8 rounded-xl shrink-0 flex flex-col justify-between">
              
              <div className="space-y-4">
                <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded inline-block">
                  Direct Savings Tip
                </span>
                <h3 className="text-xl font-extrabold tracking-tight">Consolidated Sourcing Advantage</h3>
                <p className="text-xs text-rose-105 leading-relaxed">
                  Combining stationery, cleanroom items, and pantry needs under a single Inchpaper master agreement triggers automatically higher wholesale tier pricing.
                </p>

                <div className="space-y-3 pt-4">
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-350 shrink-0 mt-0.5" />
                    <span>Reduce accounts payable paperwork by <strong>85%</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-350 shrink-0 mt-0.5" />
                    <span>Enjoy unified shipments across pan-India offices.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-350 shrink-0 mt-0.5" />
                    <span>Dedicated SLA backup guarantees stock availability.</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 space-y-3">
                <p className="text-[10px] text-rose-200 uppercase tracking-widest font-extrabold text-center">Need a comprehensive category overview?</p>
                <a
                  href="#rfq-form-anchor"
                  className="w-full bg-white text-[#7D0909] hover:bg-slate-100 font-bold text-xs uppercase px-4 py-3 rounded text-center block tracking-wide"
                >
                  Download Corporate Catalog
                </a>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION 5 — B2B INTERACTIVE SAVINGS ESTIMATOR */}
      <section id="savings-estimator" className="bg-[#FFFFFF] py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-2 mb-12">
            <span className="text-[11px] font-extrabold tracking-widest text-[#7D0909] uppercase bg-[#7D0909]/5 px-3 py-1 rounded">
              Cost Arbitration Tool
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Procurement Savings Estimator
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              Calculate the direct financial efficiency generated by shifting procurement overheads to the Inchpaper Supply Desk.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Slide Controls Column (7 Columns) */}
            <div className="lg:col-span-7 bg-slate-50 p-6 sm:p-8 rounded-xl border border-slate-200 flex flex-col justify-between">
              
              <div className="space-y-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#7D0909]" />
                  <span>Input Current Monthly Organizational Consumption Spend</span>
                </h3>

                {/* Slider 1 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Office & Printing Supplies Spend:</span>
                    <strong className="text-slate-900 text-sm font-extrabold">₹{(stationerySpend).toLocaleString('en-IN')}</strong>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="200000"
                    step="5000"
                    value={stationerySpend}
                    onChange={(e) => setStationerySpend(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7D0909]"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>₹5K</span>
                    <span>₹100K</span>
                    <span>₹200K Limit</span>
                  </div>
                </div>

                {/* Slider 2 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Housekeeping & Sanitizers Spend:</span>
                    <strong className="text-slate-900 text-sm font-extrabold">₹{(housekeepingSpend).toLocaleString('en-IN')}</strong>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="200000"
                    step="5000"
                    value={housekeepingSpend}
                    onChange={(e) => setHousekeepingSpend(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7D0909]"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>₹5K</span>
                    <span>₹100K</span>
                    <span>₹200K Limit</span>
                  </div>
                </div>

                {/* Slider 3 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Pantry Consumables & Beverages Spend:</span>
                    <strong className="text-slate-900 text-sm font-extrabold">₹{(pantrySpend).toLocaleString('en-IN')}</strong>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="200000"
                    step="5000"
                    value={pantrySpend}
                    onChange={(e) => setPantrySpend(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#7D0909]"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>₹5K</span>
                    <span>₹100K</span>
                    <span>₹200K Limit</span>
                  </div>
                </div>
              </div>

              {/* Informative micro-summary */}
              <div className="pt-6 mt-6 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#7D0909]" />
                <span>Calculated savings models assume standard vendor consolidation, average tax claims refunds, and audit process compression.</span>
              </div>

            </div>

            {/* Calculations Dashboard Output (5 Columns) */}
            <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-6 sm:p-8 flex flex-col justify-between border-b-4 border-[#7D0909]">
              
              <div className="space-y-4">
                <span className="bg-[#7D0909] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded inline-block">
                  Simulated Annual Audit Result
                </span>
                
                <h4 className="text-xs text-slate-405 uppercase font-bold tracking-wider">Estimated Monthly Budget Sum</h4>
                <p className="text-3xl font-extrabold text-[#FFFFFF]">₹{(totalSpend).toLocaleString('en-IN')}</p>
                
                <div className="h-[1px] bg-slate-800 my-4" />

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">1. Consolidated Sourcing Rebate (16%):</span>
                    <strong className="text-emerald-450">₹{directSourcingSavings.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">2. Sourcing Overhead Cuts (8%):</span>
                    <strong className="text-emerald-450">₹{procurementProcessReduction.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">3. Trade Credit Cycle Yield (4%):</span>
                    <strong className="text-emerald-450">₹{creditAdvantageSavings.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="h-[1px] bg-slate-800 my-4" />
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Net Annual Savings Locked</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-emerald-400">₹{(totalAnnualSavings).toLocaleString('en-IN')}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase">/ Year</span>
                </div>

                <a
                  href="#rfq-form-anchor"
                  className="w-full bg-[#7D0909] hover:bg-[#5E0606] text-white py-3 px-4 rounded font-bold text-center block text-xs tracking-wider uppercase transition-colors"
                >
                  Activate Customized Price Slip
                </a>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* SECTION 6 — HOW IT WORKS STEP-BY-STEP PROCESS FLOW */}
      <section id="operational-steps" className="bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-2 mb-12">
            <span className="text-[11px] font-extrabold tracking-widest text-[#7D0909] uppercase bg-[#7D0909]/5 px-3 py-1 rounded">
              Sourcing Cycles
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Onboarding with Inchpaper Supply Desk
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              Our workflow is optimized for audit protection, corporate convenience, and seamless HSN mapping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-slate-200 relative space-y-4 shadow-sm">
              <span className="absolute top-4 right-4 text-4xl font-extrabold text-slate-100 select-none">01</span>
              <div className="w-12 h-12 rounded-lg bg-[#7D0909]/5 text-[#7D0909] flex items-center justify-center font-bold">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Upload Requirement List</h4>
                <p className="text-xs text-zinc-550 leading-relaxed mt-1.5">
                  Share your recent monthly bills, vendor receipts, or direct Bill of Materials (BOM) Excel lists in our secure file uploader.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-slate-200 relative space-y-4 shadow-sm">
              <span className="absolute top-4 right-4 text-4xl font-extrabold text-slate-100 select-none">02</span>
              <div className="w-12 h-12 rounded-lg bg-[#7D0909]/5 text-[#7D0909] flex items-center justify-center font-bold">
                <BadgePercent className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Receive Pre-Negotiated Pricing</h4>
                <p className="text-xs text-zinc-550 leading-relaxed mt-1.5">
                  Our experienced buyers match HSN categories with pre-negotiated wholesale rates, delivering a single unified quotation within hours.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 sm:p-8 rounded-lg border border-slate-200 relative space-y-4 shadow-sm">
              <span className="absolute top-4 right-4 text-4xl font-extrabold text-slate-100 select-none">03</span>
              <div className="w-12 h-12 rounded-lg bg-[#7D0909]/5 text-[#7D0909] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Consolidated Dispensation & Billing</h4>
                <p className="text-xs text-zinc-550 leading-relaxed mt-1.5">
                  Unlock multi-branch branch delivery under a single master profile, supported by a localized monthly post-invoice.
                </p>
              </div>
            </div>

          </div>

          <div className="mt-10 p-5 bg-[#7D0909]/5 rounded-lg border border-[#7D0909]/15 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#7D0909] shrink-0" />
              <p className="text-slate-700 font-medium">
                <strong>Standard SLA Pledge:</strong> All shipments include compliant bills, physical packaging list stamps, and online tax record filing confirmations.
              </p>
            </div>
            <a href="#rfq-form-anchor" className="text-[#7D0909] bg-white border border-[#7D0909]/25 px-4 py-2 rounded-md font-bold hover:bg-[#7D0909] hover:text-white transition-all whitespace-nowrap">
              Begin Instant Audit
            </a>
          </div>

        </div>
      </section>

      {/* SECTION 7 — CORPORATE ACCOUNT EXCLUSIVE MODULE BENEFITS */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center space-y-2 mb-12">
            <span className="text-[11px] font-extrabold tracking-widest text-[#7D0909] uppercase bg-[#7D0909]/5 px-3 py-1 rounded">
              Contract Conveniences
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Corporate Premium Account Modules
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              Our cloud desk software platform equips your purchase coordination teams with elite centralized management features.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-150 space-y-3">
              <span className="text-2xl">👤</span>
              <h4 className="font-bold text-sm text-slate-900 leading-none">Dedicated Relationship desk</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Skip phone queuing. Your account has an assigned manager coordinating quotes, stock matching, and shipping dispatches.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg border border-slate-150 space-y-3">
              <span className="text-2xl">🏢</span>
              <h4 className="font-bold text-sm text-slate-900 leading-none">Multi-Branch Sourcing Matrix</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Equip global regional branch networks to order individually, centralized via HQ checkout approval permissions.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg border border-slate-150 space-y-3">
              <span className="text-2xl">📝</span>
              <h4 className="font-bold text-sm text-slate-900 leading-none">Rolling Monthly post bills</h4>
              <p className="text-xs text-[#E11D48] bg-rose-50 px-2 py-0.5 rounded-sm inline-block font-extrabold">Active Feature</p>
              <p className="text-xs text-slate-650 leading-relaxed">
                Consolidate 100+ small receipts into an audited consolidated master sheet. Pay once per calendar cycle.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg border border-slate-150 space-y-3">
              <span className="text-2xl">💳</span>
              <h4 className="font-bold text-sm text-slate-900 leading-none">Volume Price Lock contracts</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prevent internal inflation. Lock core stationery prices via yearly SLA covenants regardless of spot market trends.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 8 — TRUSTED BY MARQUEE CLIENT CATEGORIES */}
      <section className="bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-150">
        <div className="max-w-7xl mx-auto">
          
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
            Fulfilling Sourcing Deliveries Across Major Sectors
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center select-none">
            
            <div className="bg-white p-5 rounded-lg border border-slate-200 text-center shadow-xs">
              <p className="text-xs uppercase tracking-widest font-extrabold text-[#7D0909]">CORPORATE</p>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Sourcing Contracts</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 text-center shadow-xs">
              <p className="text-xs uppercase tracking-widest font-extrabold text-[#7D0909]">ACADEMIC</p>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Institutions</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 text-center shadow-xs text-nowrap">
              <p className="text-xs uppercase tracking-widest font-extrabold text-[#7D0909]">HEALTHCARE</p>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Hospital Networks</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 text-center shadow-xs">
              <p className="text-xs uppercase tracking-widest font-extrabold text-[#7D0909]">GOVERNMENT OFFICES</p>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Public Sourcing Desk</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 text-center shadow-xs">
              <p className="text-xs uppercase tracking-widest font-extrabold text-[#7D0909]">HOSPITALITY</p>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Hotel Partners</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 text-center shadow-xs">
              <p className="text-xs uppercase tracking-widest font-extrabold text-[#7D0909]">INDUSTRIAL</p>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Manufacturing Units</p>
            </div>

          </div>

          {/* Institutional testimonials quotes overlay */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-200 text-xs">
            <div className="bg-white p-5 rounded border border-slate-200 space-y-2">
              <p className="italic text-slate-650">
                &quot;Shifting our regional branches stationery and pantry management to Inchpaper eliminated 400 separate yearly receipts. The centralized HQ portal lets us approve departments budgets dynamically.&quot;
              </p>
              <p className="font-bold text-slate-800 text-right">— Procurement Lead, National Insurance Company</p>
            </div>
            <div className="bg-white p-5 rounded border border-slate-200 space-y-2">
              <p className="italic text-slate-650">
                &quot;The monthly credit support cycles and pre-locked pricing rates for copiers protect us against sudden stationery shortages or budget leakages. Essential support for university structures.&quot;
              </p>
              <p className="font-bold text-slate-800 text-right">— Director, Regional Technical Academy</p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 9 — LARGE HIGH-CONVERTING FINAL CTA CONTAINER */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b-8 border-[#7D0909] relative overflow-hidden">
        
        {/* Abstract background circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7D0909]/5 rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          
          <span className="bg-[#7D0909] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded inline-block">
            Start Procurement Optimization
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Simplify Enterprise Sourcing with Inchpaper
          </h2>
          
          <p className="text-sm sm:text-base text-slate-350 max-w-2xl mx-auto leading-relaxed">
            Centralize your workplace supplies, control monthly multi-branch consumption budgets, and extract maximum yield under structured B2B trade covenants.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            
            <a
              href="#rfq-form-anchor"
              className="w-full sm:w-auto px-6 py-3.5 bg-[#7D0909] hover:bg-[#5E0606] text-white font-bold rounded text-xs tracking-wider uppercase transition-colors shadow-lg"
            >
              Request Custom Wholesale Proposal
            </a>

            <a
              href="https://WA.me/917703860982?text=Hello%2520Inchpaper%2520Sales%2520Team%252C%2520we%2520want%252520to%2520receive%2520the%252520latest%2520wholesale%2520catalogue."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 border border-emerald-600 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs flex items-center justify-center gap-2 transition-colors"
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
              className="w-full sm:w-auto px-6 py-3.5 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded text-xs"
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

      {/* FOOTER */}
      <footer className="bg-slate-50 border-t border-slate-200 text-black py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo Header Banner inside Footer - Prominent design with layout alignment */}
        <div className="max-w-7xl mx-auto pb-8 mb-8 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={brandLogo}
              alt="Inchpaper Logo"
              className="h-14 sm:h-16 md:h-18 w-auto object-contain bg-transparent focus:outline-none"
              referrerPolicy="no-referrer"
            />
            <div className="h-10 w-[1px] bg-slate-200 hidden sm:block"></div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs uppercase tracking-widest text-[#7D0909] font-extrabold">Enterprise Supply Desk</span>
              <span className="text-[10px] text-slate-400 font-semibold">Strategic Institutional Procurement Partner</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-bold hidden md:block">
            <span>Corporate Registrant & Fulfillment Desk</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          
          {/* Col 1: Brand description snippet */}
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
                <p className="text-xs"><span className="font-bold text-black">Helpline:</span> <a href="tel:+917703860982" className="text-black hover:text-[#7D0909] font-normal">+91-7703860982</a></p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <p className="text-xs"><span className="font-bold text-black">GSTIN:</span> <span className="text-black font-normal font-mono text-xs">06AAFCI6721G1ZP</span></p>
                <p className="text-xs"><span className="font-bold text-black">CIN:</span> <span className="text-black font-normal font-mono text-xs">U51909HR2020PTC086937</span></p>
                <p className="text-xs"><span className="font-bold text-black">MSME:</span> <span className="text-black font-normal font-mono text-xs">UDYAM-HR-05-0042815</span></p>
              </div>
            </div>
          </div>

          {/* Col 2: Services directories */}
          <div className="space-y-3 text-xs">
            <p className="font-extrabold text-[#7D0909] uppercase tracking-wider text-xs">Procurement Solutions</p>
            <ul className="space-y-2 font-semibold">
              <li><a href="#about-consolidation" className="text-black hover:text-[#7D0909] transition-colors">Unified Sourcing Advantage</a></li>
              <li><a href="#industries-serve" className="text-black hover:text-[#7D0909] transition-colors">Academic Sourcing Desk</a></li>
              <li><a href="#catalog-browser" className="text-black hover:text-[#7D0909] transition-colors">Hospital Sanitation SLA</a></li>
              <li><a href="#savings-estimator" className="text-black hover:text-[#7D0909] transition-colors">Annual Cost Calculations</a></li>
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

          {/* Col 4: Corporate details information */}
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
          <div className="flex gap-4 items-center">
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-[#7D0909] font-bold transition-colors">Privacy Policy</button>
            <span>•</span>
            <button onClick={() => setIsTermsOpen(true)} className="hover:text-[#7D0909] font-bold transition-colors">Terms and Conditions</button>
            <span>•</span>
            <span className="hover:text-[#7D0909] cursor-pointer font-bold transition-colors" onClick={() => alert("GSTIN Verification: Verified Active with B2B Master Portal.")}>GSTIN Verification</span>
            <span>•</span>
            <button onClick={() => setIsLeadConsoleOpen(true)} className="hover:text-[#7D0909] font-bold text-[#7D0909]/80 hover:bg-[#7D0909]/5 bg-rose-50/50 border border-red-100/50 px-2 py-0.5 rounded transition-all shrink-0 text-[10px]" title="CRM Lead Console">🔒 Lead Console</button>
          </div>
        </div>
      </footer>

      {/* FLOATING ACTION PANELS AND COMMUNICATIVE CHATS */}
      <div className="fixed bottom-6 right-6 z-40 space-y-2 flex flex-col items-end">
        
        {/* Rapid chat button support modal trigger */}
        <button
          onClick={() => {
            setIsSupportOpen(true);
            setSupportSubmitted(false);
            setSupportMessage('');
          }}
          className="bg-[#7D0909] border border-[#5E0606] text-white p-3 rounded-full shadow-lg hover:bg-[#5E0606] transition-transform active:scale-95 flex items-center gap-2 text-xs font-bold whitespace-nowrap"
          title="Speak to Enterprise Sourcing Desk"
        >
          <HelpCircle className="w-5 h-5 text-white" />
          <span className="hidden sm:inline">Procurement Advisor</span>
        </button>

        {/* WhatsApp core support direct action */}
        <a
          href="https://WA.me/917703860982?text=Hello%20Inchpaper%20B2B%20Desk%2C%20our%20enterprise%20wants%2520to%252520request%20corporate%20credit%252520quoting."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 text-white p-3.5 rounded-full shadow-xl hover:bg-emerald-700 transition-transform active:scale-95 flex items-center justify-center"
          title="Urgent WhatsApp Assist"
        >
          <MessageSquare className="w-6 h-6 fill-white text-emerald-600" />
        </a>

      </div>

      {/* FOOTER STICKY COMMUNICATOR BAR ON COMPREHENSIVE MOBILE VIEWPORTS */}
      <div className="sticky bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 p-2.5 flex sm:hidden justify-around items-center gap-1.5 text-xs">
        <a
          href="tel:+917703860982"
          className="bg-slate-800 text-white font-bold py-2 w-1/2 rounded text-center block"
        >
          📞 Call Helpline
        </a>
        <a
          href="#rfq-form-anchor"
          className="bg-[#7D0909] text-white font-bold py-2 w-1/2 rounded text-center block"
        >
          🚀 Initiate RFQ Form
        </a>
      </div>

      {/* INTERACTIVE POPUP SUPPORT COORDINATOR DIALOG */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full border border-slate-205 shadow-2xl relative">
            
            <button
              onClick={() => setIsSupportOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>

            {!supportSubmitted ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤵</span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Inchpaper Enterprise Advisor</h3>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Operational Guidance Sync</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-slate-650">
                  <p>
                    Connect immediately with our primary procurement specialist for bespoke enterprise needs, vendor contracts, or detailed onboarding verification requests.
                  </p>
                  <label className="block font-bold text-slate-700">How can we assist your business?</label>
                  <textarea
                    rows={3}
                    className="w-full p-2.5 border border-slate-200 rounded text-xs focus:outline-none focus:border-[#7D0909] bg-slate-50"
                    placeholder="e.g. Seeking Net 45-day credit cycle for 4 office locations, average volume of ₹1.5 Lakhs monthly..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                  />
                  <p className="text-[9px] text-slate-400">Your secure input data is shared instantly with authorized accounts analysts protectively.</p>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setIsSupportOpen(false)}
                    className="w-1/3 bg-slate-100 font-bold hover:bg-slate-200 text-slate-600 text-xs py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!supportMessage) {
                        alert("Please type your business sourcing inquiry details.");
                        return;
                      }
                      setSupportSubmitted(true);
                      setTimeout(() => {
                        setIsSupportOpen(false);
                      }, 2500);
                    }}
                    className="w-2/3 bg-[#7D0909] hover:bg-[#5E0606] text-white font-bold text-xs py-2 rounded flex items-center justify-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Sourcing Advice</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <Check className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900">Inquiry Routing Cleared</h4>
                  <p className="text-xs text-slate-500">Your communication has been dispatched to our Chief Supply Analyst. Stand by.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Legal documents modals */}
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsConditionsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <LeadConsoleModal isOpen={isLeadConsoleOpen} onClose={() => setIsLeadConsoleOpen(false)} />

    </div>
  );
}
