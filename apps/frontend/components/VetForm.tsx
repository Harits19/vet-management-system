import { Form } from "antd";
import {
    Control,
  Controller,
  ControllerProps,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  Path,
} from "react-hook-form";

type FormItemProps = React.ComponentProps<typeof Form.Item>;

type VetFormProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = Omit<ControllerProps<TFieldValues, TName, TTransformedValues>, 'control'> &
  Pick<FormItemProps, "noStyle"> & {
    label?: string;
    control: Control<TFieldValues, any, TTransformedValues>
    children: (
      field: ControllerRenderProps<TFieldValues, TName>,
    ) => React.ReactNode;
  };

export default function VetForm<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  label,
  children,
  noStyle,
  ...controllerProps
}: Omit<VetFormProps<TFieldValues, TName, TTransformedValues>, "render">) {
  return (
    <Controller
      {...controllerProps}
      render={({ field, fieldState }) => (
        <Form.Item
          label={label}
          validateStatus={fieldState.error ? "error" : ""}
          help={fieldState.error?.message}
          noStyle={noStyle}
        >
          {children(field)}
        </Form.Item>
      )}
    />
  );
}
