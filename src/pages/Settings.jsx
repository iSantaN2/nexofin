import React, { useContext, useState } from "react";
import { BellRing, LayoutGrid, UserCircle2, WalletCards } from "lucide-react";
import { useCategories } from "../context/CategoriesContext";
import { usePaymentMethods } from "../context/PaymentMethodsContext";
import { useAuth } from "../context/AuthContext";
import { AppContext } from "../context/AppContext";
import PageHero from "../components/ui/PageHero";
import SectionPanel from "../components/ui/SectionPanel";
import NotificationSettings from "../components/settings/NotificationSettings";
import ProfileSettings from "../components/settings/ProfileSettings";
import CategorySettings from "../components/settings/CategorySettings";
import PaymentSettings from "../components/settings/PaymentSettings";
import { getUserAlias, getUserInitial, getUserPhotoUrl } from "../utils/profile";

const TABS = [
  {
    key: "profile",
    label: "Perfil",
    description: "Cuenta, correo y seguridad",
    icon: UserCircle2,
  },
  {
    key: "categories",
    label: "Categorias",
    description: "Ingresos y gastos",
    icon: LayoutGrid,
  },
  {
    key: "methods",
    label: "Metodos de pago",
    description: "Efectivo, tarjetas y billeteras",
    icon: WalletCards,
  },
  {
    key: "notifications",
    label: "Notificaciones",
    description: "Alertas financieras",
    icon: BellRing,
  },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const { notificationSettings, updateNotificationSettings } = useContext(AppContext);
  const { categories, addCategory, editCategory, deleteCategory } = useCategories();
  const { methods, addMethod, editMethod, deleteMethod } = usePaymentMethods();
  const {
    user,
    userProfile,
    updateUserEmail,
    updateUserPassword,
    updateUserProfileDetails,
    deleteUserAccount,
  } = useAuth();
  const userAlias = getUserAlias(user, userProfile);
  const userInitial = getUserInitial(user, userProfile);
  const userPhotoUrl = getUserPhotoUrl(user, userProfile);

  const activeAlerts = [
    notificationSettings?.budget80Enabled,
    notificationSettings?.budget100Enabled,
    notificationSettings?.dailyReminderEnabled,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Configuracion"
        title="Ajustes"
        description="Gestiona perfil, categorias, metodos de pago y alertas desde una consola mas clara y moderna."
        stats={[
          {
            label: "Categorias",
            value: `${categories.length}`,
          },
          {
            label: "Metodos",
            value: `${methods.length}`,
          },
          {
            label: "Alertas",
            value: `${activeAlerts}/3`,
            tone: activeAlerts > 0 ? "success" : "warning",
          },
          {
            label: "Cuenta",
            value: user?.email ? "Activa" : "Pendiente",
            tone: user?.email ? "success" : "warning",
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="nexo-surface relative overflow-hidden rounded-3xl border border-[#dbe8ff] bg-white p-5 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1f67ff] via-[#19b9c7] to-[#11c69a]" />
          <div className="pointer-events-none absolute -right-12 -top-16 h-32 w-32 rounded-full bg-[#11c69a]/12 blur-2xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Cuenta activa</p>
              <h2 className="mt-1 text-2xl font-bold text-[#061a3d]">{userAlias}</h2>
              <p className="mt-1 break-all text-sm text-slate-500">{user?.email || "-"}</p>
            </div>
            {userPhotoUrl ? (
              <img
                src={userPhotoUrl}
                alt={`Foto de ${userAlias}`}
                className="h-16 w-16 rounded-3xl object-cover ring-1 ring-[#dbe8ff]"
              />
            ) : (
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eff8ff] text-2xl font-bold text-[#1f67ff] ring-1 ring-[#dbe8ff]">
                {userInitial}
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] border border-[#dbe8ff] bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Categorias</p>
            <p className="mt-1 text-2xl font-bold text-[#0a2b6e]">{categories.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-[#dbe8ff] bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Metodos</p>
            <p className="mt-1 text-2xl font-bold text-[#0a2b6e]">{methods.length}</p>
          </div>
          <div className="col-span-2 rounded-[1.5rem] border border-[#dbe8ff] bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Alertas activas</p>
            <p className="mt-1 text-2xl font-bold text-[#11a987]">{activeAlerts} / 3</p>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TABS.map(({ key, label, description, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            onClick={() => setActiveTab(key)}
            className={`group flex min-h-24 items-start gap-3 rounded-[1.5rem] border p-4 text-left transition ${
              activeTab === key
                ? "border-[#1f67ff] bg-[#eff8ff] text-[#0a2b6e] shadow-[0_18px_38px_rgba(31,103,255,0.12)]"
                : "border-[#dbe8ff] bg-white text-[#0a2b6e] shadow-sm hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(10,43,110,0.08)]"
            }`}
          >
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                activeTab === key ? "bg-white text-[#1f67ff]" : "bg-[#eff8ff] group-hover:bg-[#e3f2ff]"
              }`}
            >
              <Icon size={18} />
            </span>
            <span>
              <span className="block font-bold">{label}</span>
              <span className="mt-1 block text-sm text-slate-500">
                {description}
              </span>
            </span>
          </button>
        ))}
      </div>

      <SectionPanel>
        {activeTab === "profile" && (
          <ProfileSettings
            user={user}
            userProfile={userProfile}
            updateUserProfileDetails={updateUserProfileDetails}
            updateUserEmail={updateUserEmail}
            updateUserPassword={updateUserPassword}
            deleteUserAccount={deleteUserAccount}
          />
        )}

        {activeTab === "categories" && (
          <CategorySettings
            categories={categories}
            addCategory={addCategory}
            editCategory={editCategory}
            deleteCategory={deleteCategory}
          />
        )}

        {activeTab === "methods" && (
          <PaymentSettings
            methods={methods}
            addMethod={addMethod}
            editMethod={editMethod}
            deleteMethod={deleteMethod}
          />
        )}

        {activeTab === "notifications" && (
          <NotificationSettings
            notificationSettings={notificationSettings}
            updateNotificationSettings={updateNotificationSettings}
          />
        )}
      </SectionPanel>
    </div>
  );
}
