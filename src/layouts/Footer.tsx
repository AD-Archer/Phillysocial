import React from 'react';
import { FaGithub } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 bg-[#003940] text-white py-6 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
        <p className="mb-2 sm:mb-0">© {new Date().getFullYear()} Philly Social. All rights reserved.</p>
        <a 
          href="https://github.com/ad-archer/phillysocial" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center text-[#A5ACAF] hover:text-white transition-colors"
          aria-label="GitHub Repository"
        >
          <FaGithub size={20} className="mr-2" />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;