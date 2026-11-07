"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, UserCog, Phone, Ban, PlusCircle, Check } from "lucide-react"
import {
  updateUser,
  createUser,
  updateUserRole,
  updateUserPhone,
  toggleUserBan,
  updateUserPassword,
} from "@/lib/actions/user-actions"
import { toast } from "@/components/ui/use-toast"
import { errorMessage } from "@/lib/error-message"

export interface AdminUser {
  id: number
  name: string
  email: string
  level_id: number
  level_name?: string
  created_at: string | Date
  phone: string | null
  baneo: boolean
}
export interface UserLevel { id: number; level_name: string }

export function UserAdminPanel({ initialUsers, userLevels }: { initialUsers: AdminUser[]; userLevels: UserLevel[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    level_id: "",
    phone: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const handleEditClick = (user: AdminUser) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      level_id: user.level_id.toString(),
      phone: user.phone || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleRoleClick = (user: AdminUser) => {
    setSelectedUser(user)
    setFormData({
      ...formData,
      level_id: user.level_id.toString(),
    })
    setIsRoleDialogOpen(true)
  }

  const handlePhoneClick = (user: AdminUser) => {
    setSelectedUser(user)
    setFormData({
      ...formData,
      phone: user.phone || "",
    })
    setIsPhoneDialogOpen(true)
  }

  const handlePasswordClick = (user: AdminUser) => {
    setSelectedUser(user)
    setFormData({
      ...formData,
      password: "",
    })
    setConfirmPassword("")
    setPasswordError("")
    setIsPasswordDialogOpen(true)
  }

  const handleBanClick = async (user: AdminUser) => {
    try {
      const updatedUser = await toggleUserBan({
        id: user.id,
        baneo: !user.baneo,
      })

      setUsers(
        users.map((u) =>
          u.id === updatedUser.id
            ? {
                ...u,
                baneo: updatedUser.baneo,
              }
            : u,
        ),
      )

      toast({
        title: updatedUser.baneo ? "Usuario baneado" : "Usuario desbaneado",
        description: `El usuario ${user.name} ha sido ${updatedUser.baneo ? "baneado" : "desbaneado"} correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: errorMessage(error) || "No se pudo actualizar el estado del usuario.",
        variant: "destructive",
      })
      console.error("Error al actualizar estado de baneo:", error)
    }
  }

  const handleAddClick = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      level_id: "1", // Default to miembro
      phone: "",
    })
    setConfirmPassword("")
    setPasswordError("")
    setIsAddDialogOpen(true)
  }

  const validatePasswords = () => {
    if (formData.password && formData.password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return false
    }
    setPasswordError("")
    return true
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    try {
      const updatedUser = await updateUser({
        id: selectedUser.id,
        name: formData.name,
        email: formData.email,
      })

      setUsers(
        users.map((user) =>
          user.id === updatedUser.id
            ? {
                ...user,
                name: updatedUser.name,
                email: updatedUser.email,
              }
            : user,
        ),
      )

      setIsEditDialogOpen(false)
      toast({
        title: "Usuario actualizado",
        description: `El usuario ${updatedUser.name} ha sido actualizado correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: errorMessage(error) || "No se pudo actualizar el usuario. Inténtalo de nuevo.",
        variant: "destructive",
      })
      console.error("Error al actualizar usuario:", error)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedUser) return
    try {
      const updatedUser = await updateUserRole({
        id: selectedUser.id,
        level_id: Number.parseInt(formData.level_id),
      })

      setUsers(
        users.map((user) =>
          user.id === updatedUser.id
            ? {
                ...user,
                level_id: updatedUser.level_id,
                level_name: userLevels.find((l) => l.id === updatedUser.level_id)?.level_name,
              }
            : user,
        ),
      )

      setIsRoleDialogOpen(false)
      toast({
        title: "Rol actualizado",
        description: `El rol del usuario ${selectedUser.name} ha sido actualizado correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: errorMessage(error) || "No se pudo actualizar el rol. Inténtalo de nuevo.",
        variant: "destructive",
      })
      console.error("Error al actualizar rol:", error)
    }
  }

  const handleUpdatePhone = async () => {
    if (!selectedUser) return
    try {
      const updatedUser = await updateUserPhone({
        id: selectedUser.id,
        phone: formData.phone,
      })

      setUsers(
        users.map((user) =>
          user.id === updatedUser.id
            ? {
                ...user,
                phone: updatedUser.phone,
              }
            : user,
        ),
      )

      setIsPhoneDialogOpen(false)
      toast({
        title: "Teléfono actualizado",
        description: `El teléfono del usuario ${selectedUser.name} ha sido actualizado correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: errorMessage(error) || "No se pudo actualizar el teléfono. Inténtalo de nuevo.",
        variant: "destructive",
      })
      console.error("Error al actualizar teléfono:", error)
    }
  }

  const handleUpdatePassword = async () => {
    if (!selectedUser) return
    if (!validatePasswords()) {
      return
    }

    try {
      await updateUserPassword({
        id: selectedUser.id,
        password: formData.password,
      })

      setIsPasswordDialogOpen(false)
      toast({
        title: "Contraseña actualizada",
        description: `La contraseña del usuario ${selectedUser.name} ha sido actualizada correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: errorMessage(error) || "No se pudo actualizar la contraseña. Inténtalo de nuevo.",
        variant: "destructive",
      })
      console.error("Error al actualizar contraseña:", error)
    }
  }

  const handleCreateUser = async () => {
    if (!validatePasswords()) {
      return
    }

    try {
      const newUser = await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        level_id: Number.parseInt(formData.level_id),
        phone: formData.phone || null,
      })

      setUsers([
        ...users,
        {
          ...newUser,
          level_name: userLevels.find((l) => l.id === newUser.level_id)?.level_name,
        },
      ])

      setIsAddDialogOpen(false)
      toast({
        title: "Usuario creado",
        description: `El usuario ${newUser.name} ha sido creado correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: errorMessage(error) || "No se pudo crear el usuario. Inténtalo de nuevo.",
        variant: "destructive",
      })
      console.error("Error al crear usuario:", error)
    }
  }

  const getLevelName = (levelId: number) => {
    const level = userLevels.find((l) => l.id === levelId)
    return level ? level.level_name : "Desconocido"
  }

  return (
    <Card className="bg-slate-900 text-white">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700">
        <div>
          <CardTitle className="text-xl text-white">Administra los usuarios del sistema</CardTitle>
        </div>
        <Button onClick={handleAddClick} className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700">
          <PlusCircle className="h-4 w-4" />
          <span>Nuevo Usuario</span>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="border-collapse">
          <TableHeader className="bg-slate-800">
            <TableRow className="border-b-0">
              <TableHead className="text-slate-300 font-medium">Correo Electrónico</TableHead>
              <TableHead className="text-slate-300 font-medium">Rol</TableHead>
              <TableHead className="text-slate-300 font-medium">Teléfono</TableHead>
              <TableHead className="text-slate-300 font-medium">Fecha de Registro</TableHead>
              <TableHead className="text-slate-300 font-medium">Estado</TableHead>
              <TableHead className="text-slate-300 font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-t border-slate-700">
                <TableCell className="text-slate-300">{user.email}</TableCell>
                <TableCell className="text-slate-300">
                  {getLevelName(user.level_id).charAt(0).toUpperCase() + getLevelName(user.level_id).slice(1)}
                </TableCell>
                <TableCell className="text-slate-300">{user.phone || "No registrado"}</TableCell>
                <TableCell className="text-slate-300">
                  {new Date(user.created_at)
                    .toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                    .replace(",", "")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-1" />
                    <span className={user.baneo ? "text-red-500" : "text-green-500"}>
                      {user.baneo ? "Baneado" : "Activo"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClick(user)}
                      className="bg-slate-800 border-slate-700 hover:bg-slate-700 h-9 w-9"
                    >
                      <Pencil className="h-4 w-4 text-slate-300" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRoleClick(user)}
                      className="bg-slate-800 border-slate-700 hover:bg-slate-700 h-9 w-9"
                    >
                      <UserCog className="h-4 w-4 text-slate-300" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePhoneClick(user)}
                      className="bg-slate-800 border-slate-700 hover:bg-slate-700 h-9 w-9"
                    >
                      <Phone className="h-4 w-4 text-slate-300" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleBanClick(user)}
                      className={`bg-slate-800 border-slate-700 hover:bg-slate-700 h-9 w-9 ${user.baneo ? "text-red-500" : ""}`}
                    >
                      <Ban className={`h-4 w-4 ${user.baneo ? "text-red-500" : "text-slate-300"}`} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Diálogo de edición básica */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right text-slate-300">
                Nombre
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right text-slate-300">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} className="bg-blue-600 text-white hover:bg-blue-700">
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de cambio de rol */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Cambiar Rol</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right text-slate-300">
                Rol
              </Label>
              <Select
                value={formData.level_id}
                onValueChange={(value) => setFormData({ ...formData, level_id: value })}
              >
                <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  {userLevels.map((level) => (
                    <SelectItem
                      key={level.id}
                      value={level.id.toString()}
                      className="text-white focus:bg-slate-600 focus:text-white"
                    >
                      {level.level_name.charAt(0).toUpperCase() + level.level_name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
              className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateRole} className="bg-blue-600 text-white hover:bg-blue-700">
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de cambio de teléfono */}
      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Actualizar Teléfono</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right text-slate-300">
                Teléfono
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+58 123 456 7890"
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPhoneDialogOpen(false)}
              className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdatePhone} className="bg-blue-600 text-white hover:bg-blue-700">
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de cambio de contraseña */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Cambiar Contraseña</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right text-slate-300">
                Nueva Contraseña
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-confirm-password" className="text-right text-slate-300">
                Confirmar
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar contraseña"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                {passwordError && <p className="text-sm text-red-500 mt-1">{passwordError}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdatePassword} className="bg-blue-600 text-white hover:bg-blue-700">
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de añadir usuario */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Añadir Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-name" className="text-right text-slate-300">
                Nombre
              </Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-email" className="text-right text-slate-300">
                Email
              </Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-password" className="text-right text-slate-300">
                Contraseña
              </Label>
              <Input
                id="add-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-confirm-password" className="text-right text-slate-300">
                Confirmar
              </Label>
              <div className="col-span-3">
                <Input
                  id="add-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar contraseña"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                {passwordError && <p className="text-sm text-red-500 mt-1">{passwordError}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-phone" className="text-right text-slate-300">
                Teléfono
              </Label>
              <Input
                id="add-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+58 123 456 7890"
                className="col-span-3 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="add-role" className="text-right text-slate-300">
                Rol
              </Label>
              <Select
                value={formData.level_id}
                onValueChange={(value) => setFormData({ ...formData, level_id: value })}
              >
                <SelectTrigger className="col-span-3 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  {userLevels.map((level) => (
                    <SelectItem
                      key={level.id}
                      value={level.id.toString()}
                      className="text-white focus:bg-slate-600 focus:text-white"
                    >
                      {level.level_name.charAt(0).toUpperCase() + level.level_name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} className="bg-blue-600 text-white hover:bg-blue-700">
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
