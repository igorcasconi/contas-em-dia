import { Suspense } from "react";

import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/domains/categories/actions/categories";
import { listCategories } from "@/domains/categories/services/categories";
import { PageHeader } from "@/shared/components/PageHeader";
import { SimpleNameCrud } from "@/shared/components/SimpleNameCrud";
import { Skeleton } from "@/shared/components/ui/skeleton";

const CategoriesList = async () => (
  <SimpleNameCrud
    items={await listCategories()}
    entityLabel="tipo"
    emptyMessage="Nenhum tipo cadastrado."
    createAction={createCategoryAction}
    updateAction={updateCategoryAction}
    deleteAction={deleteCategoryAction}
  />
);

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Tipos" />
      <Suspense fallback={<Skeleton className="h-32" />}>
        <CategoriesList />
      </Suspense>
    </>
  );
}
