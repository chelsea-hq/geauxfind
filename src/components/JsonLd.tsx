type JsonLdPrimitive = string | number | boolean | null;
export type JsonLdValue = JsonLdPrimitive | JsonLdObject | JsonLdValue[] | undefined;
export type JsonLdObject = { [key: string]: JsonLdValue };

interface JsonLdProps<T extends JsonLdObject> {
  data: T;
}

export function JsonLd<T extends JsonLdObject>({ data }: JsonLdProps<T>) {
  // JSON.stringify does not escape "<", so a data value containing
  // "</script>" would close the tag early and execute as HTML.
  // < is valid JSON, so parsers and crawlers are unaffected.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
