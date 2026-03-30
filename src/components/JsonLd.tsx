type JsonLdPrimitive = string | number | boolean | null;
export type JsonLdValue = JsonLdPrimitive | JsonLdObject | JsonLdValue[] | undefined;
export type JsonLdObject = { [key: string]: JsonLdValue };

interface JsonLdProps<T extends JsonLdObject> {
  data: T;
}

export function JsonLd<T extends JsonLdObject>({ data }: JsonLdProps<T>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
