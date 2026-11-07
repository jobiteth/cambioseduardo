"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole } from "@/lib/types"
import { Pencil, Key, Ban, UserPlus, Check, Phone, RefreshCw } from "lucide-react"

interface UserData {
  email: string
  role: UserRole
  createdAt: number
  phone?: string
  banned?: boolean
  banReason?: string
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Estados para modales
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditRoleModal, setShowEditRoleModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showBanUserModal, setShowBanUserModal] = useState(false)
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false)

  // Estados para formularios
  const [newUser, setNewUser] = useState({ email: "", password: "", role: UserRole.MEMBER })
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [newRole, setNewRole] = useState<UserRole>(UserRole.MEMBER)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [banReason, setBanReason] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")

  // Cargar usuarios desde la base de datos
  const loadUsers = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("/api/users/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Error al cargar usuarios: ${response.status}`)
      }

      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error cargando usuarios:", error)
      setError("Error al cargar usuarios. Por favor, intente de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Función para agregar usuario
  const handleAddUser = async () => {
    try {
      // Validar datos
      if (!newUser.email || !newUser.password) {
        setError("Email y contraseña son requeridos")
        return
      }

      // Validar formato de correo
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newUser.email)) {
        setError("Formato de correo electrónico inválido")
        return
      }

      // Validar longitud de contraseña
      if (newUser.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        return
      }

      // Crear usuario en la base de datos
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      // Limpiar formulario y cerrar modal
      setNewUser({ email: "", password: "", role: UserRole.MEMBER })
      setShowAddUserModal(false)

      // Mostrar mensaje de éxito y recargar usuarios
      setSuccess("Usuario creado correctamente")
      loadUsers()

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al crear usuario")
    }
  }

  // Función para cambiar rol
  const handleChangeRole = async () => {
    try {
      if (!selectedUser) {
        setError("No se ha seleccionado ningún usuario")
        return
      }

      // Actualizar rol en la base de datos
      const response = await fetch("/api/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedUser.email,
          role: newRole,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      // Cerrar modal y recargar usuarios
      setShowEditRoleModal(false)
      setSuccess("Rol actualizado correctamente")
      loadUsers()

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al cambiar rol")
    }
  }

  // Función para resetear contraseña
  const handleResetPassword = async () => {
    try {
      if (!selectedUser) {
        setError("No se ha seleccionado ningún usuario")
        return
      }

      // Validar contraseñas
      if (newPassword !== confirmPassword) {
        setError("Las contraseñas no coinciden")
        return
      }

      if (newPassword.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        return
      }

      // Resetear contraseña en la base de datos
      const response = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedUser.email,
          password: newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      // Cerrar modal y recargar usuarios
      setShowResetPasswordModal(false)
      setNewPassword("")
      setConfirmPassword("")
      setSuccess("Contraseña reseteada correctamente")

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al resetear contraseña")
    }
  }

  // Función para banear/desbanear usuario
  const handleToggleBan = async () => {
    try {
      if (!selectedUser) {
        setError("No se ha seleccionado ningún usuario")
        return
      }

      // Banear/desbanear usuario en la base de datos
      const response = await fetch("/api/users/toggle-ban", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedUser.email,
          banned: !selectedUser.banned,
          reason: banReason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      // Cerrar modal y recargar usuarios
      setShowBanUserModal(false)
      setBanReason("")
      setSuccess(selectedUser.banned ? "Usuario desbaneado correctamente" : "Usuario baneado correctamente")
      loadUsers()

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al banear/desbanear usuario")
    }
  }

  // Función para actualizar número de teléfono
  const handleUpdatePhone = async () => {
    try {
      if (!selectedUser) {
        setError("No se ha seleccionado ningún usuario")
        return
      }

      // Actualizar teléfono en la base de datos
      const response = await fetch("/api/users/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: selectedUser.email,
          phone: phoneNumber,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      // Cerrar modal y recargar usuarios
      setShowEditPhoneModal(false)
      setSuccess("Número de teléfono actualizado correctamente")
      loadUsers()

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al actualizar número de teléfono")
    }
  }

  // Función para abrir modal de edición de rol
  const openEditRoleModal = (user: UserData) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setShowEditRoleModal(true)
  }

  // Función para abrir modal de reseteo de contraseña
  const openResetPasswordModal = (user: UserData) => {
    setSelectedUser(user)
    setNewPassword("")
    setConfirmPassword("")
    setShowResetPasswordModal(true)
  }

  // Función para abrir modal de baneo
  const openBanUserModal = (user: UserData) => {
    setSelectedUser(user)
    setBanReason(user.banReason || "")
    setShowBanUserModal(true)
  }

  // Función para abrir modal de edición de teléfono
  const openEditPhoneModal = (user: UserData) => {
    setSelectedUser(user)
    setPhoneNumber(user.phone || "")
    setShowEditPhoneModal(true)
  }

  // Función para obtener texto de rol
  const getRoleText = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "Administrador"
      case UserRole.MEMBER:
        return "Usuario"
      case UserRole.MEMBER:
        return "Miembro"
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="bg-red-900 border-red-800">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-900 border-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between mb-4">
        <Button onClick={loadUsers} variant="outline" className="flex items-center gap-1">
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </Button>

        <Button onClick={() => setShowAddUserModal(true)} className="flex items-center gap-1">
          <UserPlus className="h-4 w-4" />
          <span>Agregar Usuario</span>
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-4 text-gray-400">No hay usuarios registrados</div>
      ) : (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Usuarios Registrados</CardTitle>
            <CardDescription className="text-gray-400">Administra los usuarios del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Correo Electrónico</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.email} className={user.banned ? "bg-red-900/20" : ""}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleText(user.role)}</TableCell>
                      <TableCell>{user.phone || "No registrado"}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {user.banned ? (
                          <span className="text-red-400 flex items-center gap-1">
                            <Ban className="h-4 w-4" />
                            Baneado
                          </span>
                        ) : (
                          <span className="text-green-400 flex items-center gap-1">
                            <Check className="h-4 w-4" />
                            Activo
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditRoleModal(user)}
                            className="h-8 px-2"
                            title="Cambiar rol"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResetPasswordModal(user)}
                            className="h-8 px-2"
                            title="Resetear contraseña"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditPhoneModal(user)}
                            className="h-8 px-2"
                            title="Editar teléfono"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant={user.banned ? "default" : "destructive"}
                            size="sm"
                            onClick={() => openBanUserModal(user)}
                            className="h-8 px-2"
                            title={user.banned ? "Desbanear usuario" : "Banear usuario"}
                          >
                            {user.banned ? <Check className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para agregar usuario */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Agregar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                  <SelectItem value={UserRole.MEMBER}>Usuario</SelectItem>
                  <SelectItem value={UserRole.MEMBER}>Miembro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUser}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar rol */}
      <Dialog open={showEditRoleModal} onOpenChange={setShowEditRoleModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm">
              <span className="text-gray-400">Usuario: </span>
              <span>{selectedUser?.email}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Nuevo Rol</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                  <SelectItem value={UserRole.MEMBER}>Usuario</SelectItem>
                  <SelectItem value={UserRole.MEMBER}>Miembro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditRoleModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeRole}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para resetear contraseña */}
      <Dialog open={showResetPasswordModal} onOpenChange={setShowResetPasswordModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Resetear Contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm">
              <span className="text-gray-400">Usuario: </span>
              <span>{selectedUser?.email}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar teléfono */}
      <Dialog open={showEditPhoneModal} onOpenChange={setShowEditPhoneModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Editar Número de Teléfono</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm">
              <span className="text-gray-400">Usuario: </span>
              <span>{selectedUser?.email}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Número de Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-slate-800 border-slate-700"
                placeholder="+58 123 456 7890"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPhoneModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePhone}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para banear/desbanear usuario */}
      <Dialog open={showBanUserModal} onOpenChange={setShowBanUserModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>{selectedUser?.banned ? "Desbanear Usuario" : "Banear Usuario"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm">
              <span className="text-gray-400">Usuario: </span>
              <span>{selectedUser?.email}</span>
            </div>

            {!selectedUser?.banned && (
              <div className="space-y-2">
                <Label htmlFor="ban-reason">Razón del Baneo</Label>
                <Input
                  id="ban-reason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            )}

            {selectedUser?.banned && (
              <div className="text-sm">
                <span className="text-gray-400">Razón del baneo: </span>
                <span>{selectedUser.banReason || "No especificada"}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanUserModal(false)}>
              Cancelar
            </Button>
            <Button variant={selectedUser?.banned ? "default" : "destructive"} onClick={handleToggleBan}>
              {selectedUser?.banned ? "Desbanear" : "Banear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
