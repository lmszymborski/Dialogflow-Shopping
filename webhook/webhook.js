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
    currPage = '/' + username + '/' + newPage
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
  let page = result.page;
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
        console.log(url)
        let secondSlash = false;
        let thirdSlash = false;
        let fourthSlash = false;
        let fifthSlash = false;
        let currProduct = ''
        for (var i = 0; i < url.length; i++) {
          if (url.charAt(i) == '/' && !secondSlash && !thirdSlash) {
            secondSlash = true;
          }
          else if (url.charAt(i) == '/' && secondSlash && !thirdSlash) {
            thirdSlash = true;
          }
          else if (url.charAt(i) == '/' && secondSlash && thirdSlash && !fourthSlash) {
            fourthSlash = true;
          }
          else if (url.charAt(i) == '/' && secondSlash && thirdSlash && !fifthSlash) {
            fifthSlash = true;
          }
          else if (fifthSlash) {
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
        agentResponse(["Do you want to know the price, description, reviews, or rating?",
          "What do you want to know about it? I know price, description, reviews, and rating.",
          "Okay, do you want to know the price, reviews, rating, or description of the " + matched.name,
          "I know the price, reviews, rating, and description for the " + matched.name])
      } else if (agent.parameters.name != '' || matched != '') {
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
      } else {
        agentResponse(["I don't see an item named " + name,
          "Sorry, couldn't find the item " + name + ". Try again?",
          "Oops, seems I couldn't find the " + name])
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
      let id = ''
  


      if (addOrDelete == '') {
        agentResponse(["Would you like to add or delete that item?",
          "Add or remove?",
          "Okay, should we add it or get rid of it?",
          "Are we adding it or getting rid of it?"])
      }

      if (!agent.parameters.name) {
        let url = await getApplicationUrl();
        let secondSlash = false;
        let thirdSlash = false;
        let fourthSlash = false;
        let fifthSlash = false;
        let currProduct = ''
        for (var i = 0; i < url.length; i++) {
          if (url.charAt(i) == '/' && !secondSlash && !thirdSlash) {
            secondSlash = true;
          }
          else if (url.charAt(i) == '/' && secondSlash && !thirdSlash) {
            thirdSlash = true;
          }
          else if (url.charAt(i) == '/' && secondSlash && thirdSlash && !fourthSlash) {
            fourthSlash = true;
          }
          else if (url.charAt(i) == '/' && secondSlash && thirdSlash && !fifthSlash) {
            fifthSlash = true;
          }
          else if (fifthSlash) {
            currProduct += url.charAt(i)
          }
        }
  
        id = currProduct;
  
        for (const product of products) {
          if (product.id == id) {
            matched = product;
            break;
          }
        }
        
        if (matched == '') {
          agentResponse(["Can you ask that again and include the product name?",
            "And what's the product?",
            "For what product?",
            "Alright, what item?",
            "I can do that, what's the item?"])
        }
      } else {
        for (const product of products) {
          if (product.name == name) {
            matched = product;
            break;
          }
        }
      }

      if (matched != '') {
        console.log('matched')
        console.log(matched)
        if (addOrDelete == 'Add') {
          for (let i = 0; i < amount; i++) {
            await increase(matched.id);
            console.log('added...')
          }
          await fetchCartItems()
          agentResponse(["Added to cart!",
            "Yay! We added " + amount + " of those to your cart!",
            "Cool, you now have it in your cart now!",
            "Successfully added that to your cart!",
            "We've added " + amount + " of those to your cart!"])
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
            agentResponse(["You do not have " + amount + " of " + matched.name + " in your cart to delete!",
              "Wait - you're asking to remove " + amount + " of " + matched.name + " from your cart. You only have " + numInCart + " in your cart!",
              "There's not enough of " + matched.name + " in your cart to delete " + amount + " of them!",
              "You only have " + numInCart + " of " + matched.name + " in your cart."])
          } else {
            for (let i = 0; i < amount; i++)
            await decrease(matched.id);
            await fetchCartItems()
            agentResponse(["Deleted from cart.",
              "Okay, deleted " + amount + " from cart.",
              "We've deleted it.",
              "Deleted " + amount + " " + matched.name + " from cart."])
          }
        }
      } else if (agent.parameters.name && matched == '') {
        agentResponse(["Couldn't find an item named " + name,
          "I couldn't find an item named " + name,
          "Sorry, the name " + name + " isn't in the shop."])
      }

    }
  }

  async function clearMessages() {
    if (token == '') {
      agentResponse(["You must log in first!", 
      "Hold on - please log in!", 
      "I don't know who you are yet! Please log in!", 
      "Wait - you forgot to log in",
      "Quick log in first!"])
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
      agentResponse(["Messages cleared!",
        "Okay, cleared your messages",
        "Your messages have been cleared.",
        "Starting fresh. Getting rid of messages...",
        "Okay, we'll delete those.",
        "All cleared!"])
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
      agentResponse(["Cart cleared!",
        "Okay, cleared your cart",
        "Your cart is now empty.",
        "Okay, we'll start your cart out fresh",
        "Okay, we'll delete everything from your cart.",
        "Emptying your cart...",
        "Cleared!"])
    }
  }

  async function viewCart() {
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
      changePage('cart');
      await fetchCartItems()
      let num = 0;
      let list = '';
      if (cartItems.length > 0) {
        for (const item of cartItems) {
          num += 1
          list += item.count + " " + item.name + '. ';
        }
        agentResponse(['These are the items in your cart: ' + list,
          "Okay, here's what's in your cart: " + list,
          list,
          "Your cart: " + list]);
      } else {
        agentResponse(['There are no items in your cart.',
          'No items in cart',
          'Your cart is empty',
          'Your cart is currently empty',
          "There's nothing in yor cart!"])
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
        agentResponse(["Confirm purchase of " + cartItems.length + " " + plural + ". " + list,
          "Checking out for " + cartItems.length + " " + plural + ": " + list,
          "Please confirm you would like to buy these items: " + list,
          "Your purchase will be the following. " + list + " Proceed?"]) 
      } else {
        agentResponse(['There are no items in your cart.',
          'No items in cart',
          'Your cart is empty',
          'Your cart is currently empty',
          "There's nothing in yor cart!"])
      }
    }
  }

  async function reviewCartNo() {
    if (agent.query != '') {
      updateMessages(true, agent.query);
    }
    agentResponse(["Okay, that will not be purchased.",
      "Got it. What would you like to see now?",
      "Okay, going back to main cart page.",
      "No problem, we won't order that purchase."])
    changePage('cart');
  }


  async function confirm() {
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
      if (currPage != '/' + username + "/" + 'cart-review') {
        agentResponse(["Review your purchase first before confirming your order.",
          "Please check your cart before confirming your purchase",
          "Wait! Please review your cart first.",])
        await reviewCart();
      } else {
        changePage('cart-confirmed')
        agentResponse(["Purchase confirmed!",
          "Your purchase is completed.",
          "You've bought those items.",
          "Order confirmed.",
          "Great, that's ordered for you.",
          "Awesome, I've completed that purchase for you."])
      }
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
      agentResponse(["What page would you like to go to?",
        "Where would you like to go?",
        "Okay, what page do you want to go to?",
        "And what page is that?"])
    } 
    else {
      let page = agent.parameters.page.toLowerCase();
      if (page == 'home page') {
        page = ''
      }
      if (page == 'back') {
        await goBack();
        agentResponse(["Going back...",
          "Okay, taking you to the last page",
          "Here's the last page you were on",
          "Navigating you back"])
      } else {
        let foundPage = false
        let isCategory = false;
        if (page != '') {
          // check if it is a valid category
          await fetchCategories();
          for (const cat of cat_arr) {
            if (cat == page) {
              await changePage(page);
              foundPage = true;
              isCategory = true;
              break;
            }
          }

          // check if it is a product that has been misclassified
          await fetchProducts();
          for (const product of products) {
            if (product.name.toLowerCase() == page) {
              matched = product;
              await changePage(matched.category + '/products/' + matched.id);
              foundPage = true
              break;
            }
          }
        }
        if (foundPage) {
          if (isCategory) {
            let sentence = ''
            let categoryList = []
            for (const product of products) {
              if (product.category == page) {
                categoryList.push(product)
              }
            }
            for (let i = 0; i < categoryList.length; i++) {
              if (i == categoryList.length - 1) {
                if (categoryList.length == 1) {
                  sentence += ' the ' + categoryList[i].name + "."
                } else
                  sentence += ' and the ' + categoryList[i].name + ".";
              } else
                sentence += ' the ' + categoryList[i].name + ', ';
            }
            agentResponse(['Here are the ' + page + ': ' + sentence,
              'Okay, these are the ' + page + ' I found: ' + sentence,
              'Got it. The ' + page + ' are ' + sentence])
          } else {
            agentResponse(["Here is the " + page,
              "Now showing you the " + page,
              "Now on the " + page + ' page',
              "Here you go. Showing you the " + page])
          }
        }
        else if (!foundPage && page != '') { // there is not a valid page with the requested thing
          agentResponse(["Sorry, I don't have a page for " + page + ". I can take you to any category (hats, bottoms, leggings, plushes, sweatshirts, or tees), any product, to your cart, or home",
            "Couldn't find a page for " + page + ". I can take you to category pages hats, bottoms, leggings, plushes, sweatshirts, tees,  any product page, to your cart, or home.",
            "I don't think I understood that. I can navigate you to hats, bottoms, leggings, plushes, sweatshirts, tees, a product page, your cart, or home."])
        }
        else if (page == '') {
          await changePage(page);
          agentResponse(["On home page. There are hats, bottoms, leggings, plushes, sweatshirts, and tees. Or I can take you to your cart.",
            "You're on the home page now. Would you like to see hats, bottoms, leggings plushes, sweatpants, or tees? Or would you like to view your cart.",
            "No problem, you're on the home page now. Where can I navigate you to next? I can show you hats, bottoms, leggings, plushes, sweatshirts, and tees, or I can show you your cart."])
        }
        else {
          agentResponse(["This wasn't supposed to happen. Maybe try another phrase."],
            "Huh, this is weird. Try saying something else.",
            "Okay, that's strange. Try that again.")
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
        agentResponse(["What item do you want to navigate to?",
          "What product is that?",
          "And what's the item?",
          "Okay, what product do you want to see?"])
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
          agentResponse(["Here is the " + matched.name,
            "Now looking at the " + matched.name,
            "Here's that product",
            "Now viewing the " + matched.name])
        } else {
          await fetchCategories();
          let foundPage = false
          for (const cat of cat_arr) {
            if (cat == name) {
              await changePage(name);
              foundPage = true;
              break;
            }
          }
          if (!foundPage) {
            agentResponse(["We couldn't find a product named " + name,
              "Sorry, I couldn't find anything that matched the name " + name, 
              "No products I found were named " + name,
              "Hm, I couldn't find something under the name " + name])
          }
          else {
            let sentence = ''
            let categoryList = []
            for (const product of products) {
              if (product.category == name) {
                categoryList.push(product)
              }
            }
            for (let i = 0; i < categoryList.length; i++) {
              if (i == categoryList.length - 1) {
                if (categoryList.length == 1) {
                  sentence += ' the ' + categoryList[i].name + "."
                } else
                  sentence += ' and the ' + categoryList[i].name + ".";
              } else
                sentence += ' the ' + categoryList[i].name + ', ';
            }
            agentResponse(['Here are the ' + name + ': ' + sentence,
              'Okay, these are the ' + name + ' I found: ' + sentence,
              'Got it. The ' + name + ' are ' + sentence])
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

      let category = ''
      let currCategory = '';

      if (agent.parameters.pages == '') {
        let url = await getApplicationUrl();

        let secondSlash = false;
        let thirdSlash = false;
        for (var i = 0; i < url.length; i++) {
          if (url.charAt(i) == '/' && !secondSlash && !thirdSlash) {
            secondSlash = true;
          }
          else if (url.charAt(i) == '/' && secondSlash && !thirdSlash) {
            thirdSlash = true;
          }
          else if (thirdSlash) {
            currCategory += url.charAt(i)
          }
        }
        category = ''
        for (const thisCategory of cat_arr) {
          if (thisCategory == currCategory) {
            category = currCategory
          }
        }
        if (category == '') {
          agentResponse(["Couldn't find a category",
            "The page you're on is not a category",
            "No category items to look at on this page"])
        }
      } else {
        category = agent.parameters.pages.toLowerCase();
        for (const thisCategory of cat_arr) {
          if (thisCategory == currCategory) {
            category = currCategory
          }
        }
        if (category == '') {
          agentResponse(["Couldn't find a category named " + category + ". You can choose from hats, bottoms, tees, plushes, sweatshirts, and leggings",
            "No category named " + category + ". The categories are hats, bottoms, tees, plushes, sweatshirts, and leggings",
            "Sorry, I couldn't find a category named " + category + ". Try searching for hats, bottoms, tees, plushes, sweatshirts, or leggings"])
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
    
          let singular = category.slice(0, -1)
      
          if (numOfCategory == 0) {
            agentResponse(["We're confused. Category " + category])
          }
          else {
            await changePage(category);
            if (numOfCategory > 1) {
              agentResponse(["There are " + numOfCategory + " " + category,
                "I found " + numOfCategory + " " + category,
                "Seems like there's " + numOfCategory + " " + category])
            } 
            if (numOfCategory == 1) {
              agentResponse(["There is 1 " + singular,
                "Found one " + singular,
                "I was able to find 1 " + singular])
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
            agentResponse(["I'm confused"]);
          }
          else {
            await changePage(category);
            let sentence = ''
            for (let i = 0; i < categoryList.length; i++) {
              if (i == categoryList.length - 1) {
                if (categoryList.length == 1) {
                  sentence += ' the ' + categoryList[i].name + "."
                } else
                  sentence += ' and the ' + categoryList[i].name + ".";
              } else
                sentence += ' the ' + categoryList[i].name + ', ';
            }
            agentResponse(['Here are the ' + category + ': ' + sentence,
              'Okay, these are the ' + category + ' I found: ' + sentence,
              'Got it. The ' + category + ' are ' + sentence])
          }
  
        }
      }

    }


  }

  async function cartCost() {
    if (agent.query != '') {
      updateMessages(true, agent.query);
    }
    await fetchCartItems();

    let totalPrice = 0;
    
    for (const item of cartItems) {
      totalPrice += item.price * item.count;
    }

    if (cartItems.length == 0) {
      agentResponse(["The price of your cart is 0",
        "Your cart is empty, so the current price is 0",
        "Total cost of 0 dollars"])
    }
    else {
      agentResponse(["The price of your cart is " + totalPrice + ' dollars',
        "Total price: " + totalPrice + " dollars",
        totalPrice + " dollars is the total amount in your cart"])
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
