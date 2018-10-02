const express = require("express");
import * as request from "request";

// Add your credentials:
// Add your client ID and secret
const CLIENT = "ASV24f_wBMI9hjRLXeWNi7nJ3cOfxKk0OOB-tMIA3DoSCeIzEyEIfW4lvE6kTJPMtu3kE96gre-WauTG";
const SECRET = "EEiHXlRFtKgHCIPtGekscp_YPICUj3MH8Wdl8w0Tj3JEWSey0pf8qRkGSf4pngBqV8VsiI3qknfJjZ7V";
const PAYPAL_API = "https://api.sandbox.paypal.com";

export async function setupPaypalPayment(req, res) {
    // 2. Call /v1/payments/payment to set up the payment
    return new Promise((resolve, reject) =>
    request.post(PAYPAL_API + "/v1/payments/payment", {
      auth: {
        user: CLIENT,
        pass: SECRET
      },
      body: {
        intent: "sale",
        payer: {
          payment_method: "paypal"
        },
        transactions: [{
          amount: {
            total: "5.99",
            currency: "USD"
          }
        }],
        redirect_urls: {
          return_url: "https://www.mysite.com",
          cancel_url: "https://www.mysite.com"
        }
      },
      json: true
    }, function (err, response) {
        if (err) {
          console.error(err);
          return reject(err);
        }
        // 3. Return the payment ID to the client
        resolve({
            id: response.body.id
        });
    }));
  }
  // Execute the payment:
  // 1. Set up a URL to handle requests from the PayPal button.
export async function executePaypalPayment(req, res) {
    // 2. Get the payment ID and the payer ID from the request body.
    const paymentID = req.body.paymentID;
    const payerID   = req.body.payerID;

    // 3. Call /v1/payments/payment/PAY-XXX/execute to finalize the payment.
    return new Promise((resolve, reject) =>
    request.post(PAYPAL_API + "/v1/payments/payment/" + paymentID + "/execute", {
      auth: {
        user: CLIENT,
        pass: SECRET
      },
      body: {
        payer_id: payerID,
        transactions: [{
          amount: {
            total: "10.99",
            currency: "USD"
          }
        }]
      },
      json: true
    }, function (err, response) {
      if (err) {
        console.error(err);
        return reject(err);
      }
      console.log(response);
      // 4. Return a success response to the client
      return resolve({status: "success"});
     }));
    }
