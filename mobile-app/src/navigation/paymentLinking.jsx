/** React Navigation deep link config (prefix dms://). PaymentResult is handled by usePaymentDeepLink. */
export const paymentLinking = {
  prefixes: ["dms://"],
  config: {
    screens: {
      Main: {
        screens: {
          OrderPayment: "payment/checkout",
        },
      },
      DepotMain: {
        screens: {
          OrderPayment: "payment/checkout",
        },
      },
    },
  },
};
