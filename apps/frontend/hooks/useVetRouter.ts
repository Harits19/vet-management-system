import { useRouter } from "next/navigation";


type Dashboard = 'dashboard'
type LeafRoute = 'sales' | 'customers' | 'pets'
export type VetRoutes = `/${Dashboard}/${LeafRoute}`;

export default function useVetRouter() {

    const router = useRouter();

    return {
        push: (route: VetRoutes) => {
            return router.push(route);
        }
    }
}