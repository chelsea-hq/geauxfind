import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base='https://geauxfind.vercel.app';
  const paths=['','/food','/events','/music','/recipes','/finds','/search','/ask','/this-weekend','/about'];
  return paths.map((p)=>({url:`${base}${p}`,lastModified:new Date()}));
}
