import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import TagCategoryList from "../components/TagCategoryList";
import AddTagCategoryForm from "../components/AddTagCategoryForm";
import apiClient from "../lib/api";
import { PlusIcon } from "@heroicons/react/outline";
import { toast } from "react-toastify";

export default function TagCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/tag_categories");
      setCategories(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch categories.");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSaveCategory = async (name: string, color: string, tags: any[]) => {
    try {
      const response = await apiClient.post("/tag_categories", { name, color });

      if (response.status === 200) {
        for (const tag of tags) {
          const response = await apiClient.post(`/tag_categories/${name}/tag/${tag.name}`);

          if (response.status !== 200) {
            throw new Error('Failed to save tags.');
          }

          toast.success('Successfully saved category.');
          fetchCategories();
          setIsAddingCategory(false);
        }
      }
    } catch (error) {
      toast.error("Failed to save category.");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Tag Categories</h1>
          <button
            className="bg-fadedGreen text-white px-4 py-2 rounded hover:bg-brightGreen"
            onClick={() => setIsAddingCategory(true)}
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>
        {isAddingCategory && (
          <AddTagCategoryForm
            onSave={handleSaveCategory}
            onCancel={() => setIsAddingCategory(false)}
          />
        )}
        <TagCategoryList
          categories={categories}
          error={error}
          fetchCategories={fetchCategories}
        />
      </div>
    </Layout>
  );
}
