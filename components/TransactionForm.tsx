import React, { useState } from 'react';
import type { Transaction, Customer } from '../types';
import { TransactionType } from '../types';

interface TransactionFormProps {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'isHighlighted'>) => void;
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
}

const transactionTypeOrder = [
  TransactionType.CUSTOMER_WITHDRAWAL,
  TransactionType.CUSTOMER_TRANSFER,
  TransactionType.CUSTOMER_DEPOSIT,
  TransactionType.CSP_DEPOSIT_TO_BANK,
  TransactionType.CSP_WITHDRAWAL_FROM_BANK,
];

// Modal Component for validation alerts
const AlertModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm m-4 text-center transform transition-all"
           role="alertdialog"
           aria-labelledby="alert-dialog-title"
           aria-describedby="alert-dialog-description"
      >
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-lg leading-6 font-bold text-gray-900 mt-4" id="alert-dialog-title">
          {title}
        </h3>
        <div className="mt-2">
            <p className="text-sm text-gray-600" id="alert-dialog-description">
                {message}
            </p>
        </div>
        <div className="mt-6">
          <button 
            type="button"
            onClick={onClose} 
            className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};


const TransactionForm: React.FC<TransactionFormProps> = ({ addTransaction, customers, addCustomer }) => {
  const [type, setType] = useState<TransactionType>(transactionTypeOrder[0]);
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const needsCustomerIdentifier = [
    TransactionType.CUSTOMER_DEPOSIT,
    TransactionType.CUSTOMER_WITHDRAWAL,
    TransactionType.CUSTOMER_TRANSFER,
  ].includes(type);

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedName = e.target.value;
    setCustomerName(selectedName);

    const selectedCustomer = customers.find(c => c.name === selectedName);
    if (selectedCustomer) {
      setCustomerIdentifier(selectedCustomer.identifier);
      setCustomerMobile(selectedCustomer.mobile || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount)) {
      setError('Please enter a valid amount.');
      return;
    }

    if (numericAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    // Transaction Limit Validation
    if (type === TransactionType.CUSTOMER_WITHDRAWAL && numericAmount > 10000) {
      setModalTitle('Transaction Limit Exceeded');
      setModalMessage('Withdrawal amount cannot exceed ₹10,000.');
      setIsAlertModalOpen(true);
      return;
    }

    if (type === TransactionType.CUSTOMER_TRANSFER && numericAmount > 10000) {
      setModalTitle('Transaction Limit Exceeded');
      setModalMessage('Money Transfer amount cannot exceed ₹10,000.');
      setIsAlertModalOpen(true);
      return;
    }

    if (type === TransactionType.CUSTOMER_DEPOSIT && numericAmount > 20000) {
      setModalTitle('Transaction Limit Exceeded');
      setModalMessage('Deposit amount cannot exceed ₹20,000.');
      setIsAlertModalOpen(true);
      return;
    }

    if (needsCustomerIdentifier) {
      const trimmedName = customerName.trim();
      const trimmedIdentifier = customerIdentifier.trim();

      if (!trimmedName) {
        setError('Customer Name is required for this transaction type.');
        return;
      }
      if (!trimmedIdentifier) {
        setError('Aadhaar or Account number is required for this transaction type.');
        return;
      }

      // Unique Identifier Validation
      const conflictingCustomer = customers.find(c => 
        c.identifier.trim().toLowerCase() === trimmedIdentifier.toLowerCase() && 
        c.name.trim().toLowerCase() !== trimmedName.toLowerCase()
      );

      if (conflictingCustomer) {
        setModalTitle('Duplicate Identifier');
        setModalMessage(`This Aadhaar/Account No. is already assigned to "${conflictingCustomer.name}". Each customer must have a unique identifier.`);
        setIsAlertModalOpen(true);
        return;
      }
      
      // Auto-save new customer if they don't already exist
      const isExistingCustomer = customers.some(
        c => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );

      if (!isExistingCustomer) {
        addCustomer({
          name: trimmedName,
          identifier: trimmedIdentifier,
          mobile: customerMobile.trim() || undefined,
        });
      }
    }

    addTransaction({
      type,
      amount: numericAmount,
      customerName: needsCustomerIdentifier ? customerName.trim() : undefined,
      customerIdentifier: needsCustomerIdentifier ? customerIdentifier.trim() : undefined,
      customerMobile: needsCustomerIdentifier ? customerMobile.trim() : undefined,
      description,
    });

    // Reset form
    setAmount('');
    setCustomerName('');
    setCustomerIdentifier('');
    setCustomerMobile('');
    setDescription('');
    setType(transactionTypeOrder[0]);
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-xl h-full">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Transaction Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {transactionTypeOrder.map((txType) => (
                <option key={txType} value={txType}>{txType}</option>
              ))}
            </select>
          </div>
          {needsCustomerIdentifier && (
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input
                    type="text"
                    id="customerName"
                    list="customer-list"
                    value={customerName}
                    onChange={handleCustomerSelect}
                    placeholder="Type or select a customer"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                />
                <datalist id="customer-list">
                    {customers.map(customer => (
                        <option key={customer.id} value={customer.name} />
                    ))}
                </datalist>
              </div>
          )}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (INR)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 1000"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          {needsCustomerIdentifier && (
              <>
                <div>
                  <label htmlFor="customerIdentifier" className="block text-sm font-medium text-gray-700">Customer Aadhaar / Account No.</label>
                  <input
                      type="text"
                      id="customerIdentifier"
                      value={customerIdentifier}
                      onChange={(e) => setCustomerIdentifier(e.target.value)}
                      placeholder="Auto-filled or enter manually"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                  />
                </div>
                <div>
                  <label htmlFor="customerMobile" className="block text-sm font-medium text-gray-700">Customer Mobile No. (Optional)</label>
                  <input
                      type="text"
                      id="customerMobile"
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      placeholder="Auto-filled or enter manually"
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </>
          )}
          <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
              <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Add a note for this transaction"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
            Add Transaction
          </button>
        </form>
      </div>
      <AlertModal 
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title={modalTitle}
        message={modalMessage}
      />
    </>
  );
};

export default TransactionForm;