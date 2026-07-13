import React, { useState } from 'react';

export default function LinkStrategyModal({ strategy, accounts, onClose, onLink }) {
  const [accountId, setAccountId] = useState(strategy?.linkedAccountId || '');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Link to Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Link <span className="font-medium text-gray-900">{strategy?.name}</span> to an account.
        </p>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-gray-400"
        >
          <option value="">Select account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.type})
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => {
              onLink(accountId);
              onClose();
            }}
            disabled={!accountId}
            className="bg-brand-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-600 disabled:opacity-40"
          >
            Link account
          </button>
        </div>
      </div>
    </div>
  );
}
