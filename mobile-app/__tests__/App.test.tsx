/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiSet: jest.fn(),
  multiGet: jest.fn(() => Promise.resolve([["dms_mobile_token", ""], ["dms_mobile_user", "null"]])),
  multiRemove: jest.fn(),
}));
jest.mock('react-native-qrcode-svg', () => 'QRCode');

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
