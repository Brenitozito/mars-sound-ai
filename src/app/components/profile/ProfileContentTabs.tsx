import type { ReactNode } from "react";
import { useUrlTab } from "../../hooks/useUrlTab";
import { getTabPanelProps, TabNav, type TabDefinition } from "../ui/TabNav";

type ProfileTabId = "musicas" | "playlists";

const PROFILE_TABS: ReadonlyArray<TabDefinition<ProfileTabId>> = [
  { id: "musicas", label: "Músicas" },
  { id: "playlists", label: "Playlists" },
];
const PROFILE_TAB_IDS = PROFILE_TABS.map((tab) => tab.id);
const TAB_ID_PREFIX = "profile";

interface ProfileContentTabsProps {
  tracksPanel: ReactNode;
  playlistsPanel: ReactNode;
}

export function ProfileContentTabs({ tracksPanel, playlistsPanel }: ProfileContentTabsProps) {
  const [activeTab, selectTab] = useUrlTab(PROFILE_TAB_IDS, "musicas");

  return (
    <div className="w-full px-4 pt-8 pb-6 sm:px-6 lg:px-8">
      <TabNav
        tabs={PROFILE_TABS}
        activeTabId={activeTab}
        onSelect={selectTab}
        idPrefix={TAB_ID_PREFIX}
        ariaLabel="Conteúdo do perfil"
        className="mb-6"
      />
      <div {...getTabPanelProps(TAB_ID_PREFIX, activeTab)}>{activeTab === "musicas" ? tracksPanel : playlistsPanel}</div>
    </div>
  );
}
