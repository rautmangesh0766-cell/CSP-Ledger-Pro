import React from 'react';
import { TransactionType } from '../types';

interface TransactionTypeBadgeProps {
  type: TransactionType;
}

const typeStyles: Record<TransactionType, string> = {
  [TransactionType.CUSTOMER_WITHDRAWAL]: 'bg-red-100 text-red-800',
  [TransactionType.CUSTOMER_TRANSFER]: 'bg-orange-100 text-orange-800',
  [TransactionType.CUSTOMER_DEPOSIT]: 'bg-green-100 text-green-800',
  [TransactionType.CSP_DEPOSIT_TO_BANK]: 'bg-blue-100 text-blue-800',
  [TransactionType.CSP_WITHDRAWAL_FROM_BANK]: 'bg-purple-100 text-purple-800',
};

const TransactionTypeBadge: React.FC<TransactionTypeBadgeProps> = ({ type }) => {
  const style = typeStyles[type] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}
    >
      {type}
    </span>
  );
};

export default TransactionTypeBadge;
