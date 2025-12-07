import React, { useState } from 'react';
import type { LedgerSummary } from '../types';
import DashboardCard from './DashboardCard';
import { BankIcon, CashIcon, ArrowDownIcon, ArrowUpIcon, TotalDebitIcon, TotalCreditIcon, EditIcon } from './icons';

interface DashboardProps {
  summary: LedgerSummary;
  onUpdateBalances: ({ newBankBalance, newCashInHand }: { newBankBalance?: number; newCashInHand?: number }) => void;
}

const UpdateBalanceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (newValue: number) => void;
  title: string;
  initialValue: number;
}> = ({ isOpen, onClose, onSave, title, initialValue }) => {
  const [value, setValue] = useState(initialValue.toString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      onSave(numericValue);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm m-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="balanceValue" className="block text-sm font-medium text-gray-700">New Value (INR)</label>
          <input
            type="number"
            id="balanceValue"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
            autoFocus
          />
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors">
              Cancel
            </button>
            <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const Dashboard: React.FC<DashboardProps> = ({ summary, onUpdateBalances }) => {
  const [editing, setEditing] = useState<'bank' | 'cash' | null>(null);

  const handleOpenModal = (type: 'bank' | 'cash') => {
    setEditing(type);
  };

  const handleCloseModal = () => {
    setEditing(null);
  };

  const handleSave = (newValue: number) => {
    if (editing === 'bank') {
      onUpdateBalances({ newBankBalance: newValue });
    } else if (editing === 'cash') {
      onUpdateBalances({ newCashInHand: newValue });
    }
    handleCloseModal();
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="relative">
          <DashboardCard
            title="Remaining Bank Balance"
            value={summary.remainingBalance}
            icon={<BankIcon className="w-6 h-6 text-blue-800" />}
            colorClass="bg-blue-100"
          />
          <button
            onClick={() => handleOpenModal('bank')}
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Edit Bank Balance"
          >
            <EditIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <DashboardCard
            title="Cash In Hand"
            value={summary.cashInHand}
            icon={<CashIcon className="w-6 h-6 text-green-800" />}
            colorClass="bg-green-100"
          />
          <button
            onClick={() => handleOpenModal('cash')}
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Edit Cash In Hand"
          >
            <EditIcon className="w-4 h-4" />
          </button>
        </div>
        <DashboardCard
          title="Withdrawal Today"
          value={summary.withdrawalToday}
          icon={<ArrowUpIcon className="w-6 h-6 text-red-800" />}
          colorClass="bg-red-100"
        />
        <DashboardCard
          title="Deposit Today"
          value={summary.depositToday}
          icon={<ArrowDownIcon className="w-6 h-6 text-teal-800" />}
          colorClass="bg-teal-100"
        />
        <DashboardCard
          title="Total Debited (from Bank)"
          value={summary.totalDebited}
          icon={<TotalDebitIcon className="w-6 h-6 text-orange-800" />}
          colorClass="bg-orange-100"
        />
        <DashboardCard
          title="Total Deposited (to Bank)"
          value={summary.totalDeposited}
          icon={<TotalCreditIcon className="w-6 h-6 text-purple-800" />}
          colorClass="bg-purple-100"
        />
      </div>
      {editing !== null && (
        <UpdateBalanceModal
          isOpen={editing !== null}
          onClose={handleCloseModal}
          onSave={handleSave}
          title={editing === 'bank' ? 'Update Bank Balance' : 'Update Cash In Hand'}
          initialValue={editing === 'bank' ? summary.remainingBalance : summary.cashInHand}
        />
      )}
    </>
  );
};

export default Dashboard;