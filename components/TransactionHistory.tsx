import React, { useState, useEffect, useMemo } from 'react';
import type { Transaction } from '../types';
import { TransactionType } from '../types';
import { EditIcon, PrintIcon, StarIcon, StarFilledIcon, DeleteIcon, SearchIcon } from './icons';
import TransactionTypeBadge from './TransactionTypeBadge';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onUpdateTransaction: (transaction: Transaction) => void;
  onToggleHighlight: (transactionId: string) => void;
  onDeleteTransaction: (transactionId: string) => void;
}

interface EditTransactionModalProps {
  transaction: Transaction;
  onSave: (transaction: Transaction) => void;
  onClose: () => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, onSave, onClose }) => {
  const [formData, setFormData] = useState(transaction);

  useEffect(() => {
    setFormData(transaction);
  }, [transaction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const needsCustomerIdentifier = [
    TransactionType.CUSTOMER_DEPOSIT,
    TransactionType.CUSTOMER_WITHDRAWAL,
    TransactionType.CUSTOMER_TRANSFER,
  ].includes(formData.type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg m-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
           <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Transaction Type</label>
            <select id="type" name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                {Object.values(TransactionType).map((txType) => <option key={txType} value={txType}>{txType}</option>)}
            </select>
           </div>
           <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (INR)</label>
            <input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
           </div>
           {needsCustomerIdentifier && (
            <>
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Customer Name (Optional)</label>
                <input type="text" id="customerName" name="customerName" value={formData.customerName ?? ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="customerIdentifier" className="block text-sm font-medium text-gray-700">Customer Aadhaar / Account No.</label>
                <input type="text" id="customerIdentifier" name="customerIdentifier" value={formData.customerIdentifier ?? ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label htmlFor="customerMobile" className="block text-sm font-medium text-gray-700">Customer Mobile No. (Optional)</label>
                <input type="text" id="customerMobile" name="customerMobile" value={formData.customerMobile ?? ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </>
           )}
           <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
           </div>
           <div className="flex justify-end space-x-3 pt-4">
             <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">Cancel</button>
             <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Save Changes</button>
           </div>
        </form>
      </div>
    </div>
  );
};

const PrintReceipt: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    return (
        <>
            <style>{`
                @media print {
                    body > *:not(#print-receipt-container) { display: none !important; }
                    #print-receipt-container, #print-receipt-container * { display: block !important; visibility: visible !important; }
                    #print-receipt-container { position: absolute; left: 0; top: 0; width: 100%; padding: 2rem; }
                }
            `}</style>
            <div id="print-receipt-container" className="hidden">
                <div className="max-w-2xl mx-auto p-8 border-2 border-black">
                    <header className="text-center mb-8">
                        <h1 className="text-3xl font-bold">CSP Ledger Pro</h1>
                        <p className="text-lg">Transaction Receipt</p>
                    </header>
                    <main className="text-base">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-8">
                            <p><strong>Transaction ID:</strong></p><p>{transaction.id}</p>
                            <p><strong>Date & Time:</strong></p><p>{new Date(transaction.date).toLocaleString('en-IN')}</p>
                            <p><strong>Type:</strong></p><p>{transaction.type}</p>
                            <p><strong>Amount:</strong></p><p className="font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(transaction.amount)}</p>
                            {transaction.customerName && <><p><strong>Customer Name:</strong></p><p>{transaction.customerName}</p></>}
                            {transaction.customerIdentifier && <><p><strong>Aadhaar / Account No.:</strong></p><p>{transaction.customerIdentifier}</p></>}
                            {transaction.customerMobile && <><p><strong>Customer Mobile:</strong></p><p>{transaction.customerMobile}</p></>}
                        </div>
                        {transaction.description && <div className="mt-4"><p><strong>Notes:</strong> {transaction.description}</p></div>}
                    </main>
                    <footer className="text-center mt-12 border-t-2 border-dashed border-black pt-4">
                        <p>Thank you for your business.</p>
                    </footer>
                </div>
            </div>
        </>
    );
};

interface ConfirmDeleteModalProps {
  transaction: Transaction;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ transaction, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md m-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Confirm Deletion</h2>
        <p className="text-gray-600 mb-6">Are you sure you want to delete this transaction? This action cannot be undone.</p>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-sm space-y-2">
            <div className="flex items-center gap-2">
                <strong>Type:</strong> <TransactionTypeBadge type={transaction.type} />
            </div>
            <p><strong>Amount:</strong> {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(transaction.amount)}</p>
            <p><strong>Date:</strong> {new Date(transaction.date).toLocaleString('en-IN')}</p>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};


const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onUpdateTransaction, onToggleHighlight, onDeleteTransaction }) => {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [printingTransaction, setPrintingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedAndFilteredTransactions = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    
    const filtered = searchQuery ? transactions.filter(tx =>
        tx.customerName?.toLowerCase().includes(lowercasedQuery) ||
        tx.customerIdentifier?.toLowerCase().includes(lowercasedQuery) ||
        tx.description?.toLowerCase().includes(lowercasedQuery)
    ) : transactions;

    // Create a mutable copy and sort it to bring highlighted items to the top
    return [...filtered].sort((a, b) => {
        if (a.isHighlighted === b.isHighlighted) {
            return 0; // maintain original relative order
        }
        return a.isHighlighted ? -1 : 1; // highlighted items first
    });
  }, [transactions, searchQuery]);


  useEffect(() => {
    if (printingTransaction) {
        const timer = setTimeout(() => {
            window.print();
            setPrintingTransaction(null);
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [printingTransaction]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const handleSave = (updatedTransaction: Transaction) => {
    onUpdateTransaction(updatedTransaction);
    setEditingTransaction(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingTransaction) {
        onDeleteTransaction(deletingTransaction.id);
        setDeletingTransaction(null);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body > #root > div > header, 
          body > #root > div > main > div:first-child,
          body > #root > div > main > div > div:first-child,
          .no-print {
            display: none !important;
          }
          .transaction-history-wrapper {
            all: unset !important;
          }
          .actions-col-header, .actions-col-cell {
            display: none !important;
          }
        }
      `}</style>
      {editingTransaction && <EditTransactionModal transaction={editingTransaction} onSave={handleSave} onClose={() => setEditingTransaction(null)} />}
      {printingTransaction && <PrintReceipt transaction={printingTransaction} />}
      {deletingTransaction && <ConfirmDeleteModal transaction={deletingTransaction} onConfirm={handleDeleteConfirm} onClose={() => setDeletingTransaction(null)} />}
      <div className="bg-white p-6 rounded-xl shadow-xl h-full">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 no-print">
          <h2 className="text-xl font-bold text-gray-800 shrink-0">Transaction History</h2>
          <div className="flex items-center space-x-2 w-full">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3" aria-hidden="true">
                <SearchIcon className="w-5 h-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search by name, ID, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                aria-label="Search transactions"
              />
            </div>
            <button onClick={() => window.print()} className="text-gray-500 hover:text-gray-800 p-2 rounded-full transition-colors" title="Print Report" aria-label="Print Report">
              <PrintIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[600px]">
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No transactions recorded yet.</p>
          ) : sortedAndFilteredTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No transactions match your search.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer Name</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aadhaar / Account No.</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer Mobile</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider actions-col-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredTransactions.map((tx) => (
                  <tr key={tx.id} className={`${tx.isHighlighted ? 'bg-amber-100' : 'hover:bg-gray-50 transition-colors duration-200'}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <TransactionTypeBadge type={tx.type} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.customerName || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{tx.customerIdentifier || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{tx.customerMobile || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(tx.date)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium actions-col-cell">
                        <div className="flex items-center space-x-3 no-print">
                            <button onClick={() => setEditingTransaction(tx)} className="text-indigo-600 hover:text-indigo-900 transition-colors" title="Edit Transaction" aria-label="Edit Transaction"><EditIcon className="w-5 h-5" /></button>
                            <button onClick={() => setPrintingTransaction(tx)} className="text-gray-500 hover:text-gray-800 transition-colors" title="Print Receipt" aria-label="Print Receipt"><PrintIcon className="w-5 h-5" /></button>
                            <button onClick={() => onToggleHighlight(tx.id)} className="text-yellow-500 hover:text-yellow-600 transition-colors" title="Highlight Transaction" aria-label="Highlight Transaction">
                                {tx.isHighlighted ? <StarFilledIcon className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />}
                            </button>
                            <button onClick={() => setDeletingTransaction(tx)} className="text-red-600 hover:text-red-900 transition-colors" title="Delete Transaction" aria-label="Delete Transaction">
                                <DeleteIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default TransactionHistory;