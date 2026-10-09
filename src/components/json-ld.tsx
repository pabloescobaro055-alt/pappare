import {headers} from 'next/headers';
export async function JsonLd({ data }: { data: object }) {
  return (
    <script
      nonce={(await headers()).get('x-nonce')||undefined}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
