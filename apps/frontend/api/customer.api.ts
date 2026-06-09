import useFetch from "@/hooks/useFetch";

import { ApiResponse } from "../../shared/types/api";
import { ICustomer, ICustomerCreateRequest, ICustomerListFilter } from "../../shared/types/customer.type";
import { useCreatePets } from "./pet.api";
import { CustomerCreateForm } from "@/app/dashboard/customers/create/model/validation";


export function useGetCustomers(pagination: ICustomerListFilter) {
  return useFetch<ApiResponse<ICustomer[]>>({
    method: "GET",
    path: "/api/customers",
    runOnInit: true,
    params: pagination,
  });
}



export function useCreateCustomer() {
  return useFetch<{ data: { _id: string } }, ICustomerCreateRequest>({
    method: "POST",
    path: "/api/customers",
  });
}


export function useCreateCustomerAndPets() {

  const customer = useCreateCustomer()
  const pets = useCreatePets()

  return {
    loading: customer.loading || pets.loading,
    mutate: async ({ body, onSuccess }: { body: CustomerCreateForm, onSuccess?: () => void }) => {
      const customerResult = await customer.mutate({ body: body, })
      if (!customerResult || !body.pets || body.pets.length === 0) return;
      const petsResult = await pets.mutate({
        body: {
          data: body.pets.map((item) => ({ ...item, customerId: customerResult.data._id }))
        }
      })

      onSuccess?.()
    }
  }
}