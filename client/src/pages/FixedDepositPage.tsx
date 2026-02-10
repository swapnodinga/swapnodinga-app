"use client"

import { useState, useMemo } from "react"
import { useSociety } from "@/context/SocietyContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Banknote, Upload, FileText, Loader2, Plus, 
  TrendingUp, Calendar, Info, ChevronRight, History 
} from "lucide-react"

export default function FixedDepositPage() {
  const { fixedDeposits, addFixedDeposit, updateFixedDeposit, deleteFixedDeposit, currentUser } = useSociety()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    reference_no: "", // Added MTDR Reference
    amount: "",
    start_date: new Date().toISOString().split("T")[0],
    interest_rate: "8.265",
    tenure_months: "3"
  })

  // --- 1. CALCULATED SUMMARY STATS ---
  const stats = useMemo(() => {
    const totalPrincipal = fixedDeposits.reduce((acc, fd) => acc + Number(fd.amount), 0)
    const activeCount = fixedDeposits.filter(fd => {
      const finish = new Date(fd.start_date)
      finish.setMonth(finish.getMonth() + Number(fd.tenure_months))
      return finish > new Date()
    }).length
    return { totalPrincipal, activeCount }
  }, [fixedDeposits])

  // --- 2. DATE FORMATTING LOGIC ---
  const formatTableDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", { 
      day: "2-digit", month: "short", year: "2-digit" 
    }).replace(/ /g, "-")
  }

  const getMaturityData = (amount: number, rate: number, start: string, months: number) => {
    const startDate = new Date(start)
    const finishDate = new Date(start)
    finishDate.setMonth(startDate.getMonth() + Number(months))
    const diffDays = Math.ceil(Math.abs(finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const interest = (amount * rate * diffDays) / (365 * 100)
    return {
      finishDate,
      finishDateStr: formatTableDate(finishDate.toISOString()),
      total: Math.round(amount + interest),
      isFinished: finishDate <= new Date()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        interest_rate: Number(formData.interest_rate),
        tenure_months: Number(formData.tenure_months),
        society_id: currentUser?.society_id,
        member_id: currentUser?.id,
        status: "Active"
      }
      await addFixedDeposit(payload)
      setShowForm(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto bg-[#f8fafc] min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Banknote className="text-emerald-600" size={36} /> Treasury Ledger
          </h1>
          <p className="text-slate-500 font-medium ml-12">"MTDR Investment & Fixed Deposit Management"</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200">
          {showForm ? "Close Form" : <><Plus size={18} className="mr-2"/> New Deposit Entry</>}
        </Button>
      </div>

      {/* SUMMARY STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl"><TrendingUp className="text-emerald-600" /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Total Principal</p>
              <h3 className="text-2xl font-black text-slate-800">৳{stats.totalPrincipal.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl"><Calendar className="text-blue-600" /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Active MTDRs</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.activeCount} Records</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl"><Info className="text-amber-600" /></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase">Society ID</p>
              <h3 className="text-2xl font-black text-slate-800">{currentUser?.society_id || "SCS-000"}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* FORM DRAWER (Optional/Collapsible) */}
        {showForm && (
          <Card className="lg:col-span-1 border-none shadow-xl animate-in slide-in-from-left duration-300">
             <CardHeader className="bg-emerald-600 rounded-t-xl py-4">
                <CardTitle className="text-white text-lg">Deposit Details</CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">MTDR Reference #</Label>
                    <Input placeholder="e.g. 3957631" required value={formData.reference_no} onChange={(e)=>setFormData({...formData, reference_no: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Principal Amount</Label>
                    <Input type="number" placeholder="৳ 0.00" required value={formData.amount} onChange={(e)=>setFormData({...formData, amount: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Rate (%)</Label>
                      <Input type="number" step="0.001" value={formData.interest_rate} onChange={(e)=>setFormData({...formData, interest_rate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Months</Label>
                      <Input type="number" value={formData.tenure_months} onChange={(e)=>setFormData({...formData, tenure_months: e.target.value})} />
                    </div>
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold h-12">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm & Save"}
                  </Button>
                </form>
             </CardContent>
          </Card>
        )}

        {/* LEDGER LIST */}
        <div className={`${showForm ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-4`}>
          {fixedDeposits.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
               <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <History className="text-slate-300" size={32} />
               </div>
               <p className="text-slate-400 font-medium">No fixed deposits recorded yet.</p>
            </div>
          ) : (
            fixedDeposits.map((fd: any) => {
              const m = getMaturityData(fd.amount, fd.interest_rate, fd.start_date, fd.tenure_months)
              return (
                <Card key={fd.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
                  <div className="flex flex-col md:flex-row items-stretch">
                    <div className={`w-2 ${m.isFinished ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                    <div className="flex-1 p-5 grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Reference</p>
                        <h4 className="text-md font-bold text-slate-700">MTDR-{fd.reference_no || 'Manual'}</h4>
                        <Badge variant="outline" className={`mt-1 text-[9px] ${m.isFinished ? 'bg-slate-50' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                          {m.isFinished ? 'MATURED' : 'ACTIVE'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Principal</p>
                        <h4 className="text-md font-black text-slate-800">৳{fd.amount.toLocaleString()}</h4>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Maturity Date</p>
                        <h4 className="text-sm font-bold text-slate-600">{m.finishDateStr}</h4>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Maturity Est.</p>
                        <h4 className="text-md font-black text-emerald-600">৳{m.total.toLocaleString()}</h4>
                      </div>
                      <div className="flex justify-end gap-2">
                         {fd.slip_url && (
                           <a href={fd.slip_url} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                             <FileText size={20} className="text-slate-400" />
                           </a>
                         )}
                         <Button variant="ghost" size="sm" className="text-slate-400 group-hover:text-blue-600">
                           <ChevronRight size={20} />
                         </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}