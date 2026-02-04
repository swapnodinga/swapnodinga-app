"use client"

import React, { useState } from 'react'
import { useSociety } from '@/context/SocietyContext'
import { 
  Plus, 
  X, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Edit3, 
  Trash2, 
  Banknote 
} from 'lucide-react'

const FixedDepositPage = () => {
  const { fixedDeposits, addDeposit, updateDeposit, deleteDeposit } = useSociety()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    amount: 0,
    interest_rate: 0,
    tenure_months: 3,
    start_date: '',
    month: '',
    year: '',
    status: 'Active' as 'Active' | 'Finished'
  })

  const handleDateChange = (dateStr: string) => {
    if (!dateStr) return
    const date = new Date(dateStr)
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    
    setFormData(prev => ({
      ...prev,
      start_date: dateStr,
      month: months[date.getMonth()],
      year: date.getFullYear().toString()
    }))
  }

  const calculateMaturity = (fd: any) => {
    // If it's not finished, we usually just display the principal or a running estimate
    if (fd.status !== 'Finished') return fd.amount

    // Calculation: Principal + (Principal * Rate * (Tenure/12)) / 100
    // Or for more precision using days:
    const start = new Date(fd.start_date)
    const end = new Date(fd.start_date)
    end.setMonth(start.getMonth() + Number(fd.tenure_months))
    
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const interest = (fd.amount * fd.interest_rate * diffDays) / (100 * 365)
    
    return Math.round(fd.amount + interest)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { 
        ...formData, 
        amount: Number(formData.amount), 
        interest_rate: Number(formData.interest_rate),
        tenure_months: Number(formData.tenure_months)
      }
      
      if (editingId) {
        await updateDeposit(editingId, payload)
      } else {
        await addDeposit(payload)
      }
      closeModal()
    } catch (error) {
      console.error("Operation failed:", error)
    }
  }

  const openEdit = (fd: any) => {
    setEditingId(fd.id)
    setFormData({ ...fd })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this FD record?")) {
      await deleteDeposit(id)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({ amount: 0, interest_rate: 0, tenure_months: 3, start_date: '', month: '', year: '', status: 'Active' })
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-white min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Banknote className="text-[#00a651]" /> Society Treasury Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">Fixed Deposit tracking and maturity management</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00a651] hover:bg-[#008541] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Plus size={20} /> Add New FD
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              <th className="px-6 py-4">Period / Status</th>
              <th className="px-6 py-4">Principal (BDT)</th>
              <th className="px-6 py-4">Rate (%)</th>
              <th className="px-6 py-4">Tenure</th>
              <th className="px-6 py-4">Maturity Est.</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fixedDeposits.map((fd) => (
              <tr key={fd.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-5">
                  <div className="font-bold text-slate-800 text-[15px]">{fd.month} {fd.year}</div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mt-2 uppercase border ${
                    fd.status === 'Finished' 
                    ? 'bg-green-50 text-green-600 border-green-100' 
                    : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {fd.status === 'Finished' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                    {fd.status}
                  </span>
                </td>
                <td className="px-6 py-5 font-bold text-slate-700 text-lg">৳{fd.amount.toLocaleString()}</td>
                <td className="px-6 py-5 font-bold text-blue-600">{fd.interest_rate}%</td>
                <td className="px-6 py-5 font-medium text-slate-500">{fd.tenure_months} Months</td>
                <td className="px-6 py-5">
                  <div className="bg-[#002e25] text-[#48f0c3] px-4 py-1.5 rounded-lg inline-block font-mono font-bold text-[15px] shadow-inner">
                    ৳{calculateMaturity(fd).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEdit(fd)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Entry"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(fd.id!)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">{editingId ? 'Edit Record' : 'New Bank Deposit'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Start Date</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00a651] outline-none" 
                    value={formData.start_date} 
                    onChange={e => handleDateChange(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Current Status</label>
                  <select 
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 bg-slate-50" 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="Active">Active</option>
                    <option value="Finished">Finished</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Principal Amount (৳)</label>
                <input 
                  type="number" 
                  required 
                  className="w-full border border-slate-200 rounded-xl p-3 text-lg font-bold text-slate-700" 
                  placeholder="0"
                  value={formData.amount || ''} 
                  onChange={e => setFormData({...formData, amount: Number(e.target.value)})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Interest Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    className="w-full border border-slate-200 rounded-xl p-3 font-semibold" 
                    value={formData.interest_rate || ''} 
                    onChange={e => setFormData({...formData, interest_rate: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Tenure (Months)</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-200 rounded-xl p-3 font-semibold" 
                    value={formData.tenure_months || ''} 
                    onChange={e => setFormData({...formData, tenure_months: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-500 font-bold text-sm border rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-[#00a651] text-white font-bold text-sm rounded-xl hover:bg-[#008541] shadow-md transition-all">
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FixedDepositPage