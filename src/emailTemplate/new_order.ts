export const generateNewOrderEmail = (toEmail, totalRewardPts) => {
    return {
        subject: "Order successful",
        html: `<p>Thank you ${toEmail} for shopping with Gstock. You have earned ${totalRewardPts} in this deal!</p>`,
    };
};
