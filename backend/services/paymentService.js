const midtransClient = require("midtrans-client");

const core = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// bikin QRIS
exports.createQrisPayment = async ({
  orderCode,
  total,
}) => {
  const chargeResponse = await core.charge({
    payment_type: "qris",

    transaction_details: {
      order_id: orderCode,
      gross_amount: total,
    },

    qris: {
      acquirer: "gopay",
    },
  });

  const qrAction = chargeResponse.actions?.find(
    (a) => a.name === "generate-qr-code"
  );

  return {
    qr_url: qrAction?.url ?? null,
    payment_token:
      chargeResponse.transaction_id ?? null,
  };
};

// webhook handler
exports.handleMidtransWebhook = async (
  notification
) => {
  return await core.transaction.notification(
    notification
  );
};