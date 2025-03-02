'use client';
import Link from 'next/link';
import { FaNewspaper, FaUser, FaStream, FaTimes } from 'react-icons/fa';
import { useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const menuItems = [
    { icon: FaStream, label: 'Social Feed', href: '/dashboard' },
    { icon: FaNewspaper, label: 'News Feed', href: '/news' },
    { icon: FaUser, label: 'Profile', href: '/profile' },
  ];

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      if (isOpen && sidebar && !sidebar.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={`fixed inset-y-0 left-0 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out bg-[#004C54] text-white w-64 min-h-screen p-4 z-30`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">Philly Social</h2>
          <button onClick={onClose} className="text-white">
            <FaTimes size={24} />
          </button>
        </div>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#003940] transition-colors"
                    onClick={() => onClose()}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar; 