const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const app = express();
const fetch = require("node-fetch");
const base64 = require("base-64");

let username = "";
let password = "";
let token = "";
let cat_arr = [];
let cartItems = []
let reviewsList = []
let products = []
let currPage = ''

USE_LOCAL_ENDPOINT = false;
// set this flag to true if you want to use a local endpoint
// set this flag to false if you want to use the online endpoint
ENDPOINT_URL = "";
if (USE_LOCAL_ENDPOINT) {
  ENDPOINT_URL = "http://127.0.0.1:5000";
} else {
  ENDPOINT_URL = "https://cs571.cs.wisc.edu";
}

async function getToken() {
  let request = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + base64.encode(username + ":" + password),
    },
  };

  const serverReturn = await fetch(ENDPOINT_URL + "/login", request);
  const serverResponse = await serverReturn.json();
  token = serverResponse.token;

  return token;
}

async function fetchCategories() {
  let request = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  };
  let response = await fetch(ENDPOINT_URL + '/categories/', request);
  let result = await response.json();
  cat_arr = result.categories;
  return cat_arr;
}

async function fetchCartItems() {

  let requestOptions = {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  };


  let response = await fetch(ENDPOINT_URL + '/application/products', requestOptions);
  let result = await response.json();
  cartItems = result.products;
  return cartItems;
}

async function fetchProducts() {

  let requestOptions = {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  };


  let response = await fetch(ENDPOINT_URL + '/products', requestOptions);
  let result = await response.json();
  products = result.products;
  return products;
}

async function fetchReviews(id) {

  let requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: "follow"
  };

  let response = await fetch(
    ENDPOINT_URL +  '/products/' + id + "/reviews",
    requestOptions
  );
  let result = await response.json();
  reviewsList = result.reviews;
  return reviewsList;
}

async function increase(id) {

  let requestOptions = {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  };

  await fetch(ENDPOINT_URL + '/application/products/' + id, requestOptions);

  await fetchProducts();
}

async function decrease(id) {
  let requestOptions = {
    method: 'DELETE',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  };

  let response = await fetch(ENDPOINT_URL + '/application/products/' + id, requestOptions);
  console.log(response)

  await fetchProducts();
}

async function clearCart() {
  let requestOptions = {
    method: 'DELETE',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  };

  let response = await fetch(ENDPOINT_URL + '/application/products', requestOptions);
  console.log(response)

  await fetchProducts();
}

async function changePage(newPage) {
  let requestOptions = {
    method: 'PUT',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body: JSON.stringify({
      page: newPage
    }),
    redirect: 'follow'
  };

  let response = await fetch(ENDPOINT_URL + '/application', requestOptions);
  console.log(response)
  currPage = newPage
  await getApplicationUrl();
}

async function getApplicationUrl() {
  let requestOptions = {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  };

  let response = await fetch(ENDPOINT_URL + '/application', requestOptions);
  let result = await response.json();
  console.log('get request:');
  console.log(result)
}

app.get("/", (req, res) => res.send("online"));
app.post("/", express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  function welcome() {
    agent.add("Webhook works!");
  }

  async function login() {
    // You need to set this as the value of the `username` parameter that you defined in Dialogflow
    username = agent.parameters.username;
    // You need to set this as the value of the `password` parameter that you defined in Dialogflow
    password = agent.parameters.password;

    await getToken();

    agent.add(token);
  }

  async function categories() {
    await fetchCategories()
    let sentence = 'You can buy '
    for (let i = 0; i < cat_arr.length; i++) {
      if (i != cat_arr.length - 1)
        sentence += cat_arr[i] + ', '
      else
        sentence += 'and ' + cat_arr[i] + '.'
    }
    agent.add(sentence)
  }

  async function countCartItems() {
    if (token == '') {
      agent.add('You must log in first!')
    } else {
      await fetchCartItems()
      let count = 0
  
      for(const product of cartItems) {
        count += product.count
      }
      agent.add(String(count))
    }

   // agent.add("There are " + String(Object.keys(products).length) + " items in your cart.")
  }

  async function productInfo() {
    await fetchProducts()

    let name = agent.parameters.name
    let question = agent.parameters.question
    let matched = {}

    for (const product of products) {
      if (product.name == name) {
        matched = product;
        break;
      }
    }

    if (question == 'Price') {
      agent.add(String(matched.price) + ' dollars.')
    }

    if (question == 'Description') {
      agent.add(matched.description)
    }

    if (question == 'Reviews') {
      await fetchReviews(matched.id);
      let list = ''
      let num = 0
      if (reviewsList.length > 0) {
        for (const review of reviewsList) {
          num += 1
          list += 'Review ' + num + ': ' + review.stars + '/5. ' + review.title + '. ' + review.text;
        }
        agent.add(list)
      } else {
        agent.add("There are no reviews.")
      }

    }
  }

  async function addToCart() {
    if (token == '') {
      agent.add("You must log in first!")
    } else {
      await fetchProducts()

      let name = agent.parameters.name
      let addOrDelete = agent.parameters.add
      let matched = {}
  
      for (const product of products) {
        if (product.name == name) {
          matched = product;
          break;
        }
      }

      if (matched == {}) {
        agent.add('Product not found')
      }
      else {
        if (addOrDelete == 'Add') {
          await increase(matched.id)
          await fetchCartItems()
          console.log(cartItems)
          agent.add('added to cart!')
        }
        if (addOrDelete == 'Delete') {
          await decrease(matched.id)
          await fetchCartItems()
          agent.add('deleted from cart')
        }
      }

    }
  }

  async function clear() {
    await clearCart();
    console.log(cartItems)
    agent.add('Cart cleared')
  }

  async function reviewCart() {
    if (token == '') {
      agent.add("You must log in first!")
    } else {    
      changePage('/' + username + "/" + 'cart-review');
      await fetchCartItems()
      let num = 0;
      let list = '';
      if (cartItems.length > 0) {
        for (const item of cartItems) {
          num += 1
          list += 'Item ' + num + ': ' + item.name + '. ';
        }
        agent.add(list + "Would you like to confirm your purchase?")
      } else {
        agent.add("There are no items in your cart.")
      }
    }
  }

  async function confirm() {
    if (currPage != '/' + username + "/" + 'cart-review') {
      agent.add('Review your purchase before confirming.')
      await reviewCart();
    } else {
      changePage('/' + username + '/' + 'cart-confirmed')
      agent.add("Purchase confirmed!")
    }
  }

  let intentMap = new Map();
  intentMap.set("Default Welcome Intent", welcome);
  // You will need to declare this `Login` intent in DialogFlow to make this work
  intentMap.set("Login", login);
  intentMap.set("Categories", categories);
  intentMap.set("Items in Cart", countCartItems)
  intentMap.set("Product Info", productInfo)
  intentMap.set("Add or Delete Cart", addToCart)
  intentMap.set("Clear", clear)
  intentMap.set("Review Cart", reviewCart)
  intentMap.set("Confirm", confirm);
  agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 8080);
