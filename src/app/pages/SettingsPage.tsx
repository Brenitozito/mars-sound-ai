import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { AccountSettings } from "../components/settings/AccountSettings";
import { MusicPreferencesForm } from "../components/settings/MusicPreferencesForm";
import { ProfileSettingsForm } from "../components/settings/ProfileSettingsForm";
import { getTabPanelProps, TabNav, type TabDefinition } from "../components/ui/TabNav";
import { usePageMeta } from "../hooks/usePageMeta";
import { useUrlTab } from "../hooks/useUrlTab";

type SettingsTabId = "perfil" | "conta";

const SETTINGS_TABS: ReadonlyArray<TabDefinition<SettingsTabId>> = [
  { id: "perfil", label: "Perfil" },
  { id: "conta", label: "Conta" },
];
const SETTINGS_TAB_IDS = SETTINGS_TABS.map((tab) => tab.id);
const TAB_ID_PREFIX = "settings";

export default function SettingsPage() {
  const [activeTab, selectTab] = useUrlTab(SETTINGS_TAB_IDS, "perfil");
  usePageMeta("Configurações");

  return (
    <PageContainer width="narrow">
      <div className="mb-6">
        <PageHeader title="Configurações" description="Gerencie sua conta e preferências" />
      </div>

      <TabNav
        tabs={SETTINGS_TABS}
        activeTabId={activeTab}
        onSelect={selectTab}
        idPrefix={TAB_ID_PREFIX}
        ariaLabel="Seções das configurações"
        className="mb-6"
      />

      <div {...getTabPanelProps(TAB_ID_PREFIX, activeTab)}>
        {activeTab === "perfil" ? (
          <div className="flex flex-col gap-4">
            <ProfileSettingsForm />
            <MusicPreferencesForm />
          </div>
        ) : (
          <AccountSettings />
        )}
      </div>
    </PageContainer>
  );
}
