import { useRouter } from "next/navigation";

type CRUDRoute = "create" | "edit" | "";
export type VetRoutes = `/dashboard/product/${CRUDRoute}`;

export default function useVetRouter() {
  const router = useRouter();

  return {
    ...router,
    push: (route: VetRoutes) => {
        return router.push(route);
    },
  };
}
