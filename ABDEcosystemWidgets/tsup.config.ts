import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'api/spaces': 'src/api/spaces.ts',
    'api/groups': 'src/api/groups.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: false,
  treeshake: true,
  platform: 'browser',
  external: [
    'react', 
    'react-dom', 
    'lucide-react', 
    'radix-ui',
    '@ajabadia/styles',
    '@ajabadia/satellite-sdk',
    'mongoose',
    'next',
    'next/link',
    'next/image',
    'next/navigation',
    'next/server',
    'next-intl',
    'sonner',
    'next-themes',
  ],
  onSuccess: async () => {
    const fs = await import('fs');
    const js = fs.readFileSync('dist/index.js', 'utf-8');
    fs.writeFileSync('dist/index.js', '"use client";\n' + js);
    // Adjust sourcemap offset to account for the prepended line
    try {
      const mapPath = 'dist/index.js.map';
      if (fs.existsSync(mapPath)) {
        const map = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        map.mappings = ';' + map.mappings;
        fs.writeFileSync(mapPath, JSON.stringify(map));
      }
    } catch {}
  },
});
