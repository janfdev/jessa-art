/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/app',
        destination: '/app.html',
      },
      {
        source: '/resume',
        destination: '/resume.html',
      },
      {
        source: '/mochiboard',
        destination: '/mochiboard.html',
      },
      {
        source: '/luminance',
        destination: '/luminance.html',
      },
      {
        source: '/harbor',
        destination: '/harbor.html',
      },
      {
        source: '/snoot',
        destination: '/snoot.html',
      },
      {
        source: '/somnar',
        destination: '/somnar.html',
      },
      {
        source: '/indent',
        destination: '/indent.html',
      },
      {
        source: '/fisher-price',
        destination: '/fisher-price.html',
      },
      {
        source: '/dipple',
        destination: '/dipple.html',
      },
      {
        source: '/vanta',
        destination: '/vanta.html',
      },
      {
        source: '/ukiniwa',
        destination: '/ukiniwa.html',
      },
      {
        source: '/tandem',
        destination: '/tandem.html',
      },
      {
        source: '/descent',
        destination: '/descent.html',
      },
      {
        source: '/rime',
        destination: '/rime.html',
      },
      {
        source: '/wordpit',
        destination: '/wordpit.html',
      },
      {
        source: '/flourish',
        destination: '/flourish.html',
      },
      {
        source: '/pocketbeam',
        destination: '/pocketbeam.html',
      },
      {
        source: '/bridging',
        destination: '/bridging.html',
      },
      {
        source: '/start',
        destination: '/start.html',
      },
    ];
  },
};

export default nextConfig;
