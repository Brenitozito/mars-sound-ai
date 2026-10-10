import { useState } from "react";
import { toast } from "sonner";
import { useAuth, useCurrentUser } from "../../context/AuthContext";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useCatalogOptions } from "../../hooks/useCatalogOptions";
import { ErrorState, LoadingState } from "../feedback/StatusViews";
import { FormErrorMessage } from "../forms/FormControls";
import { Button } from "../ui/button";
import { CategoryChip } from "../ui/CategoryChip";
import { haveSameItems, SettingsPanel, toggleListItem } from "./SettingsPanel";

function ChipGroup({ label, options, selected, onToggle }: { label: string; options: readonly string[]; selected: string[]; onToggle: (option: string) => void }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-[14px] font-semibold leading-[1.5] text-[#bfbbbc]">{label}</legend>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <CategoryChip key={option} label={option} active={selected.includes(option)} onClick={() => onToggle(option)} />
        ))}
      </div>
    </fieldset>
  );
}

export function MusicPreferencesForm() {
  const currentUser = useCurrentUser();
  const { updateProfile } = useAuth();
  const catalog = useCatalogOptions();
  const [favoriteGenres, setFavoriteGenres] = useState(currentUser.favoriteGenres);
  const [moods, setMoods] = useState(currentUser.moods);
  const submission = useAsyncAction();

  const isDirty = !haveSameItems(favoriteGenres, currentUser.favoriteGenres) || !haveSameItems(moods, currentUser.moods);

  const handleSave = async () => {
    const isSuccessful = await submission.run(
      () => updateProfile({ favoriteGenres, moods }),
      "Não foi possível salvar suas preferências.",
    );
    if (isSuccessful) toast.success("Preferências musicais salvas.");
  };

  const renderOptions = () => {
    if (catalog.isLoading && !catalog.catalogOptions) return <LoadingState label="Carregando gêneros e moods..." />;
    if (catalog.errorMessage || !catalog.catalogOptions) {
      return (
        <ErrorState message={catalog.errorMessage ?? "Não foi possível carregar gêneros e moods."} onRetry={catalog.reload} />
      );
    }
    return (
      <>
        <ChipGroup
          label="Gêneros favoritos"
          options={catalog.catalogOptions.genres}
          selected={favoriteGenres}
          onToggle={(genre) => setFavoriteGenres((previous) => toggleListItem(previous, genre))}
        />
        <ChipGroup
          label="Clima"
          options={catalog.catalogOptions.moods}
          selected={moods}
          onToggle={(mood) => setMoods((previous) => toggleListItem(previous, mood))}
        />
      </>
    );
  };

  return (
    <SettingsPanel title="Preferências musicais" description="Usamos suas preferências para personalizar recomendações.">
      {renderOptions()}
      <FormErrorMessage message={submission.errorMessage} />
      <div className="flex justify-end border-t border-[#30292b] pt-4">
        <Button variant="primary" size="touch" onClick={handleSave} disabled={!isDirty || submission.isPending}>
          {submission.isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </SettingsPanel>
  );
}
