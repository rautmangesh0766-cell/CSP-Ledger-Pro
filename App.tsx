import React from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import CustomerManager from './components/CustomerManager';
import { useLedger } from './hooks/useLedger';
import BackupManager from './components/BackupManager';
import { UsersIcon } from './components/icons';

const App: React.FC = () => {
  const { 
    transactions, 
    addTransaction, 
    summary, 
    setInitialValues, 
    updateTransaction, 
    toggleHighlight, 
    deleteTransaction, 
    updateCurrentBalances,
    restoreFromBackup,
    lastAutoBackupTimestamp,
    exportDataAsCSV,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useLedger();
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [bankBalance, setBankBalance] = React.useState('');
  const [cashInHand, setCashInHand] = React.useState('');
  const [isBackupModalOpen, setIsBackupModalOpen] = React.useState(false);
  const [activeView, setActiveView] = React.useState<'transactions' | 'customers'>('transactions');

  React.useEffect(() => {
    const storedBankBalance = localStorage.getItem('csp-ledger-initial-bank-balance');
    const storedCashInHand = localStorage.getItem('csp-ledger-initial-cash-in-hand');
    if (storedBankBalance !== null && storedCashInHand !== null) {
      setIsInitialized(true);
    }
  }, []);

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Modern browsers show a generic message, but this is for older ones.
      // The key is that this triggers the prompt.
      const message = 'Your latest data is automatically saved. For an external copy, use the "Backup & Restore" feature to download a report. Are you sure you want to leave?';
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Empty dependency array ensures this effect runs only once.


  const handleInitialization = (e: React.FormEvent) => {
    e.preventDefault();
    const bank = parseFloat(bankBalance);
    const cash = parseFloat(cashInHand);
    if (!isNaN(bank) && !isNaN(cash)) {
      setInitialValues(bank, cash);
      setIsInitialized(true);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Welcome to CSP Ledger Pro</h2>
          <p className="text-center text-gray-500 mb-6">Please set your initial balances to get started.</p>
          <form onSubmit={handleInitialization} className="space-y-4">
            <div>
              <label htmlFor="initialBankBalance" className="block text-sm font-medium text-gray-700">Initial Bank Balance</label>
              <input
                type="number"
                id="initialBankBalance"
                value={bankBalance}
                onChange={(e) => setBankBalance(e.target.value)}
                placeholder="e.g., 100000"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label htmlFor="initialCashInHand" className="block text-sm font-medium text-gray-700">Initial Cash In Hand</label>
              <input
                type="number"
                id="initialCashInHand"
                value={cashInHand}
                onChange={(e) => setCashInHand(e.target.value)}
                placeholder="e.g., 50000"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
              Save and Start
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Header onBackupClick={() => setIsBackupModalOpen(true)} />
        <main className="container mx-auto p-4 md:p-6 lg:p-8">
          <Dashboard summary={summary} onUpdateBalances={updateCurrentBalances} />
          
          <div className="mt-8 mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                onClick={() => setActiveView('transactions')}
                className={`${
                  activeView === 'transactions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
                aria-current={activeView === 'transactions' ? 'page' : undefined}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span>Transactions</span>
              </button>
              <button
                onClick={() => setActiveView('customers')}
                className={`${
                  activeView === 'customers'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
                 aria-current={activeView === 'customers' ? 'page' : undefined}
              >
                <UsersIcon className="h-5 w-5" />
                <span>Customers</span>
              </button>
            </nav>
          </div>

          {activeView === 'transactions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <TransactionForm 
                  addTransaction={addTransaction} 
                  customers={customers}
                  addCustomer={addCustomer}
                />
              </div>
              <div className="lg:col-span-2 transaction-history-wrapper">
                <TransactionHistory
                  transactions={transactions}
                  onUpdateTransaction={updateTransaction}
                  onToggleHighlight={toggleHighlight}
                  onDeleteTransaction={deleteTransaction}
                />
              </div>
            </div>
          )}
          
          {activeView === 'customers' && (
            <CustomerManager
                customers={customers}
                addCustomer={addCustomer}
                updateCustomer={updateCustomer}
                deleteCustomer={deleteCustomer}
                transactions={transactions}
            />
          )}

        </main>
      </div>
      <BackupManager
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRestore={restoreFromBackup}
        lastBackupTimestamp={lastAutoBackupTimestamp}
        onExportCSV={exportDataAsCSV}
      />
    </>
  );
};

export default App;