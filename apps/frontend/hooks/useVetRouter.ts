import { useRouter } from "next/navigation";


export type VetRoutes = '/dashboard/sales';

export default function useVetRouter() {

    const router = useRouter();

    return {
        push: (route: VetRoutes) => {
            return router.push(route);
        }
    }
}