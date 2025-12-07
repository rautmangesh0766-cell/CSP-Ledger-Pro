import React, { useState, useRef } from 'react';

interface BackupManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onRestore: (backupJson: string) => { success: boolean, message: string };
    lastBackupTimestamp: string | null;
    onExportCSV: () => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ isOpen, onClose, onRestore, lastBackupTimestamp, onExportCSV }) => {
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDownloadJson = () => {
        setMessage(null);
        const backupData = localStorage.getItem('csp-ledger-autobackup');
        if (!backupData) {
            setMessage({ type: 'error', text: 'No backup data found to download.' });
            return;
        }

        const blob = new Blob([backupData], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `csp-ledger-backup-${date}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(null);
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                const result = onRestore(text);
                setMessage({ type: result.success ? 'success' : 'error', text: result.message });
                if (result.success) {
                    setTimeout(() => {
                        onClose();
                    }, 2000);
                }
            } else {
                setMessage({ type: 'error', text: 'Could not read the selected file.' });
            }
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.onerror = () => {
             setMessage({ type: 'error', text: 'Error reading file.' });
        };
        reader.readAsText(file);
    };

    const formattedDate = lastBackupTimestamp
        ? new Date(lastBackupTimestamp).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })
        : 'Never';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Backup & Restore</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Last automatic backup: <span className="font-semibold text-gray-700">{formattedDate}</span>
                </p>
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-700">Download Report (Excel/CSV)</h3>
                        <p className="text-sm text-gray-600 mt-1 mb-3">Save a full report of your summary and transactions in a CSV file, compatible with Excel.</p>
                        <button onClick={onExportCSV} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-150">
                            Download Report (Excel/CSV)
                        </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-700">Download Backup File for Restore (JSON)</h3>
                        <p className="text-sm text-gray-600 mt-1 mb-3">Save a machine-readable copy of all your data. This file can be used to restore your ledger later.</p>
                        <button onClick={handleDownloadJson} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150">
                            Download Backup File (JSON)
                        </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-700">Restore from Backup File (JSON)</h3>
                        <p className="text-sm text-gray-600 mt-1 mb-3">
                            <strong className="text-red-600">Warning:</strong> Restoring will overwrite all current data in the application.
                        </p>
                        <label htmlFor="restore-file" className="w-full text-center cursor-pointer bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 block transition-colors duration-150">
                            Upload File & Restore
                        </label>
                        <input
                            type="file"
                            id="restore-file"
                            accept=".json,application/json"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="hidden"
                        />
                    </div>
                </div>

                {message && (
                    <div className={`mt-4 p-3 rounded-md text-sm text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                <div className="flex justify-end mt-6">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-150">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BackupManager;