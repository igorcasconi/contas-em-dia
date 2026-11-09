import "server-only";

import { listNameRecords } from "@/shared/helpers/name-record-actions";

export const listCategories = () => listNameRecords("categories");
