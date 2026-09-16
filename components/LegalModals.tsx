import React from 'react';
import { X, Shield, Scale, FileText, Check } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7D0909]/10 flex items-center justify-center text-[#7D0909]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#7D0909]">Privacy Policy</h2>
              <p className="text-xs text-slate-500 font-medium">Inchpaper Private Limited</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable readable text */}
        <div className="p-6 overflow-y-auto text-sm text-slate-800 space-y-4 leading-relaxed font-sans">
          <p className="font-semibold text-slate-900">
            This Privacy Policy outlines Inchpaper Private Limited’s approach to Data Protection and Privacy to fulfill its obligations under the applicable laws and regulations. This Privacy Policy applies to your Personal Data which is processed by us, whether in physical or electronic mode.
          </p>
          <p>
            In this Privacy Policy, the expressions &lsquo;Personal Data&rsquo;, &lsquo;Data Subject&rsquo;, &lsquo;Controller&rsquo;, &lsquo;Processor&rsquo; and &lsquo;Processing&rsquo; shall have the meanings given to them in the applicable privacy laws.
          </p>
          <p>
            We are committed to treating data privacy seriously. It is important that you know exactly what we do with your Personal Data.
          </p>
          <p>
            Throughout this document, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;, &ldquo;ours&rdquo; refer to Inchpaper Private Limited. Wherever we have said &lsquo;you&rsquo; or &lsquo;your&rsquo;, this means YOU (as a Data Subject).
          </p>

          <hr className="border-slate-100 my-4" />

          {/* Who we are */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#7D0909]">Who we are</h3>
            <p>
              Inchpaper Private Limited is a company incorporated and registered under the provisions of the Companies Act, 2013 and having its registered office at 37/4, 2nd Floor, Inderpuri, Jacobpura, Gurgaon 122001, Haryana, India. Inchpaper Private Limited is engaged in the business of facilitating selling, marketing, and retailing stationery, office supply, textbooks, workbooks, notebooks, storybooks (&ldquo;Business&rdquo;) through the e-commerce websites and mobile applications (&ldquo;App&rdquo;) both developed and owned by Inchpaper Private Limited and its affiliates (Website and App collectively referred to as &ldquo;Platform&rdquo;) or offline stores/events to conduct its Business.
            </p>
          </div>

          {/* Roles We Play */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#7D0909]">Roles we play</h3>
            <p>
              We play the role of a Data Controller when we collect and process Personal Data about you.<br />
              We play the role of a Data Processor when we collect and process Personal Data on behalf of another Data Controller.
            </p>
          </div>

          {/* Our Commitment */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#7D0909]">Our commitment</h3>
            <p>
              We commit to protecting your privacy and hence our Personal Data handling practices are continually reviewed to ensure compliance with the applicable Privacy laws and regulations.
            </p>
          </div>

          {/* Categories of Personal Data */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#7D0909]">Categories of Personal Data</h3>
            <p>Categories of Personal Data collected and processed by us are as follows:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <li><strong>Demographic & Identity Data:</strong> Contact details such as Name, email address, contact number, shipping address, country, date of birth. Open data and public records such as information about YOU that is openly available on the internet.</li>
              <li><strong>Payment & Financial details:</strong> Transaction amount, Bank Name, Card Type, Card number (processed securely).</li>
              <li><strong>Online Identifiers & Technical Data:</strong> Location details such as data we get about your location, IP address, logs, or from where you connect a computer to the internet. Device information, location and network carrier when you use our mobile applications.</li>
              <li><strong>Communications details:</strong> Metadata and other Personal Data we get from communications done through e-mails, SMS, instant messages, and calls.</li>
              <li><strong>Usage details:</strong> Data about how you use our website or web-based properties, pages viewed, etc.</li>
            </ul>
          </div>

          {/* Lawful Bases */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#7D0909]">Lawful Bases of Processing Your Personal Data</h3>
            <p>We are permitted to process your Personal Data in compliance with applicable laws and regulations by relying on one or more of the following lawful bases:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-705">
              <li>You have explicitly agreed to us processing your Personal Data for a specific reason.</li>
              <li>The processing is necessary to perform the agreement we have with you or to take steps to enter into an agreement with you.</li>
              <li>The processing is necessary to be in compliance with our Legal Obligations.</li>
              <li>The processing is necessary for the purposes of a legitimate interest pursued by us, such as (i) to provide services to you, (ii) to evaluate, develop or improve our products and services.</li>
            </ul>
            <p className="text-xs text-slate-500 italic">
              Where the processing is based on your consent, you have a right to withdraw your consent at any time by contacting us.
            </p>
          </div>

          {/* Cookies */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#7D0909]">Cookies and Trackers Used by Our Digital Properties</h3>
            <p>
              Cookies are small text files that are placed on your computer by websites that you visit. We use cookies, permissions and other trackers in our website, web-based properties and mobile applications to collect data so we can provide you a better online experience.
            </p>
            <ul className="list-decimal pl-5 space-y-1">
              <li><strong>Strictly Necessary:</strong> Needed to run our website securely and obey regulations.</li>
              <li><strong>Functional:</strong> Used for remembering user settings like user ID, region, preferred language, and contrast options.</li>
              <li><strong>Performance:</strong> Analytical tracking showing how our customers use our website to help us improve services.</li>
            </ul>
          </div>

          {/* Personal Data Disclosure */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#7D0909]">Personal Data Disclosure</h3>
            <p>
              We disclose your Personal Data to appropriate authorities if we believe that it is reasonably necessary to comply with a law, regulation, legal process, or to protect client safety, address fraud, security, or technical issues.
            </p>
          </div>

          {/* Cross-border Data Transfer */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#7D0909]">Cross-Border Data Transfer</h3>
            <p>
              Personal Data we hold about you may be transferred to other countries outside your residential country for any of the purposes described. We will use best endeavors to put in place appropriate safeguards to ensure your Personal Data is adequately protected.
            </p>
          </div>

          {/* Data Security & Retention */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#7D0909]">Data Security & Retention</h3>
            <p>
              We take reasonable steps to ensure physical, technical and managerial safeguards are in place to project your Personal Data. We keep the Personal Data only as long as it is required for the purposes set out, legal, or regulatory reasons.
            </p>
          </div>

          {/* Children's Privacy */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-[#7D0909]">Children&lsquo;s Privacy</h3>
            <p>
              Our Platform is directed to be used by adults only. If you are not an adult, you should not make a purchase, register, or submit Personal Data to us.
            </p>
          </div>

          {/* Contact US */}
          <div className="space-y-2 p-4 bg-[#7D0909]/5 border border-[#7D0909]/10 rounded-lg">
            <h3 className="text-base font-bold text-[#7D0909] flex items-center gap-2">Contact Us</h3>
            <p className="text-xs text-slate-800">
              For any further queries and complaints related to privacy under applicable laws and regulations, please reach us at:
            </p>
            <p className="text-xs font-bold text-slate-900 mt-1">
              Contact Email Address: <a href="mailto:support@inchpaper.com" className="text-[#7D0909] hover:underline">support@inchpaper.com</a>
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#7D0909] text-white hover:bg-[#5E0606] transition-colors rounded-lg font-bold text-xs"
          >
            I Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}

export function TermsConditionsModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7D0909]/10 flex items-center justify-center text-[#7D0909]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#7D0909]">Terms of Use</h2>
              <p className="text-xs text-slate-500 font-medium">Inchpaper Private Limited</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable readable text */}
        <div className="p-6 overflow-y-auto text-sm text-slate-700 space-y-4 leading-relaxed font-sans">
          
          <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 text-xs rounded-lg font-semibold">
            Please read these Terms of Use carefully before accessing or transacting on our domain as they constitute your binding legal obligations with Inchpaper Private Limited.
          </div>

          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Use of the Platform</h3>
          <p>
            This document is an electronic record in terms of the Information Technology Act, 2000 and rules thereunder as applicable and the amended provisions pertaining to electronic records in various statutes as amended by the Information Technology Act, 2000. This electronic record is generated by a computer system and does not require any physical or digital signatures.
          </p>
          <p>
            This document is published in accordance with the provisions of Rule 3 (1) of the Information Technology (Intermediaries guidelines) Rules, 2011 that require publishing the Rules and Regulations, privacy policy, and Terms of Use for access or usage of domain name <a href="http://www.inchpaper.com" target="_blank" rel="noreferrer" className="text-[#7D0909] font-semibold underline">www.inchpaper.com</a> (&ldquo;Website&rdquo;), including the related mobile site and mobile application (hereinafter referred to as &ldquo;Platform&rdquo;).
          </p>
          <p>
            The Platform is owned by <strong>Inchpaper Private Limited</strong>, a company incorporated under the Companies Act, 2013, with its registered office at 37/4, 2nd Floor, Inderpuri, Jacobpura, Gurgaon 122001, Haryana, India (hereinafter referred to as &quot;Inchpaper&quot;).
          </p>

          <hr className="border-slate-100 my-2" />

          {/* 1. Membership */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">1. Membership Eligibility</h4>
            <p>
              Transactions on the Platform are available only to persons who can form legally binding contracts under the Indian Contract Act, 1872. If you are a minor (under 18 years), you may use the Platform only under the supervision and prior consent of a parent or legal guardian.
            </p>
          </div>

          {/* 2. Your Account */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">2. Your Account and Registration Obligations</h4>
            <p>
              You shall be responsible for maintaining the confidentiality of your Display Name and Password and you shall be responsible for all activities that occur under your Display Name. Your mobile phone number and/or email address is treated as your primary identifier.
            </p>
          </div>

          {/* 3. Communications */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">3. Communications</h4>
            <p>
              When you use our Platform or send emails or details to us, you are communicating with us through electronic records and consent to receive periodic communications. 
            </p>
          </div>

          {/* 4. Platform */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">4. Platform for Transaction and Communication</h4>
            <p>
              The Platform is an intermediary marketplace that Users utilize to meet and interact. Inchpaper is not and cannot be a party to or control in any manner any transaction between independent Users.
            </p>
          </div>

          {/* 5. Privacy Practices */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">5. Privacy Practices</h4>
            <p>
              We safeguard your personal information in accordance with our Privacy Policy. Your continued use of the Platform implies that you have read and accepted the Privacy Policy.
            </p>
          </div>

          {/* 6. Product Info */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">6. Product & Services Information</h4>
            <p>
              We attempt to be as accurate as possible in descriptions, colors, and pictures. However, Inchpaper does not warrant that product content is complete, reliable, current, or error-free. Product pictures are indicative only.
            </p>
          </div>

          {/* 7. Product Use & Services */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">7. Product Use & Services</h4>
            <p>
              Products and services available are for personal and/or professional use only and shall not be resold for commercial reasons. If a product causes side effects, the manufacturer of the product holds sole liability.
            </p>
          </div>

          {/* 8. Recommendation */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">8. Recommendation of the Product & Services</h4>
            <p>
              Any recommendations made on the platform are purely informational and for convenience. They do not amount to endorsement by Inchpaper.
            </p>
          </div>

          {/* 9. Pricing */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">9. Pricing Information</h4>
            <p>
              If a product/service is listed at an incorrect price due to technical errors, we hold the right to refuse or cancel orders placed for that item.
            </p>
          </div>

          {/* Cancellations */}
          <div className="space-y-1 bg-slate-50 p-3 rounded border border-slate-100">
            <h4 className="font-bold text-[#7D0909]">Cancellations, Refunds & Returns</h4>
            <p className="text-xs">
              Please refer to our standard policy on the Platform. We offer Net-30/45 credit options for qualified corporate buyer networks upon physical business verification.
            </p>
          </div>

          {/* Intellectual property */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Intellectual Property Rights</h4>
            <p>
              The &ldquo;Inchpaper&rdquo; name, logo, design marks and brand marks are exclusive trademarks & copyrights of Inchpaper Private Limited. Accessing the Platform does not authorize anyone to reproduce, republish, or download contents except for individual shopping guides.
            </p>
          </div>

          {/* Governing Law */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Governing Law and Jurisdiction</h4>
            <p>
              These Terms of Use are governed by the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the competent courts in Gurugram, Haryana.
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-1.5 p-4 bg-[#7D0909]/5 border border-[#7D0909]/10 rounded-lg text-xs">
            <h4 className="font-extrabold text-[#7D0909]">Customer Service Desk & Compliance Contact:</h4>
            <p className="font-medium text-slate-900">Inchpaper Private Limited</p>
            <p>Registered Office: 37/4, 2nd Floor, Inderpuri, Jacobpura, Gurgaon 122001, Haryana, India</p>
            <p>E-mail: <a href="mailto:support@inchpaper.com" className="text-[#7D0909] font-semibold">support@inchpaper.com</a></p>
            <p>Phone Helpline: +91 77 038 6 098 2</p>
            <p className="text-slate-500 font-bold">Contact Days: Monday to Saturday (11:00 am to 4:00 pm)</p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#7D0909] text-white hover:bg-[#5E0606] transition-colors rounded-lg font-bold text-xs"
          >
            I Agree to Terms
          </button>
        </div>
      </div>
    </div>
  );
}
