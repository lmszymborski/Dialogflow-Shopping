const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const app = express();
const fetch = require("node-fetch");
const base64 = require("base-64");

let username = "";
let password = "";
let token = "";
let cat_arr = [];
let products = []
let reviewsList = []

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

async function fetchProducts() {
  console.log(token)

  let requestOptions = {
    method: 'GET',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    redirect: 'follow'
  };


  let response = await fetch(ENDPOINT_URL + '/application/products', requestOptions);
  console.log(response)
  let result = await response.json();
  console.log(result)
  products = result.products;
  console.log('line 70: ')
  console.log(products)
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
  console.log(response)
  let result = await response.json();
  console.log(result)
  reviewsList = result.reviews;
  return reviewsList;
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

  async function cartItems() {
    if (token == '') {
      agent.add('You must log in first!')
    } else {
      console.log('hello')
      await fetchProducts()
      console.log(products)
      let count = 0
  
      for(const product of products) {
        console.log(product.count)
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

  let intentMap = new Map();
  intentMap.set("Default Welcome Intent", welcome);
  // You will need to declare this `Login` intent in DialogFlow to make this work
  intentMap.set("Login", login);
  intentMap.set("Categories", categories);
  intentMap.set("Items in Cart", cartItems)
  intentMap.set("Product Info", productInfo)
  agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 8080);
