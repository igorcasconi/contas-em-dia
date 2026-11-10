import "server-only";

import { listNameRecords } from "@/shared/helpers/name-record-actions";

export const listBanks = () => listNameRecords("banks");
