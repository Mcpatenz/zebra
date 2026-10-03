import React, { useState } from 'react';
import { Customer, Transaction, CurrentUserSession } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { formatDate, formatCurrency, formatDateTime } from '../../lib/formatters';
import { hasPermission } from '../../lib/permissions';
import { PlusCircle, ShieldCheck, AlertCircle, User, Phone, MapPin, CreditCard } from 'lucide-react';
import { Modal } from '../common/Modal';

interface CustomersViewProps {
  session: CurrentUserSession;
  customers: Customer[];
  transactions: Transaction[];
  onCreateCustomer: (data: Omit<Customer, 'id' | 'customerNo' | 'createdAt'>) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  session,
  customers,
  transactions,
  onCreateCustomer,
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New customer form state
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [idType, setIdType] = useState('Philippine Passport');
  const [idNumber, setIdNumber] = useState('');
  const [kycVerified, setKycVerified] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !contact.trim()) {
      setFormError('First name, last name, and contact number are required.');
      return;
    }
    setFormError(null);
    onCreateCustomer({
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      contact: contact.trim(),
      email: email.trim() || undefined,
      address: address.trim() || 'Cebu City, Philippines',
      idType,
      idNumber: idNumber.trim() || `ID-${Math.floor(100000 + Math.random() * 900000)}`,
      kycVerified,
      status: true,
    });
    // Reset form
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setContact('');
    setEmail('');
    setAddress('');
    setIdNumber('');
    setIsNewModalOpen(false);
  };

  const columns: Column<Customer>[] = [
    {
      header: 'Customer #',
      accessorKey: 'customerNo',
      cell: (item) => (
        <span className="font-mono font-semibold text-slate-900">{item.customerNo}</span>
      ),
    },
    {
      header: 'Full Name',
      cell: (item) => (
        <div>
          <span className="font-semibold text-slate-900">{item.lastName}, {item.firstName}</span>
          {item.middleName && <span className="text-slate-400 text-[11px] ml-1">{item.middleName}</span>}
        </div>
      ),
    },
    {
      header: 'Contact Info',
      cell: (item) => (
        <div className="font-mono text-[11px] text-slate-600">
          <div>{item.contact}</div>
          {item.email && <div className="text-[10px] text-slate-400">{item.email}</div>}
        </div>
      ),
    },
    {
      header: 'Government Identification',
      cell: (item) => (
        <div>
          <span className="text-slate-700">{item.idType || 'Govt ID'}</span>
          <span className="block font-mono text-[10px] text-slate-400">{item.idNumber || '—'}</span>
        </div>
      ),
    },
    {
      header: 'KYC Status',
      cell: (item) => (
        <span className={`inline-flex items-center gap-1.5 font-medium ${
          item.kycVerified ? 'text-emerald-700' : 'text-amber-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${item.kycVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span>{item.kycVerified ? 'Verified KYC' : 'Unverified'}</span>
        </span>
      ),
    },
    {
      header: 'Registered',
      cell: (item) => (
        <span className="font-mono text-slate-500 text-[11px] tabular-nums">
          {formatDate(item.createdAt)}
        </span>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      cell: (item) => (
        <button
          onClick={() => setSelectedCustomer(item)}
          className="px-2.5 py-1 text-slate-700 bg-slate-50 hover:bg-slate-200 hover:text-slate-900 rounded font-medium transition-colors cursor-pointer"
        >
          Profile
        </button>
      ),
    },
  ];

  const searchFilter = (item: Customer, query: string): boolean => {
    return (
      item.customerNo.toLowerCase().includes(query) ||
      item.firstName.toLowerCase().includes(query) ||
      item.lastName.toLowerCase().includes(query) ||
      item.contact.toLowerCase().includes(query)
    );
  };

  const customerTransactions = selectedCustomer
    ? transactions.filter(t => t.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Customer Directory & KYC Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered transactors, identity compliance, and counter activity histories
          </p>
        </div>

        {hasPermission(session.role, 'CUSTOMERS_CREATE') && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Transactor</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search by customer #, name, contact..."
        searchFilter={searchFilter}
      />

      {/* New Customer Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Register New Customer Transactor"
        subtitle="Perform KYC customer enrollment according to BSP and AML regulatory standards"
        maxWidth="lg"
      >
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Maria"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Middle Name</label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="e.g. Santos"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Dela Cruz"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+63 917 XXX XXXX"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.ph"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Residential Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Unit 4, Osmeña Blvd, Cebu City"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Government ID Type *</label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900"
              >
                <option value="Philippine Passport">Philippine Passport</option>
                <option value="National ID (PhilSys)">National ID (PhilSys)</option>
                <option value="Driver License">Driver License (LTO)</option>
                <option value="UMID">UMID (SSS/GSIS)</option>
                <option value="Voter ID">Voter ID / Certificate</option>
                <option value="PRC ID">PRC License</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ID Serial / Card Number</label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="e.g. P992182B"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
            <input
              type="checkbox"
              id="kycCheck"
              checked={kycVerified}
              onChange={(e) => setKycVerified(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="kycCheck" className="text-xs text-slate-700 cursor-pointer">
              <strong>Certify Physical ID Verification:</strong> Teller has inspected primary government ID in person and confirmed biometrics/photo match.
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
            >
              Enroll Transactor
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Profile & Transaction Ledger Detail Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Customer Record: ${selectedCustomer?.lastName}, ${selectedCustomer?.firstName}`}
        subtitle={`Account: ${selectedCustomer?.customerNo}`}
        maxWidth="2xl"
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] block">Transactor Details</span>
                <p className="font-semibold text-slate-900 text-sm">
                  {selectedCustomer.lastName}, {selectedCustomer.firstName} {selectedCustomer.middleName || ''}
                </p>
                <p className="text-slate-600 font-mono">Contact: {selectedCustomer.contact}</p>
                <p className="text-slate-600">Address: {selectedCustomer.address}</p>
              </div>

              <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-3 pt-2 sm:pt-0">
                <span className="text-slate-400 text-[11px] block">Identification & KYC</span>
                <p className="text-slate-700 font-medium">Type: {selectedCustomer.idType}</p>
                <p className="font-mono text-slate-700">Serial: {selectedCustomer.idNumber}</p>
                <p className="mt-1">
                  Status:{' '}
                  <span className={`font-semibold ${selectedCustomer.kycVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {selectedCustomer.kycVerified ? 'Verified Active Transactor' : 'Pending Verification'}
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Enrolled: {formatDateTime(selectedCustomer.createdAt)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">
                  Customer Transaction Ledger ({customerTransactions.length})
                </h3>
                <span className="text-slate-500 font-mono text-[11px]">
                  Total Volume:{' '}
                  <strong className="text-slate-900">
                    {formatCurrency(customerTransactions.reduce((acc, t) => acc + t.amount, 0))}
                  </strong>
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-md">
                {customerTransactions.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No past transactions recorded for this customer.</div>
                ) : (
                  customerTransactions.map((txn) => (
                    <div key={txn.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-mono font-semibold text-slate-900">{txn.transactionNo}</span>
                        <span className="text-slate-500 text-[11px] block">{txn.type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {formatCurrency(txn.amount)}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {formatDate(txn.createdAt)} · {txn.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-xs cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
