"use client"

import { useState } from "react"
import { useSociety } from "@/context/SocietyContext"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Banknote, Upload, FileText, Loader2, Plus, TrendingUp, Wallet, CheckCircle2, RotateCw } from "lucide-react"

export default function FixedDepositPage() {
  const { fixedDeposits, addFixedDeposit, updateFixedDeposit, deleteFixedDeposit, currentUser } = useSociety()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    amount: "",
    start_date: new Date().toISOString().split("T")[0],
    interest_rate: "8.265",
    tenure_months: "3"
  })

  const formatTableDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", { 
      day: "2-digit", 
      month: "short", 
      year: "2-digit" 
    }).replace(/ /g, "-")
  }

  const getMaturityData = (amount: number, rate: number, start: string, months: number) => {
    const startDate = new Date(start)
    const finishDate = new Date(start)
    finishDate.setMonth(startDate.getMonth() + Number(months))
    const diffDays = Math.ceil(Math.abs(finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const interest = (amount * rate * diffDays) / (365 * 100)
    
    return {
      startDate,
      finishDate,
      startDateStr: formatTableDate(startDate), 
      finishDateStr: formatTableDate(finishDate),
      interest: Math.round(interest),
      total: Math.round(amount + interest),
      isFinished: finishDate <= new Date()
    }
  }

  // Updated 4-Card Summary Calculations
  const stats = fixedDeposits.reduce((acc: any, fd: any) => {
    const m = getMaturityData(fd.amount, fd.interest_rate, fd.start_date, fd.tenure_months)
    acc.totalPrincipal += Number(fd.amount)
    
    if (m.isFinished) {
      acc.totalFinished += Number(fd.amount)
      acc.totalRealizedInterest += m.interest
    } else {
      acc.totalActive += Number(fd.amount)
    }
    return acc
  }, { totalPrincipal: 0, totalFinished: 0, totalRealizedInterest: 0, totalActive: 0 })

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `fd-${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('fixed_deposits').upload(fileName, file)
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('fixed_deposits').getPublicUrl(fileName)
    return publicUrl
  }

  const handleReinvest = async (fd: any) => {
    const m = getMaturityData(fd.amount, fd.interest_rate, fd.start_date, fd.tenure_months)
    const newStartDate = m.finishDate.toISOString().split("T")[0]
    
    const payload = {
      amount: Number(fd.amount),
      start_date: newStartDate,
      interest_rate: Number(fd.interest_rate),
      tenure_months: 3,
      month: m.finishDate.toLocaleString('default', { month: 'long' }),
      year: m.finishDate.getFullYear().toString(),
      status: "Active",
      society_id: currentUser?.society_id,
      member_id: currentUser?.id,
      slip_url: fd.slip_url
    }

    if(confirm(`Reinvest Principal ৳${fd.amount.toLocaleString()} for another 3 months?`)) {
        await addFixedDeposit(payload)
    }
  }

  const handleRowUpload = async (event: React.ChangeEvent<HTMLInputElement>, fdId: string) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingId(fdId)
    try {
      const url = await uploadFile(file)
      await updateFixedDeposit(fdId, { slip_url: url })
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploadingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      let slipUrl = ""
      if (selectedFile) slipUrl = await uploadFile(selectedFile)

      const dateObj = new Date(formData.start_date)
      const payload = {
        amount: Number(formData.amount),
        start_date: formData.start_date,
        interest_rate: Number(formData.interest_rate),
        tenure_months: Number(formData.tenure_months),
        month: dateObj.toLocaleString('default', { month: 'long' }),
        year: dateObj.getFullYear().toString(),
        status: "Active",
        society_id: currentUser?.society_id,
        member_id: currentUser?.id,
        slip_url: slipUrl || undefined
      }

      editingId ? await updateFixedDeposit(editingId, payload) : await addFixedDeposit(payload)
      setEditingId(null)
      setSelectedFile(null)
      setFormData({ ...formData, amount: "" })
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 px-2 space-y-6 max-w-full mx-auto min-h-screen font-sans">
      <div className="flex justify-between items-center mb-2 px-2">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-[#0f172a]">
          <Banknote className="text-[#059669]" size={28} /> Society Treasury Ledger
        </h1>
      </div>

      {/* 4 REVISED SUMMARY CARTS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Wallet size={20} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Principal</p>
              <h3 className="text-lg font-bold text-slate-800">৳{stats.totalPrincipal.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><CheckCircle2 size={20} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Finished FD</p>
              <h3 className="text-lg font-bold text-slate-800">৳{stats.totalFinished.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp size={20} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Realized Interest</p>
              <h3 className="text-lg font-bold text-emerald-700">৳{stats.totalRealizedInterest.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white border-l-4 border-orange-400">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><RotateCw size={20} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Active Running</p>
              <h3 className="text-lg font-bold text-slate-800">৳{stats.totalActive.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ENTRY FORM */}
        <Card className="lg:col-span-1 h-fit shadow-sm border-[#e2e8f0] rounded-xl bg-white">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-[15px] font-bold text-[#065f46] flex items-center gap-2">
              <Plus size={16} className="bg-[#ecfdf5] rounded p-0.5" /> New Bank Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 px-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Start Date</Label>
                <Input type="date" required className="h-10 border-slate-200 text-sm" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Principal Amount (৳)</Label>
                <Input type="number" required className="h-10 border-slate-200 text-sm" placeholder="0" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Rate (%)</Label>
                  <Input type="number" step="0.001" className="h-10 border-slate-200 text-sm" value={formData.interest_rate} onChange={(e) => setFormData({...formData, interest_rate: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Tenure (M)</Label>
                  <Input type="number" required className="h-10 border-slate-200 text-sm" value={formData.tenure_months} onChange={(e) => setFormData({...formData, tenure_months: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Attach FD Slip</Label>
                <Input type="file" accept="image/*,.pdf" className="h-10 border-slate-200 text-[11px] pt-1.5 cursor-pointer" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full font-bold h-10 bg-[#059669] hover:bg-[#047857] text-white">
                {isSubmitting ? "Processing..." : editingId ? "Update Entry" : "Save Deposit"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* HISTORY TABLE */}
        <Card className="lg:col-span-3 shadow-sm border-[#e2e8f0] rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-3 text-left">Period / Status</th>
                  <th className="p-3 text-center">Principal</th>
                  <th className="p-3 text-center">Finish Date</th>
                  <th className="p-3 text-center">Maturity (Interest)</th>
                  <th className="p-3 text-center">Slip</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixedDeposits.map((fd: any) => {
                  const m = getMaturityData(fd.amount, fd.interest_rate, fd.start_date, fd.tenure_months)
                  return (
                    <tr key={fd.id} className={`transition-colors ${m.isFinished ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 text-[13px]">{m.startDateStr}</div>
                        <Badge variant="outline" className={`text-[9px] font-bold ${m.isFinished ? "text-white bg-[#059669]" : "text-[#2563eb] bg-[#eff6ff]"} border-none`}>
                          {m.isFinished ? "MATURED" : "ACTIVE"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700 text-[14px]">৳{fd.amount.toLocaleString()}</td>
                      <td className="p-3 text-center text-slate-700 font-bold text-[13px]">
                        {m.finishDateStr}
                        <div className="text-[10px] text-slate-400 font-medium">{fd.tenure_months} Months @ {fd.interest_rate}%</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="text-slate-800 font-bold text-[13px]">৳{m.total.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">+৳{m.interest.toLocaleString()} Int.</div>
                      </td>
                      
                      <td className="p-3 text-center">
                        {fd.slip_url ? (
                          <a href={fd.slip_url} target="_blank" rel="noreferrer" className="text-[#059669] hover:underline flex flex-col items-center">
                            <FileText size={18} />
                          </a>
                        ) : (
                          <label className="cursor-pointer text-slate-300 hover:text-[#059669]">
                            {uploadingId === fd.id ? <Loader2 className="animate-spin" size={16} /> : <><Upload size={16} /><input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleRowUpload(e, fd.id)} /></>}
                          </label>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          {m.isFinished && (
                            <button onClick={() => handleReinvest(fd)} className="flex items-center gap-1 text-[11px] bg-emerald-600 text-white px-2 py-1 rounded font-bold hover:bg-emerald-700">
                              <RotateCw size={12} /> Reinvest
                            </button>
                          )}
                          <div className="flex gap-3 font-bold text-[11px]">
                            <button onClick={() => { setEditingId(fd.id); setFormData({ amount: fd.amount.toString(), start_date: fd.start_date, interest_rate: fd.interest_rate.toString(), tenure_months: fd.tenure_months.toString() }) }} className="text-[#2563eb]">Edit</button>
                            <button onClick={() => confirm("Delete record?") && deleteFixedDeposit(fd.id)} className="text-[#ef4444]">Delete</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}