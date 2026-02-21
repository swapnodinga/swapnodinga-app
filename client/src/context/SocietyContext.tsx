"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react"
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
  login: (email: string, pass: string) => Promise<{ user: any } | false>
  register: (userData: any) => Promise<boolean>
  logout: () => void
  updateProfile: (data: any) => Promise<void>
  uploadProfilePic: (file: File) => Promise<string>
  refreshData: () => Promise<void>
  approveMember: (id: string) => Promise<void>
  deleteMember: (id: string) => Promise<void>
  submitInstalment: (amount: number, file: File, month: string) => Promise<void>
  approveInstalment: (transaction: any, status: "Approved" | "Rejected") => Promise<{ success: boolean; error?: string }>
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
  const [, setLocation] = useLocation()
  const installmentsTableRef = useRef<string>("installments")

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

  const societyTotalFund = useMemo(() => {
    if (!Array.isArray(transactions)) return 0
    return transactions
      .filter((t) => t.status === "Approved")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  }, [transactions])

  const refreshData = async () => {
    try {
      const { data: membersData, error: memError } = await supabase.from("members").select("*")
      if (memError) console.error("Error fetching members:", memError)

      let transData: any[] | null = null
      for (const tableName of ["installments", "Installments"] as const) {
        const { data, error: transError } = await supabase.from(tableName).select("*").order("created_at", { ascending: false })
        if (!transError) {
          transData = data
          installmentsTableRef.current = tableName
          break
        }
        if (transError?.message?.includes("relation") || transError?.code === "PGRST116") continue
        console.error("Error fetching installments:", transError)
        break
      }

      const { data: fdData, error: fdError } = await supabase
        .from("fixed_deposits")
        .select("*")
        .order("start_date", { ascending: false })
      
      if (fdError) console.error("Error fetching FDs:", fdError)

      const nameMap: { [key: string]: string } = {}
      if (membersData) {
        membersData.forEach((m) => {
          const name = m.full_name || m.memberName || m.member_name || "No Name"
          nameMap[String(m.id)] = name
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
      console.error("[SocietyContext] Data refresh failed:", err)
    }
  }

  useEffect(() => {
    if (currentUser) refreshData()
  }, [currentUser])

  const addFixedDeposit = async (data: any) => {
    const { error } = await supabase.from("fixed_deposits").insert([data])
    if (error) throw error
    await refreshData()
  }

  const updateFixedDeposit = async (id: string, data: any) => {
    const { error } = await supabase.from("fixed_deposits").update(data).eq("id", id)
    if (error) throw error
    await refreshData()
  }

  const deleteFixedDeposit = async (id: string) => {
    if (!window.confirm("Delete this deposit permanently?")) return
    const { error } = await supabase.from("fixed_deposits").delete().eq("id", id)
    if (error) throw error
    await refreshData()
  }

  const approveInstalment = async (transaction: any, status: "Approved" | "Rejected"): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!transaction?.id) return { success: false, error: "Invalid transaction" }

      const tableName = installmentsTableRef.current
      const { error: dbError } = await supabase
        .from(tableName)
        .update({ status: status, approved_at: new Date().toISOString() })
        .eq("id", transaction.id)

      if (dbError) {
        console.error("Approve DB error:", dbError)
        return { success: false, error: dbError.message }
      }

      const memberObj = members.find((m) => String(m.id) === String(transaction.member_id))
      const targetEmail = memberObj?.email

      if (targetEmail) {
        try {
          await emailjs.send(
            "service_b8gcj9p",
            "template_vi2p4ul",
            {
              member_name: memberObj.full_name || transaction.memberName,
              member_email: targetEmail,
              amount: transaction.amount,
              month: transaction.month,
              status: status,
              proof_url: transaction.payment_proof_url, 
            },
            "nKSxYmGpgjuB2J4tF",
          )
        } catch (emailErr) {
          console.warn("Email notification failed:", emailErr)
          // Don't fail the whole flow for email
        }
      }
      await refreshData()
      return { success: true }
    } catch (err: any) {
      console.error("Approve workflow failed:", err)
      return { success: false, error: err?.message || "Approval failed" }
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

      const { error: dbError } = await supabase.from(installmentsTableRef.current).insert([{
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

      if (dbError) throw dbError
      await refreshData()
    } catch (err: any) {
      console.error("Submission Error:", err.message)
    }
  }

  const login = async (email: string, pass: string): Promise<{ user: any } | false> => {
    try {
      const { data: memberData } = await supabase
        .from("members")
        .select("*")
        .ilike("email", email.trim())
        .single()

      if (memberData && memberData.password === pass) {
        if (memberData.status !== 'active') {
          const isAdminEmail = memberData.email?.toLowerCase() === 'swapnodinga.scs@gmail.com'
          if (!isAdminEmail) return false
        }
        const isAdmin = memberData.is_admin ?? memberData.email?.toLowerCase() === 'swapnodinga.scs@gmail.com'
        const user = { ...memberData, is_admin: isAdmin }
        setCurrentUser(user)
        localStorage.setItem("user", JSON.stringify(user))
        return { user }
      }
      return false
    } catch (err) {
      return false
    }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem("user")
    setLocation("/")
  }

  const register = async (userData: any) => {
    try {
      const { data: currentMembers } = await supabase.from("members").select("id")
      const lastId = currentMembers && currentMembers.length > 0 
        ? Math.max(...currentMembers.map(m => m.id)) 
        : 0;
      
      const nextId = lastId + 1;
      const nextSocietyId = `SCS-${String(nextId).padStart(3, '0')}`;

      const payload = {
        ...userData,
        id: nextId,
        society_id: nextSocietyId, 
        status: "pending",
        fixed_deposit_amount: 0,
        fixed_deposit_interest: 0,
        is_admin: false
      }

      const { error } = await supabase.from("members").insert([payload])
      if (error) throw error
      await refreshData()
      return true
    } catch (err) {
      console.error("Registration failed:", err)
      return false
    }
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