import React from 'react';
import { FaLinkedinIn, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-white text-slate-800 py-12 px-6 mt-20 shadow-inner relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
      
        {/* Contact */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-sky-600">Contact</h3>

          {/* Email */}
          <p className="text-sm text-slate-700 mb-3">
            Email:{' '}
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=info@legalcha.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline"
            >
              info@legalcha.in
            </a>
          </p>

          {/* Social links (text first, icon second) */}
          <div className="flex flex-col gap-2 text-sm">
            <a
              href="#"
              className="flex items-center gap-2 text-slate-600 hover:text-sky-600 transition"
            >
              <span>LinkedIn</span>
              <FaLinkedinIn size={18}/>
            </a>

            <a
              href="#"
              className="flex items-center gap-2 text-slate-600 hover:text-pink-500 transition"
            >
              <span>Instagram</span>
              <FaInstagram size={18}/>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Legal Chain. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
