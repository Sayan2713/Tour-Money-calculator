import React from 'react';
import { Link } from 'react-router-dom';

// ##################################################################
// #  FOOTER COMPONENT
// ##################################################################
const Footer = () => {
  // Inline SVGs for icons
  const LinkedInIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
  );
  const InstagramIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.148 3.227-1.669 4.771-4.919 4.919-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.646-.07-4.85s.012-3.584.07-4.85c.148-3.227 1.669-4.771 4.919 4.919 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z"/></svg>
  );
  const MailIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.107 10-8.107v11.817h-20z"/></svg>
  );

  return (
    <footer className="bg-gray-900 text-gray-400 p-8 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Me */}
        <div>
          <h5 className="text-lg font-bold text-white mb-4">Contact Me</h5>
          <div className="flex space-x-4">
            <a href="https://www.linkedin.com/in/sayan2713-mondal/" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="LinkedIn">
              <LinkedInIcon />
            </a>
            <a href="https://www.instagram.com/sayan_2713?igsh=MW9oNnczNG5ncWx0aw==" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href="mailto:sayanmondal13072002@gmail.com" className="hover:text-white" aria-label="Gmail">
              <MailIcon />
            </a>
          </div>
          <p className="mt-4 text-sm break-words">sayanmondal13072002@gmail.com</p>
        </div>
        
        {/* About */}
        <div>
          <h5 className="text-lg font-bold text-white mb-4">About This Project</h5>
          <p className="text-sm">This is a full-stack MERN (MongoDB, Express, React, Node.js) application built to simplify group expense tracking.</p>
          {/* Use <Link> for navigation */}
          <Link to="/about" className="text-sm mt-2 text-blue-400 hover:text-blue-300">
            Learn more...
          </Link>
        </div>

        {/* Copyright & Version */}
        <div>
          <h5 className="text-lg font-bold text-white mb-4">Details</h5>
          <p className="text-sm">V-1.2 (Last Update: 16-11-2025)</p>
          <p className="text-sm mt-4">© 2025 Sayan Mondal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;