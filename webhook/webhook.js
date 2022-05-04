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
let currCategory = ''

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

  await fetchProducts();
}

async function changePage(newPage) {
  while (await getApplicationUrl() != '/' + username + '/' + newPage) {
    let requestOptions = {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        page: '/' + username + '/' + newPage
      }),
      redirect: 'follow'
    };
  
    let response = await fetch(ENDPOINT_URL + '/application', requestOptions);
    console.log(response)
    currPage = '/' + username + '/' + newPage
    console.log(currPage)
    currCategory = newPage
    //await getApplicationUrl();
  }
}

async function goBack() {
  let requestOptions = {
    method: 'PUT',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body: JSON.stringify({
      back: true
    }),
    redirect: 'follow'
  };

  let response = await fetch(ENDPOINT_URL + '/application', requestOptions);
  console.log(response.page)
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
  console.log('hi')
  console.log(result.page);
  return result.page;
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

    agent.add("You've been logged in! Would you like to see bottoms, hats, leggings, plushes, sweatshirts, tees, or review your cart?");
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
    let matched = {}

    if (name == 'Current') {
      let url = await getApplicationUrl();
      url = url;
      console.log(url)
      console.log(url.length)
      let secondSlash = false;
      let thirdSlash = false;
      let fourthSlash = false;
      let fifthSlash = false;
      let currProduct = ''
      for (var i = 0; i < url.length; i++) {
        console.log('hello in')
        if (url.charAt(i) == '/' && !secondSlash && !thirdSlash) {
          console.log('first slash found: ' + url.charAt(i))
          secondSlash = true;
        }
        else if (url.charAt(i) == '/' && secondSlash && !thirdSlash) {
          console.log('second slash found ' + url.charAt(i))
          thirdSlash = true;
        }
        else if (url.charAt(i) == '/' && secondSlash && thirdSlash && !fourthSlash) {
          console.log('third slash found ' + url.charAt(i))
          fourthSlash = true;
        }
        else if (url.charAt(i) == '/' && secondSlash && thirdSlash && !fifthSlash) {
          console.log('fourth slash found ' + url.charAt(i))
          fifthSlash = true;
        }
        else if (fifthSlash) {
          console.log('adding to currProduct ' + url.charAt(i))
          currProduct += url.charAt(i)
        }
      }

      let id = currProduct;

      for (const product of products) {
        if (product.id == id) {
          matched = product;
          break;
        }
      }
    } else {
      for (const product of products) {
        if (product.name == name) {
          matched = product;
          break;
        }
      }
    }

    let question = agent.parameters.question

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
          list += 'Review ' + num + ': ' + review.stars + '/5. ' + review.title + '. ' + review.text + ' ';
        }
        agent.add(list)
      } else {
        agent.add("There are no reviews.")
      }

    }

    if (question == "Rating") {
      await fetchReviews(matched.id);
      let overall = 0;
      if (reviewsList.length > 0) {
        for (const review of reviewsList) {
          overall += review.stars;
        }
      }
      overall = overall / reviewsList.length;
      agent.add("The overall rating is " + overall + "/5");
    }
  }

  async function addToCart() {
    if (token == '') {
      agent.add("You must log in first!")
    } else {
      await fetchProducts()

      let name = agent.parameters.name;
      let addOrDelete = agent.parameters.add;
      let amount = agent.parameters.number;

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
          for (let i = 0; i < amount; i++)
            await increase(matched.id);
          await fetchCartItems()
          agent.add('added to cart!')
        }
        if (addOrDelete == 'Delete') {
          for (let i = 0; i < amount; i++)
            await decrease(matched.id);
          await fetchCartItems()
          agent.add('deleted from cart')
        }
      }

    }
  }

  async function clear() {
    await clearCart();
    agent.add('Cart cleared')
  }

  async function reviewCart() {
    if (token == '') {
      agent.add("You must log in first!")
    } else {    
      changePage('cart-review');
      await fetchCartItems()
      let num = 0;
      let list = '';
      if (cartItems.length > 0) {
        for (const item of cartItems) {
          num += 1
          list += item.count + " " + item.name + '. ';
        }
        agent.add(list + "Would you like to confirm your purchase?")
      } else {
        agent.add("There are no items in your cart.")
      }
    }
  }

  async function reviewCartNo() {
    agent.add('Okay.')
  }

  async function confirm() {
    if (currPage != '/' + username + "/" + 'cart-review') {
      agent.add('Review your purchase before confirming.')
      await reviewCart();
    } else {
      changePage('cart-confirmed')
      agent.add("Purchase confirmed!")
    }
  }

  async function navigation() {
    if (token == '') {
      agent.add("You must log in first!")
    } else {
      let page = agent.parameters.page.toLowerCase();
      if (page == 'home page') {
        page = ''
      }
      if (page == 'back') {
        await goBack();
        agent.add("Went back");
      } else {
        await changePage(page);
        if (page == '') {
          agent.add("Changed to home page")
        }
        else {
          agent.add("Changed to page " + page)
        }
      }
    }
  }

  async function itemNavigation() {
    if (token == '') {
      agent.add("You must log in first!")
    } else {
      let name = agent.parameters.item;
      let matched = {};
      await fetchProducts();
      for (const product of products) {
        if (product.name == name) {
          matched = product;
          break;
        }
      }
      let page = matched.category + '/products/' + matched.id;
      await changePage(page);
      agent.add("Changed to product page " + matched.name);
    }
  }
  /*
  async function categoryInquiry() {
    if (token == '') {
      agent.add("You must log in first!")
    } else {
      console.log(agent.parameters.pages)
      let category = ''
      if (agent.parameters.pages == 'Current') {
        let url = await getApplicationUrl();
        url = url.page;
        console.log(url)
        console.log(url.length)
        let secondSlash = false;
        let thirdSlash = false;
        currCategory = ''
        for (var i = 0; i < url.length; i++) {
          console.log('hello in')
          if (url.charAt(i) == '/' && !secondSlash && !thirdSlash) {
            console.log('first slash found: ' + url.charAt(i))
            secondSlash = true;
          }
          else if (url.charAt(i) == '/' && secondSlash && !thirdSlash) {
            console.log('second slash found ' + url.charAt(i))
            thirdSlash = true;
          }
          else if (thirdSlash) {
            console.log('adding to currCategory ' + url.charAt(i))
            currCategory += url.charAt(i)
          }
        }
        console.log('currCategory: ' + currCategory)
        category = currCategory;
      } else {
        category = agent.parameters.pages.toLowerCase();
      }
      let inquiry = agent.parameters.inquiry;
  

  
      await fetchCategories();
      await fetchProducts();
      if (inquiry == "amount") {
        let numOfCategory = 0;
        for (const product of products) {
          if (product.category == category) {
            numOfCategory++;
          }
          if (product.id == category) {
            category == product.category;
            break;
          }
        }
        
        if (numOfCategory == 0) {
          for (const product of products) {
            if (product.category == category) {
              numOfCategory++;
            }
          }
        }
  
        console.log(typeof category)
        let singular = category.slice(0, -1)
        console.log(singular)
    
        if (numOfCategory == 0) {
          agent.add("We're confused. Category " + category)
        }
        else {
          await changePage(category);
          if (numOfCategory > 1) {
            agent.add("There are " + numOfCategory + " " + category);
          } if (numOfCategory == 1) {
            agent.add("There is 1 " + singular);
          }
        }
      }
      else {
        let numOfCategory = 0;
        let categoryList = []
        for (const product of products) {
          if (product.category == category) {
            numOfCategory++;
            categoryList.push(product)
          }
          if (product.id == category) {
            category == product.category;
            break;
          }
        }
        
        if (numOfCategory == 0) {
          for (const product of products) {
            if (product.category == category) {
              categoryList.push(product)
            }
          }
        }

        if (numOfCategory == 0) {
          agent.add("We're confused");
        }
        else {
          await changePage(category);
          let sentence = 'Products on page ' + category + ' include'
          for (let i = 0; i < categoryList.length; i++) {
            if (i == categoryList.length - 1) {
              if (categoryList.length == 1) {
                sentence += ' the ' + categoryList[i].name + "."
              } else
                sentence += ' and the ' + categoryList[i].name + ".";
            } else
              sentence += ' the ' + categoryList[i].name + ', ';
          }
          console.log(sentence)
          agent.add(sentence)
        }

      }
    }


  }*/

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
  intentMap.set("Review Cart - no", reviewCartNo);
  intentMap.set("Review Cart - yes", confirm);
  intentMap.set("Confirm", confirm);
  intentMap.set("Navigation", navigation);
  intentMap.set("Item Navigation", itemNavigation);
  //intentMap.set("Category Inquiry", categoryInquiry);
  agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 8080);
