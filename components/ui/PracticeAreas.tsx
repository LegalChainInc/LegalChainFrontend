import React from 'react';
import Link from 'next/link';
import {
  FaFileContract,
  FaPenNib,
  FaFileAlt,
  FaFolderOpen,
  FaRegEnvelope,
  FaFileCode,
  FaBalanceScale,
  FaLanguage,
  FaComments,
} from 'react-icons/fa';

const areas = [
  //{ icon: <FaFileContract size={32} />, title: 'NDA Creation', href: '/features/nda', desc: 'We help you protect your confidential business information by creating customized Non-Disclosure Agreements. Our NDAs ensure that sensitive data, trade secrets, and proprietary information remain secure when shared with employees, partners, or third parties. These legally binding documents provide peace of mind by establishing clear boundaries around confidential information use and disclosure.' },
  { icon: <FaPenNib size={32} />, title: 'Contract Creation', href: '/contract', desc: 'Our team crafts comprehensive, legally sound contracts tailored to your specific business needs. We ensure all terms and conditions are clearly defined, potential risks are addressed, and your interests are fully protected. Each contract undergoes thorough review to eliminate loopholes and ambiguities that could lead to disputes.' },
  //{ icon: <FaFileAlt size={32} />, title: 'Document Analysis', href: '/dashboard', desc: 'We provide expert legal review and analysis of complex documents to help you understand their implications and obligations. Our experienced legal professionals break down complicated legal language into clear, actionable insights. This service helps you make informed decisions by identifying potential risks, opportunities, and legal requirements within any document.' },
  //{ icon: <FaFolderOpen size={32} />, title: 'Document Management', href: '/features/management', desc: 'We offer comprehensive digital document organization and storage solutions for all your legal files. Our secure systems ensure easy access, version control, and proper categorization of contracts, agreements, and legal correspondence. This service streamlines your workflow while maintaining strict confidentiality and compliance standards.' },
  //{ icon: <FaRegEnvelope size={32} />, title: 'Document Summary', href: '/features/summary', desc: 'We distill lengthy legal documents into concise, easy-to-understand summaries highlighting key terms and provisions. Our summaries focus on essential information, deadlines, obligations, and potential risks to save you time and improve comprehension. This service is particularly valuable for executives and decision-makers who need quick insights without reading entire documents.' },
  { icon: <FaFileCode size={32} />, title: 'Document Comparison', href: '/features/comparison', desc: 'We provide detailed analysis comparing multiple versions of contracts or legal documents to identify changes, additions, and deletions. Our comparison service highlights critical differences that could impact your legal position or business operations. This ensures you fully understand modifications before signing updated agreements or contract amendments.' },
  { icon: <FaBalanceScale size={32} />, title: 'Legal Review', href: '/features/legal-review', desc: 'Our comprehensive legal review service examines documents for compliance, accuracy, and potential legal issues before execution. We identify problematic clauses, suggest improvements, and ensure documents meet current legal standards and regulations. This proactive approach helps prevent costly legal disputes and ensures your agreements are enforceable and protective of your interests.' },
  { icon: <FaLanguage size={32} />, title: 'Translation', href: '/features/translation', desc: 'We provide accurate legal document translation services by qualified legal translators familiar with both languages and legal systems. Our translations maintain the precise legal meaning and terminology while ensuring clarity in the target language. This service includes certification when required for official legal proceedings or international business transactions.' },
  { icon: <FaComments size={32} />, title: 'Feedback', href: '/features/feedback', desc: 'Share your thoughts, report bugs, or suggest improvements. Your feedback helps us continuously enhance Legal Chain to better serve your legal needs. Whether you have a suggestion for a new feature, encountered an issue, or want to share your experience, we\'d love to hear from you.' },
];

export default function PracticeAreas() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {areas.map((area, idx) => (
        <div
          key={idx}
          className="bg-white shadow-lg rounded-xl p-6 transition duration-300 hover:shadow-xl text-gray-800"
        >
          {/* Icon */}
          <div className="flex items-center justify-start mb-6 text-yellow-400">
            <Link
              href={area.href}
              aria-label={`Go to ${area.title}`}
              className="focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {area.icon}
            </Link>
          </div>

          {/* Title */}
          <h4 className="font-bold uppercase mb-3">{area.title}</h4>

          {/* Description */}
          <p className="text-gray-600">{area.desc}</p>
        </div>
      ))}
    </div>
  );
}
