













/*
Copyright (C) 2016 Apple Inc. All Rights Reserved.
See LICENSE.txt for this sample’s licensing information
 
Abstract:
The main client-side JS. Handles displaying the Apple Pay button and requesting a payment.
*/

/**
* This method is called when the page is loaded.
* We use it to show the Apple Pay button as appropriate.
* Here we're using the ApplePaySession.canMakePayments() method,
* which performs a basic hardware check. 
*
* If we wanted more fine-grained control, we could use
* ApplePaySession.canMakePaymentsWithActiveCards() instead.
*/
document.addEventListener('DOMContentLoaded', () => {
	var MERCHANT_IDENTIFIER = "merchant.com.paysafe.atlas";
	if (window.ApplePaySession) {
		ApplePaySession.canMakePaymentsWithActiveCard(MERCHANT_IDENTIFIER).then(function(canMakePayments) {
			if (canMakePayments) {
				showApplePayButton();
			}
		});
	}
});

function showApplePayButton() {
	HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
	const buttons = document.getElementsByClassName("apple-pay-button");
	for (let button of buttons) {
		button.className += " visible";
	}
}


/**
* Apple Pay Logic
* Our entry point for Apple Pay interactions.
* Triggered when the Apple Pay button is pressed
*/
function applePayButtonClicked() {
	const paymentRequest = {
        countryCode: 'US',
        currencyCode: 'USD',
        shippingMethods: [
            {
                label: 'Free Shipping',
                amount: '0.00',
                identifier: 'free',
                detail: 'Delivers in five business days',
            },
            {
                label: 'Express Shipping',
                amount: '5.00',
                identifier: 'express',
                detail: 'Delivers in two business days',
            },
        ],
 
        lineItems: [
            {
                label: 'Shipping',
                amount: '0.00',
            }
        ],
 
        total: {
            label: 'Apple Pay Example',
            amount: '8.99',
        },
 
        supportedNetworks:[ 'amex', 'discover', 'masterCard', 'visa'],
        merchantCapabilities: [ 'supports3DS' ],
 
        //requiredShippingContactFields: [ 'postalAddress', 'email' ],
    };

	const session = new ApplePaySession(2, paymentRequest);
	
	/**
	* Merchant Validation
	* We call our merchant session endpoint, passing the URL to use
	*/
	session.onvalidatemerchant = (event) => {
		console.log("Validate merchant");
		getApplePaySession(event.validationURL).then(function(response) {
  			session.completeMerchantValidation(response);
		});
	};

	/**
	* Payment Authorization
	* Here you receive the encrypted payment data. You would then send it
	* on to your payment provider for processing, and return an appropriate
	* status in session.completePayment()	
	*/
	session.onpaymentauthorized = (event) => {
		// Send payment for processing...
		const payment = event.payment;
		printProperties(event, "event");

		// ...return a status and redirect to a confirmation page
		session.completePayment(ApplePaySession.STATUS_SUCCESS);
	
		var xhr = new XMLHttpRequest();
		xhr.open('POST', '/tokenize');			
		xhr.setRequestHeader("Content-Type", "application/json");
	
		xhr.send(JSON.stringify(payment));
	}

	// All our handlers are setup - start the Apple Pay payment
	session.begin();
}

function getApplePaySession(url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/getApplePaySession');
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(JSON.parse(xhr.response));
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({url: url}));
  });
}

function printProperties(target, path) {
  for (var property in target) {
	var value = target[property];
	if (typeof value === "object") {
	  printProperties(value, path + "." + property);
	} else {
	  printMessage(path + "." + property + ": " + value);
	}
  }
}

function printMessage(data) {
  var div = document.createElement("div");
  div.innerHTML = data;
  document.body.appendChild(div);
}
