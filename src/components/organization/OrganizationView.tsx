import React, { useState } from 'react';
import { Region, Area, Branch, CurrentUserSession, BranchStatus } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { hasPermission } from '../../lib/permissions';
import { PlusCircle, Building2, MapPin, Compass, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';

interface OrganizationViewProps {
  session: CurrentUserSession;
  regions: Region[];
  areas: Area[];
  branches: Branch[];
  onCreateBranch: (data: Omit<Branch, 'id'>) => void;
}

export const OrganizationView: React.FC<OrganizationViewProps> = ({
  session,
  regions,
  areas,
  branches,
  onCreateBranch,
}) => {
  const [activeTab, setActiveTab] = useState<'BRANCHES' | 'AREAS' | 'REGIONS'>('BRANCHES');
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState(areas[0]?.id || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [contact, setContact] = useState('');
  const [managerName, setManagerName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const regionMap = new Map(regions.map(r => [r.id, r]));
  const areaMap = new Map(areas.map(a => [a.id, a]));

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setFormError('Branch code and name are required.');
      return;
    }
    setFormError(null);
    onCreateBranch({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      areaId,
      address: address.trim() || undefined,
      city: city.trim() || 'Cebu City',
      province: province.trim() || 'Cebu',
      contact: contact.trim() || undefined,
      managerName: managerName.trim() || 'Assigned Officer',
      status: 'ACTIVE',
    });
    setCode('');
    setName('');
    setAddress('');
    setCity('');
    setProvince('');
    setContact('');
    setManagerName('');
    setIsNewBranchModalOpen(false);
  };

  const branchColumns: Column<Branch>[] = [
    {
      header: 'Branch Code',
      accessorKey: 'code',
      cell: (item) => <span className="font-mono font-semibold text-slate-900">{item.code}</span>,
    },
    {
      header: 'Branch Name',
      accessorKey: 'name',
      cell: (item) => <span className="font-semibold text-slate-900">{item.name}</span>,
    },
    {
      header: 'Area & Region',
      cell: (item) => {
        const area = areaMap.get(item.areaId);
        const region = area ? regionMap.get(area.regionId) : undefined;
        return (
          <div>
            <span className="font-medium text-slate-800">{area?.name || 'Area'}</span>
            <span className="block text-[11px] text-slate-400">{region?.name || 'Region'}</span>
          </div>
        );
      },
    },
    {
      header: 'City / Province',
      cell: (item) => (
        <span className="text-slate-600">
          {item.city || '—'}, {item.province || ''}
        </span>
      ),
    },
    {
      header: 'Branch Manager',
      cell: (item) => (
        <span className="text-slate-800 font-medium">{item.managerName || 'Pending Assignment'}</span>
      ),
    },
    {
      header: 'Contact',
      cell: (item) => (
        <span className="font-mono text-slate-500 text-[11px]">{item.contact || '—'}</span>
      ),
    },
    {
      header: 'Status',
      cell: (item) => (
        <span className={`inline-flex items-center gap-1.5 font-medium ${
          item.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          <span>{item.status.replace('_', ' ')}</span>
        </span>
      ),
    },
  ];

  const areaColumns: Column<Area>[] = [
    {
      header: 'Area Code',
      accessorKey: 'code',
      cell: (item) => <span className="font-mono font-semibold text-slate-900">{item.code}</span>,
    },
    {
      header: 'Area Designation',
      accessorKey: 'name',
      cell: (item) => <span className="font-semibold text-slate-900">{item.name}</span>,
    },
    {
      header: 'Supervising Region',
      cell: (item) => {
        const region = regionMap.get(item.regionId);
        return <span className="text-slate-700">{region?.name || item.regionId}</span>;
      },
    },
    {
      header: 'Area Manager',
      cell: (item) => <span className="text-slate-800 font-medium">{item.managerName || '—'}</span>,
    },
    {
      header: 'Branches Count',
      align: 'right',
      cell: (item) => {
        const count = branches.filter(b => b.areaId === item.id).length;
        return <span className="font-mono tabular-nums text-slate-800 font-semibold">{count} branches</span>;
      },
    },
    {
      header: 'Operational Status',
      cell: (item) => (
        <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Active Operations</span>
        </span>
      ),
    },
  ];

  const regionColumns: Column<Region>[] = [
    {
      header: 'Region Code',
      accessorKey: 'code',
      cell: (item) => <span className="font-mono font-semibold text-slate-900">{item.code}</span>,
    },
    {
      header: 'Regional Jurisdiction',
      accessorKey: 'name',
      cell: (item) => <span className="font-semibold text-slate-900">{item.name}</span>,
    },
    {
      header: 'Regional Director',
      cell: (item) => <span className="text-slate-800 font-medium">{item.managerName || '—'}</span>,
    },
    {
      header: 'Covered Areas',
      align: 'right',
      cell: (item) => {
        const count = areas.filter(a => a.regionId === item.id).length;
        return <span className="font-mono tabular-nums text-slate-800 font-semibold">{count} areas</span>;
      },
    },
    {
      header: 'Total Branches',
      align: 'right',
      cell: (item) => {
        const areaIds = new Set(areas.filter(a => a.regionId === item.id).map(a => a.id));
        const count = branches.filter(b => areaIds.has(b.areaId)).length;
        return <span className="font-mono tabular-nums text-slate-800 font-semibold">{count} branches</span>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Organizational Structure & Branch Network
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic governance hierarchy: Regions → Operational Areas → Physical Branches
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Functional segmented control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
            <button
              onClick={() => setActiveTab('BRANCHES')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'BRANCHES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Branches ({branches.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('AREAS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'AREAS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Areas ({areas.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('REGIONS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'REGIONS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Regions ({regions.length})</span>
            </button>
          </div>

          {activeTab === 'BRANCHES' && hasPermission(session.role, 'BRANCHES_MANAGE') && (
            <button
              onClick={() => setIsNewBranchModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Branch</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'BRANCHES' && (
        <DataTable
          columns={branchColumns}
          data={branches}
          searchPlaceholder="Search branch code, name, city..."
          searchFilter={(b, q) => b.code.toLowerCase().includes(q) || b.name.toLowerCase().includes(q) || (b.city?.toLowerCase().includes(q) ?? false)}
        />
      )}

      {activeTab === 'AREAS' && (
        <DataTable
          columns={areaColumns}
          data={areas}
          searchPlaceholder="Search area designation..."
          searchFilter={(a, q) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)}
        />
      )}

      {activeTab === 'REGIONS' && (
        <DataTable
          columns={regionColumns}
          data={regions}
          searchPlaceholder="Search region code, name..."
          searchFilter={(r, q) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)}
        />
      )}

      {/* Add Branch Modal */}
      <Modal
        isOpen={isNewBranchModalOpen}
        onClose={() => setIsNewBranchModalOpen(false)}
        title="Provision New Operational Branch"
        subtitle="Register branch identity into organizational tree"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Branch Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. BR008-ILO"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs focus:ring-1 focus:ring-slate-900 uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Operational Area *</label>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900"
              >
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Branch Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Iloilo City Downtown Branch"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Iloilo City"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Province</label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="e.g. Iloilo"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Branch Manager Name</label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="e.g. Fernando Lopez"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+63 (33) 330-1000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Valeria St. cor. Iznart St."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewBranchModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
            >
              Register Branch Node
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
