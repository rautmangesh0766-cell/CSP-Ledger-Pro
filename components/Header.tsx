import React from 'react';
import { DatabaseIcon } from './icons';

interface HeaderProps {
    onBackupClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBackupClick }) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          CSP Ledger Pro
        </h1>
        <button
          onClick={onBackupClick}
          className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
          title="Backup and Restore"
          aria-label="Open backup and restore manager"
        >
          <DatabaseIcon className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">Backup &amp; Restore</span>
        </button>
      </div>
    </header>
  );
};

export default Header;