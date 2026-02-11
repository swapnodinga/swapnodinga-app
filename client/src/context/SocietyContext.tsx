"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useLocation } from "wouter"
import { supabase } from "@/lib/supabase"
import emailjs from "@emailjs/browser"

interface SocietyContextType {
  currentUser: any
  members: any[]
  transactions: any[]
  fixedDeposits: any[]
  societyTotalFund: number
  isLoading: boolean
  login: (email: string, pass: string) => Promise<boolean>
  register: (userData: any) => Promise<boolean>
  logout: () => void
  updateProfile: (data: any) => Promise<void>
  uploadProfilePic: (file: File) => Promise<string>
  refreshData: () => Promise<void>
  approveMember: (id: string) => Promise<void>
  deleteMember: (id: string) => Promise<void>
  submitInstalment: (amount: number, file: File, month: string) => Promise<void>
  approveInstalment: (transaction: any, status: "Approved" | "Rejected") => Promise<void>
  addFixedDeposit: (data: any) => Promise<void>
  updateFixedDeposit: (id: string, data: any) => Promise<void>
  deleteFixedDeposit: (id: string) => Promise<void>
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined)

export function SocietyProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [fixedDeposits, setFixedDeposits] = useState<any[]>([])
  const [societyTotalFund, setSocietyTotalFund] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [, setLocation] = useLocation()

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser))
      } catch (e) {
        console.error("Failed to parse user session")
      }
    }
    setIsLoading(false)
  }, [])

  const refreshData = async () => {
    try {
      // 1. Fetch Global Stats via RPC - This is the ONLY way to show 3,103,630 to a Member
      const { data: stats, error: statsError } = await supabase.rpc('get_society_stats')
      
      if (!statsError && stats && stats.length > 0) {
        const total = Number(stats[0].total_installments || 0) + Number(stats[0].total_interest || 0)
        console.log("RPC Data Found:", total)
        setSocietyTotalFund(total)
      } else {
        console.error("RPC failed, check if get_society_stats exists in Supabase:", statsError)
      }

      // 2. Standard Data Fetching
      const { data: membersData } = await supabase.from("members").select("*")
      const { data: transData } = await supabase
        .from("Installments")
        .select("*")
        .order("created_at", { ascending: false })
      const { data: fdData } = await supabase
        .from("fixed_deposits")
        .select("*")
        .order("start_date", { ascending: false })

      const nameMap: { [key: string]: string } = {}
      if (membersData) {
        membersData.forEach((m) => {
          nameMap[String(m.id)] = m.full_name || m.memberName || "No Name"
        })
      }

      const enrichedTransData = (transData || []).map((trans) => ({
        ...trans,
        memberName: nameMap[String(trans.member_id)] || trans.memberName || `Member #${trans.member_id}`,
      }))

      setMembers(membersData || [])
      setTransactions(enrichedTransData)
      setFixedDeposits(fdData || [])
    } catch (err) {
      console.error("[SocietyContext] Refresh failed:", err)
    }
  }

  useEffect(() => {
    if (currentUser) refreshData()
  }, [currentUser])

  // login, logout, register, etc. logic remains UNCHANGED as per instructions
  const login = async (email: string, pass: string) => {
    try {
      await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
      const { data } = await supabase.from("members").select("*").eq("email", email.trim()).eq("password", pass).single()
      if (data && data.status === 'active') {
        setCurrentUser(data)
        localStorage.setItem("user", JSON.stringify(data))
        await refreshData()
        return true
      }
      return false
    } catch (err) { return false }
  }

  const logout = () => {
    supabase.auth.signOut()
    setCurrentUser(null)
    localStorage.removeItem("user")
    setLocation("/")
  }

  const register = async (userData: any) => {
    try {
      const { data: currentMembers } = await supabase.from("members").select("id")
      const lastId = currentMembers && currentMembers.length > 0 ? Math.max(...currentMembers.map(m => m.id)) : 0
      const nextId = lastId + 1
      const nextSocietyId = `SCS-${String(nextId).padStart(3, '0')}`
      const payload = { ...userData, id: nextId, society_id: nextSocietyId, status: "pending", fixed_deposit_amount: 0, fixed_deposit_interest: 0, is_admin: false }
      const { error } = await supabase.from("members").insert([payload])
      if (error) throw error
      await refreshData()
      return true
    } catch (err) { return false }
  }

  const approveMember = async (id: string) => {
    await supabase.from("members").update({ status: "active" }).eq("id", id)
    await refreshData()
  }

  const deleteMember = async (id: string) => {
    await supabase.from("members").delete().eq("id", id)
    await refreshData()
  }

  const updateProfile = async (data: any) => {
    const { error } = await supabase.from("members").update(data).eq("id", currentUser.id)
    if (!error) {
      const u = { ...currentUser, ...data }
      setCurrentUser(u)
      localStorage.setItem("user", JSON.stringify(u))
    }
  }

  const uploadProfilePic = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`
    await supabase.storage.from("avatars").upload(fileName, file)
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName)
    await updateProfile({ profile_pic: urlData.publicUrl })
    return urlData.publicUrl
  }

  const submitInstalment = async (amount: number, file: File, month: string) => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `proof-${currentUser.id}-${Date.now()}.${fileExt}`
      await supabase.storage.from("payments").upload(fileName, file)
      const { data: urlData } = supabase.storage.from("payments").getPublicUrl(fileName)
      await supabase.from("Installments").insert([{
        member_id: currentUser.id,
        memberName: currentUser.full_name || currentUser.memberName,
        society_id: currentUser.society_id,
        amount: Number(amount),
        payment_proof_url: urlData.publicUrl,
        proofPath: fileName,
        month: month,
        status: "Pending",
        created_at: new Date().toISOString(),
      }])
      await refreshData()
    } catch (err) { throw err }
  }

  const approveInstalment = async (transaction: any, status: "Approved" | "Rejected") => {
    try {
      await supabase.from("Installments").update({ status, approved_at: new Date().toISOString() }).eq("id", transaction.id)
      const memberObj = members.find((m) => String(m.id) === String(transaction.member_id))
      if (memberObj?.email) {
        await emailjs.send("service_b8gcj9p", "template_vi2p4ul", {
          member_name: memberObj.full_name,
          member_email: memberObj.email,
          amount: transaction.amount,
          month: transaction.month,
          status,
          proof_url: transaction.payment_proof_url,
        }, "nKSxYmGpgjuB2J4tF")
        if (transaction.proofPath) await supabase.storage.from("payments").remove([transaction.proofPath])
      }
      await refreshData()
    } catch (err) { console.error(err) }
  }

  const addFixedDeposit = async (data: any) => {
    await supabase.from("fixed_deposits").insert([data])
    await refreshData()
  }

  const updateFixedDeposit = async (id: string, data: any) => {
    await supabase.from("fixed_deposits").update(data).eq("id", id)
    await refreshData()
  }

  const deleteFixedDeposit = async (id: string) => {
    if (!window.confirm("Delete this?")) return
    await supabase.from("fixed_deposits").delete().eq("id", id)
    await refreshData()
  }

  return (
    <SocietyContext.Provider value={{
      currentUser, members, transactions, fixedDeposits, societyTotalFund, isLoading,
      login, register, logout, updateProfile, uploadProfilePic, refreshData,
      approveMember, deleteMember, submitInstalment, approveInstalment,
      addFixedDeposit, updateFixedDeposit, deleteFixedDeposit,
    }}>
      {children}
    </SocietyContext.Provider>
  )
}

export function useSociety() {
  const context = useContext(SocietyContext)
  if (!context) throw new Error("useSociety must be used within a SocietyProvider")
  return context
}