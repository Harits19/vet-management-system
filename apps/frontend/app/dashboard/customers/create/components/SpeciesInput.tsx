import { useGetKindOfPet } from "@/api/pet.api";
import VetForm from "@/components/VetForm";
import { AutoComplete } from "antd";
import { useState } from "react";
import { Control } from "react-hook-form";
import { CustomerCreateForm } from "../model/validation";

export default function SpeciesInput({
  control,
  index,
}: {
  control: Control<CustomerCreateForm>;
  index: number;
}) {
  const [search, setSearch] = useState("");
  const { data } = useGetKindOfPet();
  const options = search
    ? data?.data.filter((item) =>
        item.toLowerCase().includes(search.toLowerCase()),
      )
    : data?.data;
  return (
    <VetForm
      label="Jenis / Spesies"
      name={`pets.${index}.kind`}
      control={control}
    >
      {(f) => (
        <AutoComplete
          value={search}
          style={{ width: "100%" }}
          placeholder="Contoh: Kucing, Anjing"
          allowClear
          options={options?.map((item) => ({
            label: item,
            value: item,
          }))}
          showSearch={{ searchValue: search, onSearch: setSearch }}
          onSelect={(_, option) => {
            setSearch("");
            f.onChange(option);
          }}
        />
      )}
    </VetForm>
  );
}
