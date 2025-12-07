import React, { useState, useMemo } from 'react';
import { type Customer, type Transaction, TransactionType } from '../types';
import { EditIcon, DeleteIcon, SearchIcon, HistoryIcon } from './icons';
import TransactionTypeBadge from './TransactionTypeBadge';

const CustomerFormModal: React.FC<{
    customer?: Customer | null;
    customers: Customer[];
    onSave: (customer: Omit<Customer, 'id'> | Customer) => void;
    onClose: () => void;
}> = ({ customer, customers, onSave, onClose }) => {
    const [name, setName] = useState(customer?.name || '');
    const [identifier, setIdentifier] = useState(customer?.identifier || '');
    const [mobile, setMobile] = useState(customer?.mobile || '');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const trimmedName = name.trim();
        const trimmedIdentifier = identifier.trim();
        const trimmedMobile = mobile.trim();

        if (!trimmedName || !trimmedIdentifier) {
            setError('Customer Name and Aadhaar/Account No. are required.');
            return;
        }
        
        // Unique Identifier Validation
        const conflictingCustomer = customers.find(c => 
            c.identifier.trim().toLowerCase() === trimmedIdentifier.toLowerCase() && 
            c.id !== customer?.id
        );

        if (conflictingCustomer) {
            setError(`This Aadhaar/Account No. is already assigned to "${conflictingCustomer.name}". Identifiers must be unique.`);
            return;
        }

        onSave({ ...customer, name: trimmedName, identifier: trimmedIdentifier, mobile: trimmedMobile });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg m-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Customer Name</label>
                        <input type="text" id="customerName" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div>
                        <label htmlFor="customerIdentifier" className="block text-sm font-medium text-gray-700">Aadhaar / Account No.</label>
                        <input type="text" id="customerIdentifier" value={identifier} onChange={e => setIdentifier(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div>
                        <label htmlFor="customerMobile" className="block text-sm font-medium text-gray-700">Mobile No. (Optional)</label>
                        <input type="text" id="customerMobile" value={mobile} onChange={e => setMobile(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700">Save Customer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CustomerTransactionHistoryModal: React.FC<{
    customer: Customer;
    transactions: Transaction[];
    onClose: () => void;
}> = ({ customer, transactions, onClose }) => {
    const customerTransactions = useMemo(() => {
        return transactions
            .filter(tx => tx.customerIdentifier === customer.identifier)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first
    }, [customer, transactions]);

    const stats = useMemo(() => {
        return customerTransactions.reduce((acc, tx) => {
            if (tx.type === TransactionType.CUSTOMER_DEPOSIT) {
                acc.deposits += tx.amount;
            } else if (tx.type === TransactionType.CUSTOMER_WITHDRAWAL) {
                acc.withdrawals += tx.amount;
            }
            return acc;
        }, { deposits: 0, withdrawals: 0 });
    }, [customerTransactions]);

    const netBalance = stats.deposits - stats.withdrawals;

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl m-4 flex flex-col h-[85vh]">
                <div className="flex justify-between items-start mb-4 shrink-0">
                    <div>
                         <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
                         <p className="text-indigo-600 font-medium">{customer.name} <span className="text-gray-400 text-sm">({customer.identifier})</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center shadow-sm">
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Total Deposited</p>
                        <p className="text-xl font-bold text-green-800 mt-1">{formatCurrency(stats.deposits)}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col items-center justify-center shadow-sm">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Total Withdrawn</p>
                        <p className="text-xl font-bold text-red-800 mt-1">{formatCurrency(stats.withdrawals)}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Net Balance</p>
                        <p className={`text-xl font-bold mt-1 ${netBalance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                            {formatCurrency(netBalance)}
                        </p>
                    </div>
                </div>

                <div className="overflow-y-auto flex-grow border rounded-lg border-gray-100">
                    {customerTransactions.length === 0 ? (
                        <p className="text-gray-500 text-center py-10">No transactions found for this customer.</p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {customerTransactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(tx.date)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            <TransactionTypeBadge type={tx.type} />
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(tx.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="flex justify-end mt-6 shrink-0">
                    <button type="button" onClick={onClose} className="bg-gray-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-900 transition-colors shadow-md">Close</button>
                </div>
            </div>
        </div>
    );
};


interface CustomerManagerProps {
    customers: Customer[];
    transactions: Transaction[];
    addCustomer: (customer: Omit<Customer, 'id'>) => void;
    updateCustomer: (customer: Customer) => void;
    deleteCustomer: (customerId: string) => void;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers, transactions, addCustomer, updateCustomer, deleteCustomer }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [viewingCustomerHistory, setViewingCustomerHistory] = useState<Customer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSave = (customer: Omit<Customer, 'id'> | Customer) => {
        if ('id' in customer && customer.id) {
            updateCustomer(customer as Customer);
        } else {
            addCustomer(customer);
        }
        setIsFormOpen(false);
        setEditingCustomer(null);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingCustomer(null);
        setIsFormOpen(true);
    };

    const filteredCustomers = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        return customers.filter(c => 
            c.name.toLowerCase().includes(lowercasedQuery) ||
            c.identifier.toLowerCase().includes(lowercasedQuery)
        );
    }, [customers, searchQuery]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-xl h-full">
            {isFormOpen && (
                <CustomerFormModal
                    customer={editingCustomer}
                    customers={customers}
                    onSave={handleSave}
                    onClose={() => { setIsFormOpen(false); setEditingCustomer(null); }}
                />
            )}

            {viewingCustomerHistory && (
                <CustomerTransactionHistoryModal
                    customer={viewingCustomerHistory}
                    transactions={transactions}
                    onClose={() => setViewingCustomerHistory(null)}
                />
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-gray-800 shrink-0">Customer Management</h2>
                <div className="flex items-center space-x-2 w-full">
                    <div className="relative w-full">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3" aria-hidden="true">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white"
                            aria-label="Search customers"
                        />
                    </div>
                    <button onClick={handleAddNew} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 whitespace-nowrap transition-colors">
                        Add New
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto max-h-[600px]">
                {customers.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">No customers saved yet. Click "Add New" to start.</p>
                ) : filteredCustomers.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">No customers match your search.</p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aadhaar / Account No.</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile No.</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                                    <td className="px-4 py-4 text-sm text-gray-500">{customer.identifier}</td>
                                    <td className="px-4 py-4 text-sm text-gray-500">{customer.mobile || 'N/A'}</td>
                                    <td className="px-4 py-4 text-sm">
                                        <div className="flex items-center space-x-4">
                                            <button onClick={() => setViewingCustomerHistory(customer)} title="View History" className="text-gray-500 hover:text-gray-800"><HistoryIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleEdit(customer)} title="Edit Customer" className="text-indigo-600 hover:text-indigo-900"><EditIcon className="w-5 h-5" /></button>
                                            <button onClick={() => deleteCustomer(customer.id)} title="Delete Customer" className="text-red-600 hover:text-red-900"><DeleteIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CustomerManager;