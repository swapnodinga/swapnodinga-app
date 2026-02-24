"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import emailjs from "@emailjs/browser"

interface SocietyContextType {
  currentUser: any
  members: any[]
  transactions: any[]
  fixedDeposits: any[]
  societyTotalFund: number
  isLoading: boolean
  login: (email: string, pass: string) => Promise<any>
  register: (userData: any) => Promise<boolean>
  logout: () => void
  updateProfile: (data: any) => Promise<void>
  uploadProfilePic: (file: File) => Promise<string>
  refreshData: () => Promise<void>
  approveMember: (id: string) => Promise<void>
  deleteMember: (id: string) => Promise<void>
  submitInstalment: (amount: number, file: File, month: string) => Promise<void>
  approveInstalment: (transaction: any, status: "Approved" | "Rejected") => Promise<any>
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
  const [isLoading, setIsLoading] = useState(true)

  // 1. Initialize User Session
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

  // 2. Automated Fund Calculation
  const societyTotalFund = useMemo(() => {
    const totalInstallments = (transactions || [])
      .filter((t) => t.status === "Approved")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

    const totalRealizedInterest = (fixedDeposits || [])
      .reduce((acc, curr) => acc + (Number(curr.realized_interest) || 0), 0)

    return totalInstallments + totalRealizedInterest
  }, [transactions, fixedDeposits])

  // 3. Centralized Refresh Logic
  const refreshData = async () => {
    try {
      const { data: membersData } = await supabase.from("members").select("*")
      const { data: transData } = await supabase.from("Installments").select("*").order("created_at", { ascending: false })
      const { data: fdData } = await supabase.from("fixed_deposits").select("*").order("start_date", { ascending: false })

      const nameMap: { [key: string]: string } = {}
      if (membersData) {
        membersData.forEach((m: any) => {
          const name = m.full_name || m.memberName || m.member_name || "No Name"
          nameMap[String(m.id)] = name
        })
      }

      const enrichedTransData = (transData || []).map((trans: any) => ({
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

  // 4. AUTOMATIC REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!currentUser) return

    refreshData()

    const channel = supabase
      .channel("realtime-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Installments" },
        () => {
          refreshData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  // 5. Action Handlers
  const approveInstalment = async (transaction: any, status: "Approved" | "Rejected"): Promise<any> => {
    const previousTransactions = [...transactions];
    try {
      // Optimistic Update
      setTransactions((prev) =>
        prev.map((t) => (t.id === transaction.id ? { ...t, status: status } : t))
      )

      const { error: dbError } = await supabase
        .from("Installments")
        .update({ status: status, approved_at: new Date().toISOString() })
        .eq("id", transaction.id)

      if (dbError) throw dbError

      // Email Notification
      const memberObj = members.find((m) => String(m.id) === String(transaction.member_id))
      if (memberObj?.email) {
        emailjs.send("service_b8gcj9p", "template_vi2p4ul", {
          member_name: memberObj.full_name || transaction.memberName,
          member_email: memberObj.email,
          amount: transaction.amount,
          month: transaction.month,
          status: status,
          proof_url: transaction.payment_proof_url,
        }, "nKSxYmGpgjuB2J4tF").catch(() => {})
      }

      // Cleanup Storage
      if (transaction.proofPath) {
        await supabase.storage.from("payments").remove([transaction.proofPath])
      }

      return { success: true }
    } catch (err: any) {
      setTransactions(previousTransactions);
      console.error("Workflow failed:", err)
      return { success: false, error: err.message }
    }
  }

  const submitInstalment = async (amount: number, file: File, month: string) => {
    try {
      if (!currentUser) throw new Error("No user logged in")
      const fileExt = file.name.split(".").pop()
      const fileName = `proof-${currentUser.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from("payments").upload(fileName, file)
      if (uploadError) throw uploadError

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
    } catch (err: any) {
      console.error("Submission Error:", err.message)
    }
  }

  const approveMember = async (id: string) => {
    await supabase.from("members").update({ status: "active" }).eq("id", Number(id))
    await refreshData()
  }

  const deleteMember = async (id: string) => {
    if (!window.confirm("Delete member permanently?")) return
    await supabase.from("members").delete().eq("id", Number(id))
    await refreshData()
  }

  const addFixedDeposit = async (data: any) => {
    await supabase.from("fixed_deposits").insert([data])
    await refreshData()
  }

  const updateFixedDeposit = async (id: string, data: any) => {
    await supabase.from("fixed_deposits").update(data).eq("id", Number(id))
    await refreshData()
  }

  const deleteFixedDeposit = async (id: string) => {
    if (!window.confirm("Delete deposit permanently?")) return
    await supabase.from("fixed_deposits").delete().eq("id", Number(id))
    await refreshData()
  }

  const login = async (email: string, pass: string) => {
    try {
      const { data: memberData } = await supabase
        .from("members")
        .select("*")
        .eq("email", email.trim())
        .eq("password", pass)
        .single()

      if (memberData && memberData.status === "active") {
        setCurrentUser(memberData)
        localStorage.setItem("user", JSON.stringify(memberData))
        return { success: true, user: memberData }
      }
      return false
    } catch (err) { return false }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem("user")
    window.location.href = "/" // Use window.location instead of useNavigate to avoid Router errors
  }

  const register = async (userData: any) => {
    try {
      const { data } = await supabase.from("members").select("id")
      const lastId = data && data.length > 0 ? Math.max(...data.map((m: any) => m.id)) : 0
      const { error } = await supabase.from("members").insert([{
        ...userData,
        id: lastId + 1,
        society_id: `SCS-${String(lastId + 1).padStart(3, "0")}`,
        status: "pending",
        fixed_deposit_amount: 0,
        fixed_deposit_interest: 0,
        is_admin: false,
      }])
      return !error
    } catch (err) { return false }
  }

  const updateProfile = async (data: any) => {
    const { error } = await supabase.from("members").update(data).eq("id", currentUser.id)
    if (!error) {
      const updated = { ...currentUser, ...data }
      setCurrentUser(updated)
      localStorage.setItem("user", JSON.stringify(updated))
    }
  }

  const uploadProfilePic = async (file: File): Promise<string> => {
    const fileName = `${currentUser.id}-${Date.now()}.${file.name.split(".").pop()}`
    await supabase.storage.from("avatars").upload(fileName, file)
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName)
    await updateProfile({ profile_pic: urlData.publicUrl })
    return urlData.publicUrl
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