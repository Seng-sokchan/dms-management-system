module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: [require.resolve('./jest.setup.js')],
  setupFilesAfterEnv: [],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve(
      '@react-native/jest-preset/jest/assetFileTransformer.js',
    ),
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|react-native-vector-icons)/)',
  ],
  collectCoverageFrom: [
    'src/utils/payment*.{js,jsx}',
    'src/utils/payway*.{js,jsx}',
    'src/utils/resolveAba*.{js,jsx}',
    'src/utils/buildAba*.{js,jsx}',
    'src/utils/openAba*.{js,jsx}',
    'src/utils/checkAba*.{js,jsx}',
    'src/utils/formatPayment*.{js,jsx}',
    'src/services/paymentsApi.jsx',
    'src/hooks/usePayment*.{js,jsx}',
    'src/hooks/useAba*.{js,jsx}',
    'src/components/payment/**/*.{js,jsx}',
  ],
};
