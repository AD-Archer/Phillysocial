import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaTwitter, FaFacebook, FaInstagram } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 bg-[#003940] text-white py-6 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative w-8 h-8">
              <Image
                src="/Logo.png"
                alt="Philly Social Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <h3 className="text-xl eagles-font">Philly Social</h3>
          </div>
          <p className="text-[#A5ACAF]">Connecting Philadelphians since 2024</p>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><Link href="/about" className="text-[#A5ACAF] hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="text-[#A5ACAF] hover:text-white transition-colors">Contact</Link></li>
            <li><Link href="/privacy" className="text-[#A5ACAF] hover:text-white transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4">Follow Us</h3>
          <div className="flex space-x-4">
            <Link href="#" className="text-[#A5ACAF] hover:text-white transition-colors">
              <FaTwitter size={24} />
            </Link>
            <Link href="#" className="text-[#A5ACAF] hover:text-white transition-colors">
              <FaFacebook size={24} />
            </Link>
            <Link href="#" className="text-[#A5ACAF] hover:text-white transition-colors">
              <FaInstagram size={24} />
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-4 border-t border-[#A5ACAF]/20 text-center">
        <p>© 2024 Philly Social. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;