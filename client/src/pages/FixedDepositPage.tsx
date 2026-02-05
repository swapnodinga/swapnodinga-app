"use client"

import { useState } from "react"
import { useSociety } from "@/context/SocietyContext"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Banknote, Upload, FileText, Loader2, Plus } from "lucide-react"

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
      startDateStr: formatTableDate(startDate), 
      finishDateStr: formatTableDate(finishDate),
      total: Math.round(amount + interest),
      isFinished: finishDate <= new Date()
    }
  }

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `fd-${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('fd-slips').upload(fileName, file)
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('fd-slips').getPublicUrl(fileName)
    return publicUrl
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
        society_id: currentUser?.society_id || "SOC_01",
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
    // Added px-12 for better side spacing
    <div className="p-6 px-12 space-y-6 max-w-[1600px] mx-auto min-h-screen font-sans">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-[#0f172a]">
          <Banknote className="text-[#059669]" size={28} /> Society Treasury Ledger
        </h1>
      </div>

      {/* Increased gap to gap-12 to fix the "not matched" spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        
        {/* ENTRY FORM */}
        <Card className="lg:col-span-1 h-fit shadow-sm border-[#e2e8f0] rounded-xl bg-white">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-[16px] font-bold text-[#065f46] flex items-center gap-2">
              <Plus size={18} className="bg-[#ecfdf5] rounded p-0.5" /> New Bank Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5 px-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Start Date</Label>
                <Input type="date" required className="h-11 border-slate-200" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Principal Amount (৳)</Label>
                <Input type="number" required className="h-11 border-slate-200" placeholder="0" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Rate (%)</Label>
                  <Input type="number" step="0.001" className="h-11 border-slate-200" value={formData.interest_rate} onChange={(e) => setFormData({...formData, interest_rate: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Tenure (M)</Label>
                  <Input type="number" required className="h-11 border-slate-200" value={formData.tenure_months} onChange={(e) => setFormData({...formData, tenure_months: e.target.value})} />
                </div>
              </div>

              {/* Added Slip Upload to New Entry */}
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Attach FD Slip</Label>
                <Input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="h-11 border-slate-200 text-[12px] pt-2 cursor-pointer" 
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full font-bold h-11 bg-[#059669] hover:bg-[#047857] text-white transition-colors">
                {isSubmitting ? "Processing..." : "Save Deposit"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* HISTORY TABLE */}
        <Card className="lg:col-span-3 shadow-sm border-[#e2e8f0] rounded-xl overflow-hidden bg-white">
          <CardHeader className="border-b px-6 py-4 bg-[#fcfdfe]">
            <CardTitle className="text-[16px] font-bold text-slate-700 flex items-center gap-2">
               Deposit History
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fafc] text-[11px] uppercase font-bold text-slate-500 border-b">
                <tr>
                  <th className="p-5 text-left">Period / Status</th>
                  <th className="p-5 text-center">Principal (BDT)</th>
                  <th className="p-5 text-center">Rate (%)</th>
                  <th className="p-5 text-center">Tenure</th>
                  <th className="p-5 text-center">Finish Date (Auto)</th>
                  <th className="p-5 text-center">Maturity Est.</th>
                  <th className="p-5 text-center">FD Slip</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixedDeposits.map((fd: any) => {
                  const m = getMaturityData(fd.amount, fd.interest_rate, fd.start_date, fd.tenure_months)
                  return (
                    <tr key={fd.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-slate-800 text-[14px]">{m.startDateStr}</div>
                        <Badge variant="outline" className={`text-[10px] mt-1.5 font-bold ${m.isFinished ? "text-[#059669] bg-[#ecfdf5]" : "text-[#2563eb] bg-[#eff6ff]"} border-none`}>
                          {m.isFinished ? "FINISHED" : "ACTIVE"}
                        </Badge>
                      </td>
                      <td className="p-5 text-center font-bold text-slate-700 text-[15px]">৳{fd.amount.toLocaleString()}</td>
                      <td className="p-5 text-center font-bold text-[#2563eb] text-[15px]">{fd.interest_rate}%</td>
                      <td className="p-5 text-center text-slate-500 font-medium text-[14px]">{fd.tenure_months} Months</td>
                      <td className="p-5 text-center text-slate-700 font-bold text-[14px]">{m.finishDateStr}</td>
                      <td className="p-5 text-center">
                        <div className="bg-[#022c22] text-[#34d399] px-4 py-2 rounded-lg inline-block font-bold text-[14px]">
                          ৳{m.total.toLocaleString()}
                        </div>
                      </td>
                      
                      {/* FD Slip Column with consistent styling */}
                      <td className="p-5 text-center">
                        {fd.slip_url ? (
                          <a href={fd.slip_url} target="_blank" rel="noreferrer" className="text-[#059669] font-bold text-[12px] hover:underline flex flex-col items-center gap-1">
                            <FileText size={20} /> View Slip
                          </a>
                        ) : (
                          <div className="flex justify-center">
                            <label className="cursor-pointer text-slate-400 hover:text-[#059669] transition-colors p-2 rounded-full hover:bg-slate-100">
                              {uploadingId === fd.id ? <Loader2 className="animate-spin" size={20} /> : <><Upload size={20} /><input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleRowUpload(e, fd.id)} /></>}
                            </label>
                          </div>
                        )}
                      </td>

                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-4 font-bold text-[13px]">
                          <button onClick={() => { setEditingId(fd.id); setFormData({ amount: fd.amount.toString(), start_date: fd.start_date, interest_rate: fd.interest_rate.toString(), tenure_months: fd.tenure_months.toString() }) }} className="text-[#2563eb] hover:underline">Edit</button>
                          <button onClick={() => deleteFixedDeposit(fd.id)} className="text-[#ef4444] hover:underline">Delete</button>
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