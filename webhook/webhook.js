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
let messageId = 0

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

async function updateMessages(isUser, text) {
  let requestOptions = {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
    body: JSON.stringify({
      date: new Date(),
      isUser: isUser,
      text: text,
      id: messageId
    }),
    redirect: 'follow'
  };

  messageId++;
  let response = await fetch(ENDPOINT_URL + '/application/messages', requestOptions);
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
  //while (await getApplicationUrl() != '/' + username + '/' + newPage) {
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
  //}
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
  let page = result.page;
  console.log('page:' + page)
  return page;
}

app.get("/", (req, res) => res.send("online"));
app.post("/", express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  function welcome() {
    agent.add("Webhook works!");
    updateMessages(false, "Webhook works!");
  }

  async function agentResponse(messages) {
    let message = messages[Math.floor(Math.random()*messages.length)]
    agent.add(message);
    updateMessages(false, message);
  }

  async function login() {
    // You need to set this as the value of the `username` parameter that you defined in Dialogflow
    username = agent.parameters.username;
    // You need to set this as the value of the `password` parameter that you defined in Dialogflow
    password = agent.parameters.password;

    await getToken();

    if (token) {
      console.log(token)
      let message1 = "You've been logged in! Would you like to see bottoms, hats, leggings, plushes, sweatshirts, tees, or review your cart?"
      let message2 = "Where would you like to go? See bottoms, hats, leggings, plushes, sweatshirts, tees, or see your cart?"
      let message3 = "You're home! Where to next? Bottoms, hats, leggings, plushes, sweatshirts, or tees? Or do you want to view your cart?"
      let message4 = "Okay, I know who you are. Where do you wanna go from here? There's bottoms, hats, leggings, plushes, sweatshirts, and tees, or you can also view your cart."
      
      agentResponse([message1, message2, message3, message4])
    }

    else {
      agentResponse(["That wasn't correct. Please login again.",
        "I think either I got some of that wrong, or you got some of that wrong. Please try again.",
        "Hm, that wasn't correct. Try logging in again.",
        "I didn't find an account with those credentials!"])
    }


  }

  async function categories() {
    if (agent.query != '') {
      updateMessages(true, agent.query);
    }

    await fetchCategories()
    let sentence = ''
    for (let i = 0; i < cat_arr.length; i++) {
      if (i != cat_arr.length - 1)
        sentence += cat_arr[i] + ', '
      else
        sentence += 'and ' + cat_arr[i] + '.'
    }
    await agentResponse(['You can buy ' + sentence, 
      'There are the categories: ' + sentence, 
      'This is all of them! ' + sentence, 
      sentence,
      sentence + " - that's all of em!",
      "We have tons here - " + sentence])
  }

  async function countCartItems() {
    if (agent.query != '') {
      updateMessages(true, agent.query);
    }

    if (token == '') {
      agentResponse(["You must log in first!", 
        "Hold on - please log in!", 
        "I don't know who you are yet! Please log in!", 
        "Wait - you forgot to log in",
        "Quick log in first!"])
    } else {
      await fetchCartItems()
      let count = 0
  
      for(const product of cartItems) {
        count += product.count
      }
      let plural = 'items'
      if (count == 1) {
        plural = 'item';
      }

      let strCount = String(count)

      await agentResponse([strCount, 
        "You have " + strCount + ' items',
        strCount + " " + plural + " in cart",
        "There's " + strCount + " " + plural + " in there",
        strCount + ' ' + plural])
    }

  }

  async function productInfo() {
    if (agent.query != '') {
      updateMessages(true, agent.query);
    }

    if (token == '') {
      agentResponse(["You must log in first!", 
        "Hold on - please log in!", 
        "I don't know who you are yet! Please log in!", 
        "Wait - you forgot to log in",
        "Quick log in first!"])
    }
    else {
      await fetchProducts()

      let name = agent.parameters.name
      let matched = ''

      if (name == '') {
        let url = await getApplicationUrl();
        console.log(await getApplicationUrl());
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
        console.log(matched);
        console.log(typeof matched);
        if (matched == '' && agent.parameters.question != '') {
          agentResponse(["What is the product?", 
            "And what product do you want that info for?",
            "Okay - what item though?",
            "I don't know the product yet!",
            "Got it - but what item?"])
        }
      } else {
        for (const product of products) {
          if (product.name == name) {
            matched = product;
            break;
          }
        }
      } if (agent.parameters.question == '' && matched == '') {
        agentResponse(["What product and what do you want to know?",
          "Okay, so you want product info - what product and do you want the price, description, reviews, or rating?",
          "Can you give me a bit more info? What's the name and what do you want to know about it?"]);
      }
      else if (agent.parameters.question == '' && matched != '') {
        console.log(matched);
        agentResponse(["Do you want to know the price, description, reviews, or rating?",
          "What do you want to know about it? I know price, description, reviews, and rating.",
          "Okay, do you want to know the price, reviews, rating, or description of the " + matched.name,
          "I know the price, reviews, rating, and description for the " + matched.name])
      } else if (agent.parameters.name != '' || matched != '') {
        console.log(matched != '')
        console.log(matched);
        let question = agent.parameters.question.toLowerCase()
  
        if (question == 'price') {
          let strPrice = String(matched.price) + ' dollars'
          agentResponse([strPrice,
            "That's " + strPrice,
            "Price for that is " + strPrice,
            strPrice + " for the " + matched.name])
        }
    
        else if (question == 'description') {
          agentResponse([matched.description,
            "Here's the description: " + matched.description])
        }
        else if (question == 'reviews') {
          await fetchReviews(matched.id);
          let list = ''
          let num = 0
          if (reviewsList.length > 0) {
            for (const review of reviewsList) {
              num += 1
              list += 'Review ' + num + ': ' + review.stars + '/5. ' + review.title + '. ' + review.text + ' ';
            }
            agentResponse([list])
          } else {
            agentResponse(["There are no reviews", 
              "Sorry, no reviews for that item",
              "No reviews for item " + matched.name + ", sorry",
              "No reviews yet",
              "Oops! Looks like there aren't any reviews yet."])
          }
        }
        else if (question == "rating") {
          await fetchReviews(matched.id);
          if (reviewsList.length > 0) {
          let overall = 0;
          if (reviewsList.length > 0) {
            for (const review of reviewsList) {
              overall += review.stars;
            }
          }
          overall = overall / reviewsList.length;
          overall = Math.round(overall * 10) / 10
          agentResponse(["The overall rating is " + overall + "/5",
            "Average rating is " + overall + "/5",
            "Okay - the rating is " + "/5",
            overall + "/5"])
        } else {
          agentResponse(["There are no ratings", 
          "Sorry, no ratngs for that item",
          "No ratings for item " + matched.name + ", sorry",
          "No ratings yet",
          "Oops! Looks like there aren't any ratings yet."])
        }
  
        }
  
        else {
          agentResponse(["Hm, I see you want to know " + question + ", but that's not something I have the details on. I do know the reviews, rating, price, or description",
          question + " isn't something I have info for. Can you rephase? I know reviews, rating, price, and description"],
          "I didn't quite get that. Did you mean the reviews, rating, price, or description?",
          "You asked for the " + question + "? I don't have that, but I do have information on the reviews, rating, price, and description.")
        }
      }
    }
  }

  async function addToCart() {
    if (agent.query != '') {
      updateMessages(true, agent.query);
    }
    if (token == '') {
      agentResponse(["You must log in first!", 
        "Hold on - please log in!", 
        "I don't know who you are yet! Please log in!", 
        "Wait - you forgot to log in",
        "Quick log in first!"])
    } else {
      await fetchProducts()

      let name = agent.parameters.name;
      let addOrDelete = agent.parameters.add;
      let amount = agent.parameters.number;

      let matched = ''
  
      for (const product of products) {
        if (product.name == name) {
          matched = product;
          break;
        }
      }

      if (addOrDelete == '') {
        agent.add("Would you like to add or delete that item?");
        updateMessages(false, "Would you like to add or delete that item?")
      }

      if (agent.parameters.name == '') {
        let url = await getApplicationUrl();
        console.log(await getApplicationUrl());
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
        console.log(matched);
        console.log(typeof matched);
        if (matched == '') {
          agent.add("What is the product?");
          updateMessages(false, "What is the product?");
        }
      }
      if (matched != '') {
        if (addOrDelete == 'Add') {
          for (let i = 0; i < amount; i++)
            await increase(matched.id);
          await fetchCartItems()
          agent.add('added to cart!')
          updateMessages(false, 'added to cart!')
        }
        if (addOrDelete == 'Delete') {
          await fetchCartItems();
          let numInCart = 0
          for (const item of cartItems) {
            if (item.name == matched.name) {
              numInCart = item.count;
              break;
            }
          }
          if (numInCart < amount) {
            agent.add("You do not have " + amount + " of " + matched.name + " in your cart to delete!");
            updateMessages(false, "You do not have " + amount + " of " + matched.name + " in your cart to delete!")
          } else {
            for (let i = 0; i < amount; i++)
            await decrease(matched.id);
            await fetchCartItems()
            agent.add('deleted from cart')
            updateMessages(false, 'deleted from cart')
          }
        }
      }

    }
  }

  async function clearMessages() {
    if (token == '') {
      agentResponse("You must log in first!", 
      "Hold on - please log in!", 
      "I don't know who you are yet! Please log in!", 
      "Wait - you forgot to log in",
      "Quick log in first!")
    }
    else {
      let requestOptions = {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        redirect: 'follow'
      };
    
      messageId++;
      let response = await fetch(ENDPOINT_URL + '/application/messages', requestOptions);
    
      agent.add("Messages cleared!")

    }

  }

  async function clear() {
    if (agent.query != '') {
      updateMessages(true, agent.query)
    } if (token == '') {
      agentResponse(["You must log in first!", 
        "Hold on - please log in!", 
        "I don't know who you are yet! Please log in!", 
        "Wait - you forgot to log in",
        "Quick log in first!"])
    } else {
      await clearCart();
      agent.add('Cart cleared')
      updateMessages(false, 'Cart cleared')
    }
  }

  async function viewCart() {
    if (agent.query != '') {
      updateMessages(true, agent.query)
    }
    if (token == '') {
      agent.add("You must log in first!")
      updateMessages(false, "You must log in first!")
    } else {    
      changePage('cart');
      await fetchCartItems()
      let num = 0;
      let list = '';
      if (cartItems.length > 0) {
        for (const item of cartItems) {
          num += 1
          list += item.count + " " + item.name + '. ';
        }
        agent.add(list)
        updateMessages(false, list)
      } else {
        agent.add("There are no items in your cart.")
        updateMessages(false, "There are no items in your cart.")
      }
    }
  }

  async function reviewCart() {
    if (agent.query != '') {
      updateMessages(true, agent.query)
    }
    if (token == '') {
      agentResponse(["You must log in first!", 
        "Hold on - please log in!", 
        "I don't know who you are yet! Please log in!", 
        "Wait - you forgot to log in",
        "Quick log in first!"])
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
        let plural = "items"
        if (cartItems.length == 1) {
          plural = "item"
        }
        agent.add("Confirm purchase of " + cartItems.length + " " + plural + ". " + list + "Would you like to confirm your purchase?")
        updateMessages(false, "Confirm purchase of " + cartItems.length + " " + plural + ". " + list + "Would you like to confirm your purchase?")
      } else {
        agent.add("There are no items in your cart.")
        updateMessages(false, "There are no items in your cart.")
      }
    }
  }

  async function reviewCartNo() {
    if (agent.query != '') {
      updateMessages(true, agent.query);
    }
    agent.add('Okay.')
    updateMessages(false, 'Okay.')
  }


  async function confirm() {
    if (agent.query != '') {
      updateMessages(true, agent.query);
    }

    if (currPage != '/' + username + "/" + 'cart-review') {
      agent.add('Review your purchase before confirming.')
      updateMessages(false, 'Review your purchase before confirming.')
      await reviewCart();
    } else {
      changePage('cart-confirmed')
      agent.add("Purchase confirmed!")
      updateMessages(false, 'Purchase confirmed!')
    }
  }

  async function navigation() {
    if (agent.query != '') {
      updateMessages(true, agent.query);
    }

    if (token == '') {
      agentResponse(["You must log in first!", 
        "Hold on - please log in!", 
        "I don't know who you are yet! Please log in!", 
        "Wait - you forgot to log in",
        "Quick log in first!"])
    } 
    else if (agent.parameters.page == '') {
      agent.add("What page would you like to go to?")
      updateMessages(false, "What page would you like to go to?")
    } 
    else {
      let page = agent.parameters.page.toLowerCase();
      if (page == 'home page') {
        page = ''
      }
      if (page == 'back') {
        await goBack();
        agent.add("Going back...");
        updateMessages(false, "Going back...")
      } else {
        await changePage(page);
        if (page == '') {
          agent.add("Taking you home...")
          updateMessages(false, "Taking you home...")
        }
        else {
          agent.add("Here you go!")
          updateMessages(false, "Here you go!")
        }
      }
    }
  }

  async function itemNavigation() {
    if (agent.query != '') {
      updateMessages(true, agent.query);
    }
    if (token == '') {
      agentResponse(["You must log in first!", 
        "Hold on - please log in!", 
        "I don't know who you are yet! Please log in!", 
        "Wait - you forgot to log in",
        "Quick log in first!"])
    } else {
      let name = agent.parameters.item;
      if (name == '') {
        agent.add('What item do you want to navigate to?')
        updateMessages(false, 'What item do you want to navigate to?')
      } else {
        let matched = '';
        await fetchProducts();
        for (const product of products) {
          if (product.name == name) {
            matched = product;
            break;
          }
        }

        if (matched != '') {
          let page = matched.category + '/products/' + matched.id;
          await changePage(page);
          agent.add("Here is the " + matched.name);
          updateMessages(false, "Here is the " + matched.name)
        } else {
          await fetchCategories();
          let sentence = ''
          for (const cat of cat_arr) {
            if (cat == name) {
              await changePage(name);
              sentence = 'Changing pages!';
              break;
            }
          }
          if (sentence == '') {
            agent.add("We couldn't find a product named " + name);
            updateMessages(false, "We couldn't find a page named " + name)
          }
          else {
            agent.add(sentence);
            updateMessages(false, sentence);
          }
        }

      }

    }
  }
  
  async function categoryInquiry() {
    if (agent.query != '') {
      updateMessages(true, agent.query)
    }
    if (token == '') {
      agentResponse(["You must log in first!", 
        "Hold on - please log in!", 
        "I don't know who you are yet! Please log in!", 
        "Wait - you forgot to log in",
        "Quick log in first!"])
    } else {
      await fetchCategories();

      console.log(agent.parameters.pages)
      let category = ''
      let currCategory = '';

      if (agent.parameters.pages == '') {
        let url = await getApplicationUrl();
        console.log(url)
        console.log(url.length)

        let secondSlash = false;
        let thirdSlash = false;
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
        category = ''
        console.log(categories)
        for (const thisCategory of cat_arr) {
          if (thisCategory == currCategory) {
            category = currCategory
          }
        }
        if (category == '') {
          agent.add("That is not a category.")
          updateMessages(false, "That is not a category.")
        }
      } else {
        category = agent.parameters.pages.toLowerCase();
        for (const thisCategory of cat_arr) {
          if (thisCategory == currCategory) {
            category = currCategory
          }
        }
        if (category == '') {
          agent.add("That is not a category.");
          updateMessages(false, "That is not a category.")
        }
      } if (category != '') {
        let inquiry = agent.parameters.inquiry;
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
            updateMessages(false,"We're confused. Category " + category )
          }
          else {
            await changePage(category);
            if (numOfCategory > 1) {
              agent.add("There are " + numOfCategory + " " + category);
              updateMessages(false, "There are " + numOfCategory + " " + category)
            } if (numOfCategory == 1) {
              agent.add("There is 1 " + singular);
              updateMessages(false, "There is 1 " + singular)
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
            updateMessages(false, "We're confused")
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
            updateMessages(false, sentence)
          }
  
        }
      }

    }


  }

  async function cartCost() {
    await fetchCartItems();

    let totalPrice = 0;
    
    for (const item of cartItems) {
      totalPrice += item.price;
    }

    if (cartItems.length == 0) {
      agent.add("The price of your cart is 0");
    }
    else {
      agent.add("The price of your cat is " + totalPrice + ' dollars')
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
  intentMap.set("Review Cart - no", reviewCartNo);
  intentMap.set("Review Cart - yes", confirm);
  intentMap.set("Navigation", navigation);
  intentMap.set("Item Navigation", itemNavigation);
  intentMap.set("View Cart", viewCart)
  intentMap.set("Category Inquiry", categoryInquiry);
  intentMap.set("Clear Messages", clearMessages)
  intentMap.set("Cart Cost", cartCost)

  agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 8080);
