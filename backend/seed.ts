import { AppDataSource } from "./src/data-source"
import { Role } from "./src/entities/role.entity"
import { Permission } from "./src/entities/permission.entity"
import { User } from "./src/entities/user.entity"

async function runSeeder() {
  await AppDataSource.initialize()
  console.log("Database connected.")

  const roleRepo = AppDataSource.getRepository(Role)
  const userRepo = AppDataSource.getRepository(User)
  const permRepo = AppDataSource.getRepository(Permission)

  const permissions = [
    { id: "users.create", description: "Create new users" },
    { id: "users.edit", description: "Edit existing users" },
    { id: "users.deactivate", description: "Deactivate users" },
    { id: "roles.manage", description: "Manage roles and permissions" },
    { id: "orders.create", description: "Create orders" },
    { id: "orders.confirm", description: "Confirm orders" },
    { id: "orders.cancel", description: "Cancel orders" },
    { id: "finance.expense.approve", description: "Approve expenses" },
    { id: "finance.payroll.authorize", description: "Authorize payroll" },
    {
      id: "inventory.adjustment.approve",
      description: "Approve inventory adjustments",
    },
    {
      id: "banking.reconcile.override",
      description: "Override banking reconciliations",
    },
    { id: "masterdata.customers.create", description: "Create new customers" },
    {
      id: "masterdata.customers.approve",
      description: "Approve urgent customers",
    },
  ]

  for (const perm of permissions) {
    let p = await permRepo.findOneBy({ id: perm.id })
    if (!p) {
      p = permRepo.create(perm)
      await permRepo.save(p)
    }
  }

  const roles = [
    { id: "general-manager", tier: 1 },
    { id: "vice-manager", tier: 2 },
    { id: "sales-rep", tier: 3 },
    { id: "inventory-manager", tier: 3 },
    { id: "head-roaster", tier: 4 },
    { id: "accountant", tier: 4 },
    { id: "delivery-staff", tier: 5 },
  ]

  for (const r of roles) {
    let role = await roleRepo.findOneBy({ id: r.id })
    if (!role) {
      role = roleRepo.create(r)
      await roleRepo.save(role)
    }
  }

  const users = [
    {
      id: "USR-001",
      name: "Abebe Girma",
      email: "abebe.g@flavorcoffee.et",
      roleId: "general-manager",
      status: "active",
      department: "Executive",
      avatar: "AG",
      avatarColor: "#1D4ED8",
    },
    {
      id: "USR-002",
      name: "Hiwot Tadesse",
      email: "hiwot.t@flavorcoffee.et",
      roleId: "vice-manager",
      status: "active",
      department: "Executive",
      avatar: "HT",
      avatarColor: "#7C3AED",
    },
    {
      id: "USR-003",
      name: "Meron Bekele",
      email: "meron.b@flavorcoffee.et",
      roleId: "sales-rep",
      status: "active",
      department: "Sales",
      avatar: "MB",
      avatarColor: "#0E7490",
    },
    {
      id: "USR-004",
      name: "Solomon Tesfaye",
      email: "solomon.t@flavorcoffee.et",
      roleId: "inventory-manager",
      status: "active",
      department: "Operations",
      avatar: "ST",
      avatarColor: "#B45309",
    },
    {
      id: "USR-005",
      name: "Dawit Haile",
      email: "dawit.h@flavorcoffee.et",
      roleId: "head-roaster",
      status: "active",
      department: "Production",
      avatar: "DH",
      avatarColor: "#92400E",
    },
    {
      id: "USR-006",
      name: "Tigist Alemu",
      email: "tigist.a@flavorcoffee.et",
      roleId: "accountant",
      status: "active",
      department: "Finance",
      avatar: "TA",
      avatarColor: "#BE185D",
    },
    {
      id: "USR-007",
      name: "Selamawit Bekele",
      email: "selamawit.b@flavorcoffee.et",
      roleId: "inventory-manager",
      status: "active",
      department: "Quality",
      avatar: "SB",
      avatarColor: "#B45309",
    },
    {
      id: "USR-008",
      name: "Yohannes Mesfin",
      email: "yohannes.m@flavorcoffee.et",
      roleId: "delivery-staff",
      status: "active",
      department: "Logistics",
      avatar: "YM",
      avatarColor: "#065F46",
    },
    {
      id: "USR-009",
      name: "Mekdes Hailu",
      email: "mekdes.h@flavorcoffee.et",
      roleId: "delivery-staff",
      status: "active",
      department: "Logistics",
      avatar: "MH",
      avatarColor: "#065F46",
    },
    {
      id: "USR-010",
      name: "Biruk Assefa",
      email: "biruk.a@flavorcoffee.et",
      roleId: "head-roaster",
      status: "disabled",
      department: "Production",
      avatar: "BA",
      avatarColor: "#92400E",
    },
    {
      id: "USR-011",
      name: "Lidiya Worku",
      email: "lidiya.w@flavorcoffee.et",
      roleId: "accountant",
      status: "disabled",
      department: "Finance",
      avatar: "LW",
      avatarColor: "#BE185D",
    },
  ]

  for (const u of users) {
    let user = await userRepo.findOneBy({ email: u.email })
    if (!user) {
      user = userRepo.create({
        businessNumber: u.id,
        name: u.name,
        email: u.email,
        roleId: u.roleId,
        status: u.status,
        department: u.department,
        avatar: u.avatar,
        avatarColor: u.avatarColor,
        deactivatedAt: u.status === "disabled" ? new Date() : null,
      })
      await userRepo.save(user)
    }
  }

  console.log("Seeding completed successfully!")
  await AppDataSource.destroy()
}

runSeeder().catch((err) => {
  console.error("Error seeding data:", err)
  process.exit(1)
})
