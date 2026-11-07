"use client"

import { useEffect, useState } from "react"
import { UserAdminPanel } from "@/components/user-admin-panel"
import type { AdminUser, UserLevel } from "@/components/user-admin-panel"
import { getUsers, getUserLevels } from "@/lib/db/users"

export default function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [userLevels, setUserLevels] = useState<UserLevel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const fetchedUsers = await getUsers()
        const fetchedLevels = await getUserLevels()

        setUsers(fetchedUsers)
        setUserLevels(fetchedLevels)
      } catch (error) {
        console.error("Error fetching users data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return <UserAdminPanel initialUsers={users} userLevels={userLevels} />
}
