// Added React import to fix namespace error for React.Dispatch and React.SetStateAction
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Transaction, LedgerSummary, Customer } from '../types';
import { TransactionType } from '../types';

const usePersistedState = <T,>(key: string, initialState: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        try {
            const storageValue = localStorage.getItem(key);
            return storageValue ? JSON.parse(storageValue) : initialState;
        } catch (error) {
            console.error(`Error reading from localStorage key “${key}”:`, error);
            return initialState;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error writing to localStorage key “${key}”:`, error);
        }
    }, [key, state]);

    return [state, setState];
};

export const useLedger = () => {
    const [transactions, setTransactions] = usePersistedState<Transaction[]>('csp-ledger-transactions', []);
    const [customers, setCustomers] = usePersistedState<Customer[]>('csp-ledger-customers', []);
    const [initialBankBalance, setInitialBankBalance] = usePersistedState<number>('csp-ledger-initial-bank-balance', 0);
    const [initialCashInHand, setInitialCashInHand] = usePersistedState<number>('csp-ledger-initial-cash-in-hand', 0);
    const [lastAutoBackup, setLastAutoBackup] = usePersistedState<{ timestamp: string | null }>('csp-ledger-last-autobackup-info', { timestamp: null });
    
    // Auto-backup effect
    useEffect(() => {
        const backupData = {
            transactions,
            customers,
            initialBankBalance,
            initialCashInHand,
        };
        const timestamp = new Date().toISOString();
        localStorage.setItem('csp-ledger-autobackup', JSON.stringify(backupData));
        setLastAutoBackup({ timestamp });
    }, [transactions, customers, initialBankBalance, initialCashInHand, setLastAutoBackup]);


    const addTransaction = useCallback((newTransaction: Omit<Transaction, 'id' | 'date' | 'isHighlighted'>) => {
        const transaction: Transaction = {
            ...newTransaction,
            id: new Date().toISOString() + Math.random(),
            date: new Date().toISOString(),
            isHighlighted: false,
        };
        setTransactions(prev => [transaction, ...prev]);
    }, [setTransactions]);

    const updateTransaction = useCallback((updatedTx: Transaction) => {
        setTransactions(prev => prev.map(tx => tx.id === updatedTx.id ? updatedTx : tx));
    }, [setTransactions]);
    
    const deleteTransaction = useCallback((transactionId: string) => {
        setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
    }, [setTransactions]);

    const toggleHighlight = useCallback((transactionId: string) => {
        setTransactions(prev => prev.map(tx =>
            tx.id === transactionId ? { ...tx, isHighlighted: !tx.isHighlighted } : tx
        ));
    }, [setTransactions]);
    
    const addCustomer = useCallback((newCustomer: Omit<Customer, 'id'>) => {
        const customer: Customer = {
            ...newCustomer,
            id: new Date().toISOString() + Math.random(),
        };
        setCustomers(prev => [...prev, customer].sort((a, b) => a.name.localeCompare(b.name)));
    }, [setCustomers]);

    const updateCustomer = useCallback((updatedCustomer: Customer) => {
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c).sort((a, b) => a.name.localeCompare(b.name)));
    }, [setCustomers]);

    const deleteCustomer = useCallback((customerId: string) => {
        if (window.confirm('Are you sure you want to delete this customer? This will not delete their past transactions.')) {
            setCustomers(prev => prev.filter(c => c.id !== customerId));
        }
    }, [setCustomers]);


    const setInitialValues = useCallback((bank: number, cash: number) => {
        setInitialBankBalance(bank);
        setInitialCashInHand(cash);
    }, [setInitialBankBalance, setInitialCashInHand]);

    const transactionCalculations = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];

        return transactions.reduce((acc, tx) => {
            const isToday = tx.date.startsWith(today);

            // CSP Perspective Logic:
            // - Customer Deposit: CSP gets cash, transfers money from bank. Bank balance down, cash up.
            // - Customer Withdrawal: CSP gives cash, receives money in bank. Bank balance up, cash down.
            // - Customer Transfer: CSP gets cash, transfers money from bank. Bank balance down, cash up.
            // - CSP Deposit to Bank: CSP puts cash in bank. Bank balance up, cash down.
            // - CSP Withdrawal from Bank: CSP takes cash from bank. Bank balance down, cash up.
            switch (tx.type) {
                case TransactionType.CUSTOMER_DEPOSIT:
                    acc.bankBalanceChange -= tx.amount; // Money out of CSP bank to customer's account
                    acc.cashInHandChange += tx.amount; // Cash received from customer
                    acc.totalDebited += tx.amount;
                    if (isToday) acc.depositToday += tx.amount;
                    break;
                case TransactionType.CUSTOMER_WITHDRAWAL:
                    acc.bankBalanceChange += tx.amount; // Money into CSP bank from customer's account
                    acc.cashInHandChange -= tx.amount; // Cash given to customer
                    acc.totalDeposited += tx.amount;
                    if (isToday) acc.withdrawalToday += tx.amount;
                    break;
                case TransactionType.CUSTOMER_TRANSFER:
                    acc.bankBalanceChange -= tx.amount; // Money out of CSP bank to recipient
                    acc.cashInHandChange += tx.amount; // Cash received from customer
                    acc.totalDebited += tx.amount;
                    if (isToday) acc.withdrawalToday += tx.amount;
                    break;
                case TransactionType.CSP_DEPOSIT_TO_BANK:
                    acc.bankBalanceChange += tx.amount; // Money into CSP bank
                    acc.cashInHandChange -= tx.amount; // Cash out of hand
                    acc.totalDeposited += tx.amount;
                    break;
                case TransactionType.CSP_WITHDRAWAL_FROM_BANK:
                    acc.bankBalanceChange -= tx.amount; // Money out of CSP bank
                    acc.cashInHandChange += tx.amount; // Cash into hand
                    acc.totalDebited += tx.amount;
                    break;
            }

            return acc;
        }, {
            bankBalanceChange: 0,
            cashInHandChange: 0,
            withdrawalToday: 0,
            depositToday: 0,
            totalDebited: 0,
            totalDeposited: 0,
        });
    }, [transactions]);
    
    const updateCurrentBalances = useCallback(({ newBankBalance, newCashInHand }: { newBankBalance?: number; newCashInHand?: number }) => {
        const { bankBalanceChange, cashInHandChange } = transactionCalculations;
        
        if (typeof newBankBalance === 'number' && !isNaN(newBankBalance)) {
            setInitialBankBalance(newBankBalance - bankBalanceChange);
        }
        
        if (typeof newCashInHand === 'number' && !isNaN(newCashInHand)) {
            setInitialCashInHand(newCashInHand - cashInHandChange);
        }
    }, [transactionCalculations, setInitialBankBalance, setInitialCashInHand]);


    const summary: LedgerSummary = useMemo(() => {
        return {
            remainingBalance: initialBankBalance + transactionCalculations.bankBalanceChange,
            cashInHand: initialCashInHand + transactionCalculations.cashInHandChange,
            withdrawalToday: transactionCalculations.withdrawalToday,
            depositToday: transactionCalculations.depositToday,
            totalDebited: transactionCalculations.totalDebited,
            totalDeposited: transactionCalculations.totalDeposited
        };
    }, [initialBankBalance, initialCashInHand, transactionCalculations]);

    const restoreFromBackup = useCallback((backupJson: string): { success: boolean, message: string } => {
        try {
            const backupData = JSON.parse(backupJson);
    
            // Basic validation
            if (!backupData || typeof backupData !== 'object' || !Array.isArray(backupData.transactions) || typeof backupData.initialBankBalance !== 'number' || typeof backupData.initialCashInHand !== 'number') {
                throw new Error("Invalid or corrupted backup file format.");
            }
    
            const isConfirmed = window.confirm(
                'Are you sure you want to restore from this backup? This will overwrite all your current data.'
            );
    
            if (isConfirmed) {
                setTransactions(backupData.transactions);
                setCustomers(backupData.customers || []);
                setInitialBankBalance(backupData.initialBankBalance);
                setInitialCashInHand(backupData.initialCashInHand);
                return { success: true, message: "Data restored successfully." };
            } else {
                return { success: false, message: "Restore operation cancelled." };
            }
        } catch (error) {
            console.error("Failed to restore backup:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            return { success: false, message: `Failed to restore backup: ${message}` };
        }
    }, [setTransactions, setCustomers, setInitialBankBalance, setInitialCashInHand]);

    const exportDataAsCSV = useCallback(() => {
        if (transactions.length === 0 && initialBankBalance === 0 && initialCashInHand === 0) {
            window.alert("No data to export.");
            return;
        }
    
        const summaryData = [
            ['CSP Ledger Pro - Data Report'],
            ['Report Generated On', new Date().toLocaleString('en-IN')],
            [],
            ['ACCOUNT SUMMARY'],
            ['Initial Bank Balance', initialBankBalance],
            ['Initial Cash In Hand', initialCashInHand],
            ['Current Bank Balance', summary.remainingBalance],
            ['Current Cash In Hand', summary.cashInHand],
            ['Total Debited from Bank (Since Start)', summary.totalDebited],
            ['Total Deposited to Bank (Since Start)', summary.totalDeposited],
            [],
            [`TRANSACTION HISTORY (${transactions.length} entries)`],
        ];
        
        const headers = ['ID', 'Date & Time', 'Transaction Type', 'Amount (INR)', 'Customer Name', 'Customer Aadhaar / Account No.', 'Customer Mobile', 'Description'];
        
        const transactionRows = [...transactions].reverse().map(tx => [
            tx.id,
            new Date(tx.date).toLocaleString('en-IN'),
            tx.type,
            tx.amount,
            tx.customerName || '',
            tx.customerIdentifier || '',
            tx.customerMobile || '',
            tx.description || ''
        ]);
    
        const escapeCsvCell = (cell: string | number) => {
            const cellStr = String(cell).replace(/"/g, '""');
            if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('\r')) {
                return `"${cellStr}"`;
            }
            return cellStr;
        };
        
        const csvRows = [
            ...summaryData.map(row => row.join(',')),
            headers.join(','),
            ...transactionRows.map(row => row.map(escapeCsvCell).join(','))
        ];
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `csp-ledger-report-${date}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [transactions, summary, initialBankBalance, initialCashInHand]);

    return { transactions, addTransaction, summary, setInitialValues, updateTransaction, toggleHighlight, deleteTransaction, updateCurrentBalances, restoreFromBackup, lastAutoBackupTimestamp: lastAutoBackup.timestamp, exportDataAsCSV, customers, addCustomer, updateCustomer, deleteCustomer };
};