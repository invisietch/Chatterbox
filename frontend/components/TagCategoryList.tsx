import React from "react";
import TagCategoryItem from "./TagCategoryItem";

const TagCategoryList = ({ categories, error, fetchCategories }: any) => {
  return (
    <>
      {error && <p className="text-red-500">{error}</p>}
      {!error && categories.length === 0 && (
        <p className="text-gray-500">No categories found.</p>
      )}
      <div className="space-y-4">
        {categories.map((category: any) => (
          <TagCategoryItem
            key={category.name}
            category={category}
            fetchCategories={fetchCategories}
          />
        ))}
      </div>
    </>
  );
};

export default TagCategoryList;
