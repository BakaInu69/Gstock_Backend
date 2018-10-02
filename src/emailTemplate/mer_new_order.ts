export const generateMerchantNewOrderEmail = (toEmail, status) => {
    return {
        subject: `New order from ${toEmail}`,
        html: `<p>Dear merhcant you have new order that is currently <b>${status}</b></p>`
    };
};