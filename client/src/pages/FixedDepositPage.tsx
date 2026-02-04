import React, { useState } from 'react';
import { useSociety } from '@/context/SocietyContext';
import { Edit2, Plus, CheckCircle, Clock } from 'lucide-react';

const FixedDepositPage = () => {
  const { fixedDeposits, addDeposit, updateDeposit } = useSociety();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amount: 0,
    interest_rate: 0,
    tenure_months: 3,
    start_date: '',
    month: 'June',
    year: '2024',
    status: 'Active' as 'Active' | 'Finished'
  });

  // LOGIC: Only add interest if status is 'Finished'
  const calculateMaturity = (fd: any) => {
    if (fd.status !== 'Finished') return fd.amount; 
    
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
      if (editingId) {
        await updateDeposit(editingId, formData);
      } else {
        await addDeposit(formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving deposit. Check console for details.");
    }
  };

  const openEditModal = (fd: any) => {
    setEditingId(fd.id);
    setFormData({
      amount: fd.amount,
      interest_rate: fd.interest_rate,
      tenure_months: fd.tenure_months || 3,
      start_date: fd.start_date || '',
      month: fd.month,
      year: fd.year,
      status: fd.status || 'Active'
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Society Treasury Ledger</h1>
        <button 
          onClick={() => { 
            setEditingId(null); 
            setFormData({ amount: 0, interest_rate: 0, tenure_months: 3, start_date: '', month: 'June', year: '2024', status: 'Active' });
            setIsModalOpen(true); 
          }}
          className="flex items-center gap-2 bg-[#007b5e] text-white px-4 py-2 rounded-lg hover:bg-[#005f48]"
        >
          <Plus size={18} /> Add New FD
        </button>
      </div>

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
            {fixedDeposits.map((fd) => (
              <tr key={fd.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-4">
                  <div className="font-semibold">{fd.month} {fd.year}</div>
                  <div className="text-[10px] text-gray-400">{fd.start_date}</div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 uppercase ${
                    fd.status === 'Finished' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {fd.status === 'Finished' ? <CheckCircle size={10} /> : <Clock size={10} />}
                    {fd.status || 'Active'}
                  </span>
                </td>
                <td className="p-4 font-medium">৳{fd.amount.toLocaleString()}</td>
                <td className="p-4">{fd.interest_rate}%</td>
                <td className="p-4 text-right">
                  <div className="bg-[#003d2e] text-white px-3 py-1 rounded-md inline-block font-bold">
                    ৳{calculateMaturity(fd).toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => openEditModal(fd)} className="text-blue-500 hover:text-blue-700">
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6">{editingId ? 'Edit Record' : 'New Fixed Deposit'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select className="border rounded-xl p-3 bg-slate-50" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})}>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="text" className="border rounded-xl p-3 bg-slate-50" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
              </div>
              
              <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Start Date</label>
              <input type="date" required className="w-full border rounded-xl p-3" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
              
              <input type="number" placeholder="Amount (৳)" className="w-full border rounded-xl p-3" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.001" placeholder="Rate (%)" className="border rounded-xl p-3" value={formData.interest_rate || ''} onChange={e => setFormData({...formData, interest_rate: Number(e.target.value)})} />
                <input type="number" placeholder="Tenure (Months)" className="border rounded-xl p-3" value={formData.tenure_months || ''} onChange={e => setFormData({...formData, tenure_months: Number(e.target.value)})} />
              </div>

              <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Current Status</label>
              <select className="w-full border rounded-xl p-3 font-bold bg-slate-50" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                <option value="Active">ACTIVE (Principal Only)</option>
                <option value="Finished">FINISHED (Add Interest)</option>
              </select>

              <button type="submit" className="w-full bg-[#007b5e] text-white font-bold py-4 rounded-xl mt-4">Save Record</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-400 font-medium py-2 text-sm">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedDepositPage;