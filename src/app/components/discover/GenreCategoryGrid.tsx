import { Link } from "react-router";
import { buildDiscoverPath } from "../../routes/discoverFilters";

const TILE_GRADIENTS = [
  "from-[#ff164c] to-[#5c0a1e]",
  "from-[#ea5858] to-[#3d1416]",
  "from-[#9c2b4c] to-[#1f0d12]",
  "from-[#c2410c] to-[#2b130a]",
  "from-[#7c3aed] to-[#1d1033]",
  "from-[#0f766e] to-[#0a1f1d]",
] as const;

export function GenreCategoryGrid({ genres }: { genres: readonly string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {genres.map((genre, index) => (
        <li key={genre}>
          <Link
            to={buildDiscoverPath({ genres: [genre] })}
            className={`flex h-20 items-end bg-gradient-to-br p-3 text-[16px] font-bold text-white outline-none transition-transform duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white/80 sm:h-24 ${TILE_GRADIENTS[index % TILE_GRADIENTS.length]}`}
          >
            {genre}
          </Link>
        </li>
      ))}
    </ul>
  );
}
