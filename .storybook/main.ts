import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  staticDirs: ['../public'],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  webpackFinal: async (webpackConfig) => {
    webpackConfig.resolve = webpackConfig.resolve ?? {};
    webpackConfig.resolve.alias = {
      ...(webpackConfig.resolve.alias as Record<string, string> | undefined ?? {}),
      // Resolve @/ imports like tsconfig paths
      '@': path.resolve(__dirname, '../src'),
      // Mock Next.js modules that components may import
      'next/navigation': path.resolve(__dirname, './mocks/next-navigation.js'),
      'next/image': path.resolve(__dirname, './mocks/next-image.js'),
      'next/link': path.resolve(__dirname, './mocks/next-link.js'),
      'next/router': path.resolve(__dirname, './mocks/next-router.js'),
    };
    return webpackConfig;
  },
};

export default config;
