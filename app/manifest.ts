import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Instituto Bíblico Gamaliel',
    short_name: 'Gamaliel',
    description: 'Aula Virtual del Seminario Bíblico Gamaliel',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A1128',
    theme_color: '#0A1128',
    orientation: 'portrait',
    icons: [
      {
        src: '/img/logo_seminario.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/img/logo_seminario.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
  };
}
