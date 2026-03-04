import { Navigate, createBrowserRouter } from "react-router-dom";
import {
  DashboardHomeRedirect,
  GuestOnly,
  RequireAuth,
  RequireRole,
  RootRedirect,
} from "@/app/routeGuards";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmailVerificationPage } from "@/pages/EmailVerificationPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ResetPasswordConfirmPage } from "@/pages/ResetPasswordConfirmPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { VerificationResendPage } from "@/pages/VerificationResendPage";
import { AdminDashboardPage } from "@/pages/dashboard/AdminDashboardPage";
import { AdminApplicationsPage } from "@/pages/dashboard/AdminApplicationsPage";
import { AdminBuildingsPage } from "@/pages/dashboard/AdminBuildingsPage";
import { AdminCategoriesPage } from "@/pages/dashboard/AdminCategoriesPage";
import { AdminKpiPage } from "@/pages/dashboard/AdminKpiPage";
import { AdminMyDepartmentPage } from "@/pages/dashboard/AdminMyDepartmentPage";
import { AdminOfferingsPage } from "@/pages/dashboard/AdminOfferingsPage";
import { AccountSettingsPage } from "@/pages/dashboard/AccountSettingsPage";
import { EmployeeDashboardPage } from "@/pages/dashboard/EmployeeDashboardPage";
import { EmployeeMyDepartmentPage } from "@/pages/dashboard/EmployeeMyDepartmentPage";
import { EmployeeBuildingPage } from "@/pages/dashboard/EmployeeBuildingPage";
import { EmployeeCategoriesPage } from "@/pages/dashboard/EmployeeCategoriesPage";
import { EmployeeOfferingsPage } from "@/pages/dashboard/EmployeeOfferingsPage";
import { EmployeeApplicationsPage } from "@/pages/dashboard/EmployeeApplicationsPage";
import { EmployeeKpiPage } from "@/pages/dashboard/EmployeeKpiPage";
import { ManagerDashboardPage } from "@/pages/dashboard/ManagerDashboardPage";
import { ManagerBuildingsPage } from "@/pages/dashboard/ManagerBuildingsPage";
import { ManagerCategoriesPage } from "@/pages/dashboard/ManagerCategoriesPage";
import { ManagerMyDepartmentPage } from "@/pages/dashboard/ManagerMyDepartmentPage";
import { ManagerApplicationsPage } from "@/pages/dashboard/ManagerApplicationsPage";
import { ManagerOfferingsPage } from "@/pages/dashboard/ManagerOfferingsPage";
import { ManagerKpiPage } from "@/pages/dashboard/ManagerKpiPage";
import { ManagerUsersPage } from "@/pages/dashboard/ManagerUsersPage";
import { OwnerApplicationsPage } from "@/pages/dashboard/OwnerApplicationsPage";
import { OwnerBuildingsPage } from "@/pages/dashboard/OwnerBuildingsPage";
import { OwnerCategoriesPage } from "@/pages/dashboard/OwnerCategoriesPage";
import { OwnerDashboardPage } from "@/pages/dashboard/OwnerDashboardPage";
import { OwnerDepartmentsPage } from "@/pages/dashboard/OwnerDepartmentsPage";
import { OwnerOfferingsPage } from "@/pages/dashboard/OwnerOfferingsPage";
import { OwnerKpiPage } from "@/pages/dashboard/OwnerKpiPage";
import { OwnerUsersPage } from "@/pages/dashboard/OwnerUsersPage";
import { UserDashboardPage } from "@/pages/dashboard/UserDashboardPage";
import { UserOfferingsPage } from "@/pages/dashboard/UserOfferingsPage";
import { UserApplicationsPage } from "@/pages/dashboard/UserApplicationsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/auth",
    element: (
      <GuestOnly>
        <AuthLayout />
      </GuestOnly>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "verification/resend",
        element: <VerificationResendPage />,
      },
      {
        path: "verification/:token",
        element: <EmailVerificationPage />,
      },
      {
        path: "verification/:token/:lang",
        element: <EmailVerificationPage />,
      },
      {
        path: "password/reset",
        element: <ResetPasswordPage />,
      },
      {
        path: "password/confirm",
        element: <ResetPasswordConfirmPage />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <DashboardHomeRedirect />,
      },
      {
        path: "account",
        element: <AccountSettingsPage />,
      },
      {
        path: "settings",
        element: <Navigate to="/dashboard/account" replace />,
      },
      {
        path: ":role/account",
        element: <Navigate to="/dashboard/account" replace />,
      },
      {
        path: "owner",
        element: (
          <RequireRole allowed={["ROLE_OWNER"]}>
            <OwnerDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: "owner/users",
        element: (
          <RequireRole allowed={["ROLE_OWNER"]}>
            <OwnerUsersPage />
          </RequireRole>
        ),
      },
      {
        path: "owner/departments",
        element: (
          <RequireRole allowed={["ROLE_OWNER"]}>
            <OwnerDepartmentsPage />
          </RequireRole>
        ),
      },
      {
        path: "owner/buildings",
        element: (
          <RequireRole allowed={["ROLE_OWNER"]}>
            <OwnerBuildingsPage />
          </RequireRole>
        ),
      },
      {
        path: "owner/categories",
        element: (
          <RequireRole allowed={["ROLE_OWNER"]}>
            <OwnerCategoriesPage />
          </RequireRole>
        ),
      },
      {
        path: "owner/kpi",
        element: (
          <RequireRole allowed={["ROLE_OWNER"]}>
            <OwnerKpiPage />
          </RequireRole>
        ),
      },
      {
        path: "owner/offerings",
        element: (
          <RequireRole allowed={["ROLE_OWNER"]}>
            <OwnerOfferingsPage />
          </RequireRole>
        ),
      },
      {
        path: "owner/applications",
        element: (
          <RequireRole allowed={["ROLE_OWNER"]}>
            <OwnerApplicationsPage />
          </RequireRole>
        ),
      },
      {
        path: "admin",
        element: (
          <RequireRole allowed={["ROLE_ADMIN"]}>
            <AdminDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/my-department",
        element: (
          <RequireRole allowed={["ROLE_ADMIN"]}>
            <AdminMyDepartmentPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/building",
        element: (
          <RequireRole allowed={["ROLE_ADMIN"]}>
            <AdminBuildingsPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/buildings",
        element: <Navigate to="/dashboard/admin/building" replace />,
      },
      {
        path: "admin/categories",
        element: (
          <RequireRole allowed={["ROLE_ADMIN"]}>
            <AdminCategoriesPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/offerings",
        element: (
          <RequireRole allowed={["ROLE_ADMIN"]}>
            <AdminOfferingsPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/kpi",
        element: (
          <RequireRole allowed={["ROLE_ADMIN"]}>
            <AdminKpiPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/applications",
        element: (
          <RequireRole allowed={["ROLE_ADMIN"]}>
            <AdminApplicationsPage />
          </RequireRole>
        ),
      },
      {
        path: "manager",
        element: (
          <RequireRole allowed={["ROLE_MANAGER"]}>
            <ManagerDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: "manager/users",
        element: (
          <RequireRole allowed={["ROLE_MANAGER"]}>
            <ManagerUsersPage />
          </RequireRole>
        ),
      },
      {
        path: "manager/my-department",
        element: (
          <RequireRole allowed={["ROLE_MANAGER"]}>
            <ManagerMyDepartmentPage />
          </RequireRole>
        ),
      },
      {
        path: "manager/buildings",
        element: (
          <RequireRole allowed={["ROLE_MANAGER"]}>
            <ManagerBuildingsPage />
          </RequireRole>
        ),
      },
      {
        path: "manager/categories",
        element: (
          <RequireRole allowed={["ROLE_MANAGER"]}>
            <ManagerCategoriesPage />
          </RequireRole>
        ),
      },
      {
        path: "manager/offerings",
        element: (
          <RequireRole allowed={["ROLE_MANAGER"]}>
            <ManagerOfferingsPage />
          </RequireRole>
        ),
      },
      {
        path: "manager/kpi",
        element: (
          <RequireRole allowed={["ROLE_MANAGER"]}>
            <ManagerKpiPage />
          </RequireRole>
        ),
      },
      {
        path: "manager/applications",
        element: (
          <RequireRole allowed={["ROLE_MANAGER"]}>
            <ManagerApplicationsPage />
          </RequireRole>
        ),
      },
      {
        path: "employee",
        element: (
          <RequireRole allowed={["ROLE_EMPLOYEE"]}>
            <EmployeeDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: "employee/my-department",
        element: (
          <RequireRole allowed={["ROLE_EMPLOYEE"]}>
            <EmployeeMyDepartmentPage />
          </RequireRole>
        ),
      },
      {
        path: "employee/building",
        element: (
          <RequireRole allowed={["ROLE_EMPLOYEE"]}>
            <EmployeeBuildingPage />
          </RequireRole>
        ),
      },
      {
        path: "employee/categories",
        element: (
          <RequireRole allowed={["ROLE_EMPLOYEE"]}>
            <EmployeeCategoriesPage />
          </RequireRole>
        ),
      },
      {
        path: "employee/offerings",
        element: (
          <RequireRole allowed={["ROLE_EMPLOYEE"]}>
            <EmployeeOfferingsPage />
          </RequireRole>
        ),
      },
      {
        path: "employee/applications",
        element: (
          <RequireRole allowed={["ROLE_EMPLOYEE"]}>
            <EmployeeApplicationsPage />
          </RequireRole>
        ),
      },
      {
        path: "employee/kpi",
        element: (
          <RequireRole allowed={["ROLE_EMPLOYEE"]}>
            <EmployeeKpiPage />
          </RequireRole>
        ),
      },
      {
        path: "user",
        element: (
          <RequireRole allowed={["ROLE_USER"]}>
            <UserDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: "user/offerings",
        element: (
          <RequireRole allowed={["ROLE_USER"]}>
            <UserOfferingsPage />
          </RequireRole>
        ),
      },
      {
        path: "user/applications",
        element: (
          <RequireRole allowed={["ROLE_USER"]}>
            <UserApplicationsPage />
          </RequireRole>
        ),
      },
    ],
  },
  {
    path: "/main",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
