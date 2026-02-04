"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo } from "react"
import { useLocation } from "wouter"
import { supabase } from "@/lib/supabase"
import emailjs from "@emailjs/browser"

interface FixedDeposit {
  id?: string;
  amount: number;
  interest_rate: number;
  tenure_months: number;
  start_date: string;
  month: string;
  year: string;
}

interface SocietyContextType {
  currentUser: any
  members: any[]
  transactions: any[]
  fixedDeposits: FixedDeposit[]
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
  addDeposit: (deposit: FixedDeposit) => Promise<void>
  updateDeposit: (id: string, updates: Partial<FixedDeposit>) => Promise<void>
}

const SocietyContext = createContext<SocietyContextType | undefined>(undefined)

export function SocietyProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([])
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

      // Fetch Installments
      const { data: transData } = await supabase
        .from("Installments")
        .select("*")
        .order("created_at", { ascending: false })

      // Fetch Fixed Deposits
      const { data: fdData } = await supabase
        .from("fixed_deposits")
        .select("*")
        .order("year", { ascending: false })

      const nameMap: { [key: string]: string } = {}
      if (membersData) {
        membersData.forEach((m) => {
          const name = m.full_name || m.memberName || m.member_name || "No Name"
          nameMap[String(m.id)] = name
        })
      }

      const enrichedTransData = (transData || []).map((trans) => {
        const matchedName = nameMap[String(trans.member_id)]
        return {
          ...trans,
          memberName: matchedName || trans.memberName || `Member #${trans.member_id}`,
        }
      })

      setMembers(membersData || [])
      setTransactions(enrichedTransData)
      setFixedDeposits(fdData || [])
    } catch (err) {
      console.error("[v0] Data refresh failed:", err)
    }
  }

  useEffect(() => {
    if (currentUser) refreshData()
  }, [currentUser])

  // --- Installment Logic ---
  const approveInstalment = async (transaction: any, status: "Approved" | "Rejected") => {
    try {
      const { error: dbError } = await supabase
        .from("Installments")
        .update({ status: status, approved_at: new Date().toISOString() })
        .eq("id", transaction.id)

      if (dbError) throw dbError

      const memberObj = members.find((m) => String(m.id) === String(transaction.member_id))
      const targetEmail = memberObj?.email

      if (targetEmail) {
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
      }
      
      await refreshData()
    } catch (err) {
      console.error("Workflow failed:", err)
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

      const { error: dbError } = await supabase.from("Installments").insert([
        {
          member_id: currentUser.id,
          memberName: currentUser.full_name || currentUser.memberName,
          society_id: currentUser.society_id,
          amount: Number(amount),
          payment_proof_url: urlData.publicUrl,
          proofPath: fileName,
          month: month,
          status: "Pending",
          created_at: new Date().toISOString(),
        },
      ])

      if (dbError) throw dbError
      await refreshData()
    } catch (err: any) {
      console.error("Submission Error:", err.message)
    }
  }

  // --- Fixed Deposit Logic ---
  const addDeposit = async (deposit: FixedDeposit) => {
    const { error } = await supabase.from("fixed_deposits").insert([deposit])
    if (error) throw error
    await refreshData()
  }

  const updateDeposit = async (id: string, updates: Partial<FixedDeposit>) => {
    const { error } = await supabase.from("fixed_deposits").update(updates).eq("id", id)
    if (error) throw error
    await refreshData()
  }

  // --- Auth Logic ---
  const login = async (email: string, pass: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      })
      if (authError) throw authError
      const { data: memberData } = await supabase.from("members").select("*").eq("email", email.trim()).single()
      if (memberData) {
        setCurrentUser(memberData)
        localStorage.setItem("user", JSON.stringify(memberData))
        return true
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
      const { error } = await supabase.from("members").insert([userData])
      if (error) throw error
      await refreshData()
      return true
    } catch (err) {
      return false
    }
  }

  const approveMember = async (id: string) => {
    await supabase.from("members").update({ is_active: true }).eq("id", id)
    await refreshData()
  }

  const deleteMember = async (id: string) => {
    await supabase.from("members").delete().eq("id", id)
    await refreshData()
  }

  const updateProfile = async (data: any) => {
    const u = { ...currentUser, ...data }
    setCurrentUser(u)
    localStorage.setItem("user", JSON.stringify(u))
  }

  const uploadProfilePic = async (file: File): Promise<string> => {
    try {
      if (!currentUser) throw new Error("No user logged in")
      const fileExt = file.name.split(".").pop()
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName)
      await updateProfile({ profile_pic: urlData.publicUrl })
      return urlData.publicUrl
    } catch (err: any) {
      throw err
    }
  }

  return (
    <SocietyContext.Provider
      value={{
        currentUser,
        members,
        transactions,
        fixedDeposits,
        societyTotalFund,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        uploadProfilePic,
        refreshData,
        approveMember,
        deleteMember,
        submitInstalment,
        approveInstalment,
        addDeposit,
        updateDeposit
      }}
    >
      {children}
    </SocietyContext.Provider>
  )
}

export function useSociety() {
  const context = useContext(SocietyContext)
  if (!context) throw new Error("useSociety must be used within a SocietyProvider")
  return context
}