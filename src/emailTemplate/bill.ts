export const generateBillEmailToBuyer = (toEmail, status) => {
    return {
        subject: `Bill for ${toEmail}`,
        html: `<p>Dear buyer you have new order that is currently <b>${status}</b></p>`
    };
};