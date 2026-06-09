import { IPetCreateRequest } from "../../shared/types";
import { ApiResponse } from "../../shared/types/api";

import useFetch from "../hooks/useFetch";

export function useGetKindOfPet() {
  return useFetch<ApiResponse<string[]>>({
    method: "GET",
    path: "/api/pets/kind",
    runOnInit: true,
  });
}


export function useCreatePets() {
  return useFetch<unknown, { data: IPetCreateRequest[] }>({
    method: "POST",
    path: "/api/pets",
  });
}

