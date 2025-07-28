import { createFileRoute, redirect } from "@tanstack/react-router";
import DatabasesPage from "@/components/databases/DatabasesPage";
import { activeDatabaseViewStore } from "@/state/store/database";

export const Route = createFileRoute("/databases/")({
  component: DatabasesPage,
  beforeLoad: async () => {
    const { database } = activeDatabaseViewStore.getState();
    if (database) {
      throw redirect({
        to: "/databases/$databaseId",
        params: { databaseId: database.title },
      });
    }
    return null;
  },
});
