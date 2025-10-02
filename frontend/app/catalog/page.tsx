import { CourseCatalog } from "../components/catalog/CourseCatalog";
import { Navigation } from "../components/common/Navigation";

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <CourseCatalog />
    </div>
  );
}
