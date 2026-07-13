import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import AddAccountModal from '../../components/modals/AddAccountModal';
import { AccountTypeIcon, TrashIcon } from '../../components/AccountTypeIcon';

const fmtUsd = (v) => Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function Accounts() {
  const { accounts, setAccounts, strategies } = useOutletContext();
  const [showModal, setShowModal] = useState(false);

  const handleCreate = (account) => {
    setAccounts((prev) => [...prev, account]);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Accounts {accounts.length > 0 && <span className="text-gray-400 text-sm font-normal">{accounts.length}</span>}
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600"
        >
          + Add account
        </button>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 overflow-x-auto">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <AccountTypeIcon type="default" className="w-8 h-8 text-gray-300 mb-3" />
            <div className="font-semibold text-gray-900">No accounts found</div>
            <p className="text-sm text-gray-400 mt-1">Add an account to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                <th className="py-2">Name</th>
                <th className="py-2">Type</th>
                <th className="py-2">Size</th>
                <th className="py-2">Profit Split</th>
                <th className="py-2">Monthly Fee</th>
                <th className="py-2">Trades</th>
                <th className="py-2">Status</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-gray-50">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">
                        <AccountTypeIcon type={a.type} />
                      </span>
                      <span className="font-medium text-gray-900">{a.name}</span>
                    </div>
                  </td>
                  <td className="py-2 text-gray-500">{a.type}</td>
                  <td className="py-2 font-medium text-gray-900">{fmtUsd(a.size)}</td>
                  <td className="py-2 text-gray-700">{a.profitSplit}%</td>
                  <td className="py-2 text-gray-700">{fmtUsd(a.monthlyFee)}</td>
                  <td className="py-2 text-gray-700">{a.tradesLoaded}</td>
                  <td className="py-2">
                    <span className="text-xs font-medium flex items-center gap-1.5 text-brand-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> {a.status}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-gray-300 hover:text-red-600"
                      aria-label="Delete account"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <AddAccountModal strategies={strategies} onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </div>
  );
}
