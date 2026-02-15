import React from "react";
import { Link } from "react-router-dom";

const LinkedInIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);
const InstagramIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.148 3.227-1.669 4.771-4.919 4.919-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.646-.07-4.85s.012-3.584.07-4.85c.148-3.227 1.669-4.771 4.919 4.919 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z" />
  </svg>
);
const MailIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.107 10-8.107v11.817h-20z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-10 pb-6 mt-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* 4-column grid on md+, stacked on small screens */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Contact Me */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-3">Contact Me</h5>
            <div className="flex items-center gap-4 mb-3">
              <a href="https://www.linkedin.com/in/sayan2713-mondal/" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="LinkedIn">
                <LinkedInIcon />
              </a>
              <a href="https://www.instagram.com/sayan_2713?igsh=MW9oNnczNG5ncWx0aw==" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href="mailto:sayanmondal13072002@gmail.com" className="hover:text-white" aria-label="Mail">
                <MailIcon />
              </a>
            </div>

            <p className="text-sm">
              <Link to="/contact" className="text-blue-400 hover:text-blue-300">
                Contact Me
              </Link>
            </p>
          </div>

          {/* Column 2: Our other pages */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-3">Our other pages</h5>
            <nav className="flex flex-col gap-2">
              <Link to="/copyright" className="text-sm text-gray-300 hover:text-white">Copyright</Link>
              <Link to="/terms" className="text-sm text-gray-300 hover:text-white">Terms &amp; Conditions</Link>
              <Link to="/how-to-use" className="text-sm text-gray-300 hover:text-white">How to use this Website</Link>
            </nav>
          </div>

          {/* Column 3: About */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-3">About</h5>
            <p className="text-sm text-gray-300">
              This is a MERN stack trip-split app to track shared expenses between friends. Built and maintained by Sayan Mondal.
            </p>

            <div className="mt-3">
              <Link to="/about" className="text-sm text-blue-400 hover:text-blue-300">Learn more...</Link>
            </div>
          </div>

          {/* Column 4: Details & Downloads (APK button only) */}
          <div className="flex flex-col items-center">
            <h5 className="text-lg font-semibold text-white mb-3">Details & Downloads</h5>
            <p className="text-sm text-gray-300 mb-3">V-1.2 (Last Update: 16-11-2025)</p>
            <p className="text-sm text-gray-400 mb-4 text-center">Original work by Sayan Mondal</p>

            {/* Centered APK download button */}
            <a
              href="/TripSplit5.7.apk"
              download="TripSplit5.7.apk"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v12m0 0l-4-4m4 4l4-4M21 21H3" />
              </svg>
              Download APK
            </a>

            {/* small note under button */}
            <p className="text-xs text-gray-400 mt-3 text-center">Android APK — Trip Split</p>
          </div>
        </div>

        {/* Footer bottom row: copyright centered */}
        <div className="mt-8 border-t border-gray-800 pt-6">
          <p className="text-sm text-center text-gray-500">© 2025 Sayan Mondal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
