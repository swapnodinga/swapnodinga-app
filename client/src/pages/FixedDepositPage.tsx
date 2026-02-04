import React, { useState } from 'react';
import { useSociety } from '@/context/SocietyContext';
import { Plus, CheckCircle, Clock } from 'lucide-react';

const FixedDepositPage = () => {
  const { fixedDeposits, addDeposit, updateDeposit } = useSociety();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amount: 0,
    interest_rate: 0,
    tenure_months: 3,
    start_date: '',
    month: '',
    year: '',
    status: 'Active' as 'Active' | 'Finished'
  });

  // 1. SYNC LOGIC: Ensures Month/Year matches the Date selected
  const handleDateChange = (dateStr: string) => {
    if (!dateStr) return;
    const date = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    setFormData(prev => ({
      ...prev,
      start_date: dateStr,
      month: months[date.getMonth()],
      year: date.getFullYear().toString()
    }));
  };

  // 2. MATH LOGIC: Calculates Interest only if Finished (Forces June 2024 to Finished)
  const calculateMaturity = (fd: any) => {
    const isJune2024 = fd.month === 'June' && fd.year === '2024';
    const effectiveStatus = isJune2024 ? 'Finished' : fd.status;

    if (effectiveStatus !== 'Finished') return fd.amount; 
    if (!fd.start_date) return fd.amount;

    const start = new Date(fd.start_date);
    const end = new Date(fd.start_date);
    end.setMonth(start.getMonth() + Number(fd.tenure_months));
    
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const interest = (fd.amount * fd.interest_rate * diffDays) / (100 * 365);
    
    return fd.amount + interest;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        amount: Number(formData.amount), 
        interest_rate: Number(formData.interest_rate),
        tenure_months: Number(formData.tenure_months)
      };
      
      if (editingId) {
        await updateDeposit(editingId, payload);
      } else {
        await addDeposit(payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (error) {
      alert("Error saving record. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Society Treasury Ledger</h1>
        <button 
          onClick={() => { 
            setEditingId(null); 
            setFormData({ amount: 0, interest_rate: 0, tenure_months: 3, start_date: '', month: '', year: '', status: 'Active' });
            setIsModalOpen(true); 
          }}
          className="flex items-center gap-2 bg-[#007b5e] text-white px-4 py-2 rounded-lg hover:bg-[#005f48]"
        >
          <Plus size={18} /> Add New FD
        </button>
      </div>

      {/* MAIN TABLE FORMAT */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Period / Status</th>
              <th className="p-4">Principal (BDT)</th>
              <th className="p-4">Rate (%)</th>
              <th className="p-4 text-right">Maturity Est.</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {fixedDeposits.map((fd) => {
              // Force June 2024 to show as Finished
              const isJune2024 = fd.month === 'June' && fd.year === '2024';
              const displayStatus = isJune2024 ? 'Finished' : (fd.status || 'Active');

              return (
                <tr key={fd.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{fd.month} {fd.year}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{fd.start_date}</div>
                    
                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 uppercase ${
                      displayStatus === 'Finished' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {displayStatus === 'Finished' ? <CheckCircle size={10} /> : <Clock size={10} />}
                      {displayStatus}
                    </span>
                  </td>
                  <td className="p-4 font-medium">৳{fd.amount.toLocaleString()}</td>
                  <td className="p-4 font-semibold text-blue-600">{fd.interest_rate}%</td>
                  <td className="p-4 text-right">
                    <div className="bg-[#003d2e] text-white px-3 py-1 rounded-md inline-block font-bold">
                      ৳{calculateMaturity({...fd, status: displayStatus}).toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {/* BLUE EDIT BUTTON */}
                    <button 
                      onClick={() => {
                        setEditingId(fd.id);
                        setFormData({...fd, status: displayStatus});
                        setIsModalOpen(true);
                      }} 
                      className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* INPUT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6">{editingId ? 'Edit Ledger' : 'New Bank Deposit'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">1. Choose Start Date</label>
                <input 
                  type="date" 
                  required 
                  className="w-full border rounded-xl p-3 bg-slate-50 mt-1 border-slate-200" 
                  value={formData.start_date} 
                  onChange={e => handleDateChange(e.target.value)} 
                />
                {/* Auto-synced Period Display */}
                <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-100 flex justify-between items-center">
                   <span className="text-[10px] text-green-600 font-bold uppercase">Linked Period:</span>
                   <span className="text-sm font-bold text-slate-700">{formData.month} {formData.year}</span>
                </div>
              </div>

              <input type="number" placeholder="Principal Amount (৳)" className="w-full border rounded-xl p-3" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.001" placeholder="Rate (%)" className="border rounded-xl p-3" value={formData.interest_rate || ''} onChange={e => setFormData({...formData, interest_rate: Number(e.target.value)})} />
                <input type="number" placeholder="Tenure (Months)" className="border rounded-xl p-3" value={formData.tenure_months || ''} onChange={e => setFormData({...formData, tenure_months: Number(e.target.value)})} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">2. Status</label>
                <select className="w-full border rounded-xl p-3 font-bold bg-slate-50 mt-1" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                  <option value="Active">Active (Hold Interest)</option>
                  <option value="Finished">Finished (Apply Interest)</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-[#007b5e] text-white font-bold py-4 rounded-xl mt-4 hover:bg-[#005f48] shadow-md">
                {editingId ? 'Save Changes' : 'Add Deposit'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 font-medium py-2">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedDepositPage;